import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { FreezeGuard } from "../security/freeze.guard";

const VALID_FREQUENCIES = ["weekly", "biweekly", "monthly"];

/**
 * Scheduled Remittance
 *
 * Diaspora users can set up recurring transfers to family in Haiti.
 * The cron processor (scheduler/remittance.scheduler.ts) runs daily
 * and executes due transfers via executeFxTransfer().
 */
@Controller("v1/remittance")
export class ScheduledRemittanceController {
  /**
   * POST /v1/remittance/schedule
   * Create a new recurring remittance.
   */
  @UseGuards(SupabaseGuard, FreezeGuard)
  @Post("schedule")
  async createSchedule(
    @Req() req: any,
    @Body()
    body: {
      recipientUserId: string;
      familyLinkId?: string;
      amountUsd: number;
      frequency: string;
      note?: string;
    },
  ) {
    const senderUserId = req.localUser?.id || req.user?.sub;

    if (!body.amountUsd || body.amountUsd <= 0) {
      throw new Error("Amount must be positive");
    }

    if (!VALID_FREQUENCIES.includes(body.frequency)) {
      throw new Error(
        `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(", ")}`,
      );
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: body.recipientUserId },
      select: { id: true, firstName: true, kId: true },
    });
    if (!recipient) throw new Error("Recipient not found");

    // If familyLinkId provided, verify it belongs to this sender
    if (body.familyLinkId) {
      const link = await prisma.familyLink.findFirst({
        where: {
          id: body.familyLinkId,
          diasporaUserId: senderUserId,
          familyUserId: body.recipientUserId,
        },
      });
      if (!link) throw new Error("Family link not found or does not match");
    }

    // Verify sender has a USD wallet
    const senderWallet = await prisma.wallet.findFirst({
      where: { userId: senderUserId, currency: "USD", type: "USER" },
    });
    if (!senderWallet)
      throw new Error("You need a USD wallet to schedule remittances");

    // Calculate first run date based on frequency
    const nextRunAt = computeNextRun(body.frequency);

    const schedule = await prisma.scheduledTransfer.create({
      data: {
        senderUserId,
        recipientUserId: body.recipientUserId,
        familyLinkId: body.familyLinkId,
        amountUsd: body.amountUsd,
        frequency: body.frequency,
        nextRunAt,
        note: body.note,
      },
    });

    return {
      ok: true,
      schedule: {
        id: schedule.id,
        amountUsd: Number(schedule.amountUsd),
        frequency: schedule.frequency,
        nextRunAt: schedule.nextRunAt,
        recipientName: recipient.firstName || recipient.kId,
        note: schedule.note,
      },
    };
  }

  /**
   * GET /v1/remittance/schedules
   * List all scheduled remittances for the current user.
   */
  @UseGuards(SupabaseGuard)
  @Get("schedules")
  async listSchedules(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const schedules = await prisma.scheduledTransfer.findMany({
      where: { senderUserId: userId },
      orderBy: { nextRunAt: "asc" },
      include: {
        User_ScheduledTransfer_recipientUserIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            kId: true,
            phone: true,
          },
        },
      },
    });

    return {
      ok: true,
      schedules: schedules.map((s) => ({
        id: s.id,
        amountUsd: Number(s.amountUsd),
        frequency: s.frequency,
        status: s.status,
        nextRunAt: s.nextRunAt,
        lastRunAt: s.lastRunAt,
        failureCount: s.failureCount,
        note: s.note,
        User_ScheduledTransfer_recipientUserIdToUser: s.User_ScheduledTransfer_recipientUserIdToUser,
        createdAt: s.createdAt,
      })),
    };
  }

  /**
   * POST /v1/remittance/schedule/:id/pause
   * Pause an active schedule.
   */
  @UseGuards(SupabaseGuard)
  @Post("schedule/:id/pause")
  async pauseSchedule(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const schedule = await prisma.scheduledTransfer.findFirst({
      where: { id, senderUserId: userId },
    });
    if (!schedule) throw new Error("Schedule not found");
    if (schedule.status !== "active")
      throw new Error("Only active schedules can be paused");

    await prisma.scheduledTransfer.update({
      where: { id },
      data: { status: "paused" },
    });

    return { ok: true };
  }

  /**
   * POST /v1/remittance/schedule/:id/resume
   * Resume a paused schedule.
   */
  @UseGuards(SupabaseGuard)
  @Post("schedule/:id/resume")
  async resumeSchedule(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const schedule = await prisma.scheduledTransfer.findFirst({
      where: { id, senderUserId: userId },
    });
    if (!schedule) throw new Error("Schedule not found");
    if (schedule.status !== "paused")
      throw new Error("Only paused schedules can be resumed");

    // Re-calculate next run from now
    const nextRunAt = computeNextRun(schedule.frequency);

    await prisma.scheduledTransfer.update({
      where: { id },
      data: { status: "active", nextRunAt, failureCount: 0 },
    });

    return { ok: true };
  }

  /**
   * POST /v1/remittance/schedule/:id/cancel
   * Cancel a schedule permanently.
   */
  @UseGuards(SupabaseGuard)
  @Post("schedule/:id/cancel")
  async cancelSchedule(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const schedule = await prisma.scheduledTransfer.findFirst({
      where: { id, senderUserId: userId },
    });
    if (!schedule) throw new Error("Schedule not found");
    if (schedule.status === "canceled")
      throw new Error("Schedule already canceled");

    await prisma.scheduledTransfer.update({
      where: { id },
      data: { status: "canceled" },
    });

    return { ok: true };
  }
}

/**
 * Compute the next run date based on frequency.
 * weekly = 7 days, biweekly = 14 days, monthly = 30 days.
 */
function computeNextRun(frequency: string): Date {
  const now = new Date();
  const daysMap: Record<string, number> = {
    weekly: 7,
    biweekly: 14,
    monthly: 30,
  };
  const days = daysMap[frequency] || 30;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}
