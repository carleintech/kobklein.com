import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";
import { invalidateBalance } from "../wallets/balance.service";
import { createNotification } from "../notifications/notification.service";
import { AuditService } from "../audit/audit.service";

/**
 * Admin Transfer Review Queue
 *
 * When the risk engine flags a transfer as "blocked", it's created
 * with status = "pending_review". Admins can approve (execute it)
 * or reject (refund the hold).
 */
@Controller("v1/admin/transfers")
export class TransferReviewController {
  constructor(private auditService: AuditService) {}

  /**
   * GET /v1/admin/transfers/pending
   * List all transfers awaiting admin review.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("pending")
  async pendingTransfers(@Query("limit") limit?: string) {
    const take = Math.min(parseInt(limit || "50", 10), 200);

    const transfers = await prisma.transfer.findMany({
      where: { status: "pending_review" },
      orderBy: { createdAt: "desc" },
      take,
    });

    // Enrich with sender/recipient info
    const userIds = [
      ...new Set(transfers.map((t) => t.senderUserId)),
    ];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        kId: true,
        firstName: true,
        lastName: true,
        phone: true,
        isFrozen: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      ok: true,
      count: transfers.length,
      transfers: transfers.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        currency: t.currency,
        status: t.status,
        senderUserId: t.senderUserId,
        sender: userMap.get(t.senderUserId) || null,
        fromWalletId: t.fromWalletId,
        toWalletId: t.toWalletId,
        riskEventId: t.riskEventId,
        createdAt: t.createdAt,
      })),
    };
  }

  /**
   * GET /v1/admin/transfers/:id/detail
   * Get full detail of a pending transfer including risk event.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get(":id/detail")
  async transferDetail(@Param("id") id: string) {
    const transfer = await prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new Error("Transfer not found");

    // Fetch risk event if linked
    let riskEvent: Awaited<ReturnType<typeof prisma.riskEvent.findUnique>> = null;
    if (transfer.riskEventId) {
      riskEvent = await prisma.riskEvent.findUnique({
        where: { id: transfer.riskEventId },
      });
    }

    // Fetch sender + recipient user info
    const [sender, recipientWallet] = await Promise.all([
      prisma.user.findUnique({
        where: { id: transfer.senderUserId },
        select: {
          id: true,
          kId: true,
          firstName: true,
          lastName: true,
          phone: true,
          isFrozen: true,
          kycTier: true,
          role: true,
        },
      }),
      prisma.wallet.findUnique({
        where: { id: transfer.toWalletId },
        select: { userId: true },
      }),
    ]);

    const recipient = recipientWallet
      ? await prisma.user.findUnique({
          where: { id: recipientWallet.userId },
          select: {
            id: true,
            kId: true,
            firstName: true,
            lastName: true,
            phone: true,
            isFrozen: true,
          },
        })
      : null;

    return {
      ok: true,
      transfer: {
        ...transfer,
        amount: Number(transfer.amount),
      },
      sender,
      recipient,
      riskEvent,
    };
  }

  /**
   * POST /v1/admin/transfers/:id/approve
   * Approve a held transfer — execute the ledger entries.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/approve")
  async approveTransfer(
    @Param("id") id: string,
    @Body() body: { adminUserId: string; note?: string },
  ) {
    const transfer = await prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "pending_review") {
      throw new Error(`Transfer is ${transfer.status}, not pending_review`);
    }

    // Execute the held transfer — create ledger entries now
    await prisma.$transaction(async (tx) => {
      // Create the double-entry ledger (was deferred during hold)
      await tx.ledgerEntry.createMany({
        data: [
          {
            walletId: transfer.fromWalletId,
            amount: -Number(transfer.amount),
            type: "transfer_out",
            transferId: transfer.id,
            reference: "approved_after_review",
          },
          {
            walletId: transfer.toWalletId,
            amount: Number(transfer.amount),
            type: "transfer_in",
            transferId: transfer.id,
            reference: "approved_after_review",
          },
        ],
      });

      // Update transfer status
      await tx.transfer.update({
        where: { id },
        data: {
          status: "completed",
          reviewedBy: body.adminUserId,
          reviewedAt: new Date(),
          reviewNote: body.note,
        },
      });
    });

    // Invalidate caches
    await invalidateBalance(transfer.fromWalletId);
    await invalidateBalance(transfer.toWalletId);

    // Notify sender
    await createNotification(
      transfer.senderUserId,
      "Transfer Approved",
      `Your transfer of ${Number(transfer.amount)} ${transfer.currency} has been reviewed and approved.`,
      "transfer",
    );

    // Audit
    await this.auditService.logFinancialAction({
      actorUserId: body.adminUserId,
      eventType: "transfer_approved",
      amount: Number(transfer.amount),
      currency: transfer.currency,
      referenceId: transfer.id,
      meta: { note: body.note },
    });

    return { ok: true };
  }

  /**
   * POST /v1/admin/transfers/:id/reject
   * Reject a held transfer — release the hold, no ledger entries.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/reject")
  async rejectTransfer(
    @Param("id") id: string,
    @Body() body: { adminUserId: string; reason: string },
  ) {
    if (!body.reason) throw new Error("Rejection reason is required");

    const transfer = await prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "pending_review") {
      throw new Error(`Transfer is ${transfer.status}, not pending_review`);
    }

    // Release the hold if one was placed
    const holdEntry = await prisma.ledgerEntry.findFirst({
      where: { transferId: transfer.id, type: "hold_debit" },
    });

    await prisma.$transaction(async (tx) => {
      // If there was a hold, release it
      if (holdEntry) {
        await tx.ledgerEntry.create({
          data: {
            walletId: transfer.fromWalletId,
            amount: Math.abs(Number(holdEntry.amount)),
            type: "hold_release",
            transferId: transfer.id,
            reference: `rejected:${body.reason}`,
          },
        });
      }

      await tx.transfer.update({
        where: { id },
        data: {
          status: "blocked",
          reviewedBy: body.adminUserId,
          reviewedAt: new Date(),
          reviewNote: body.reason,
        },
      });
    });

    // Invalidate sender balance (hold released)
    await invalidateBalance(transfer.fromWalletId);

    // Notify sender
    await createNotification(
      transfer.senderUserId,
      "Transfer Rejected",
      `Your transfer of ${Number(transfer.amount)} ${transfer.currency} was rejected: ${body.reason}. Any held funds have been released.`,
      "transfer",
    );

    // Audit
    await this.auditService.logFinancialAction({
      actorUserId: body.adminUserId,
      eventType: "transfer_rejected",
      amount: Number(transfer.amount),
      currency: transfer.currency,
      referenceId: transfer.id,
      meta: { reason: body.reason },
    });

    return { ok: true };
  }

  /**
   * GET /v1/admin/transfers/stats
   * Quick stats about the review queue.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("stats")
  async reviewStats() {
    const [pendingCount, blockedToday, approvedToday] = await Promise.all([
      prisma.transfer.count({ where: { status: "pending_review" } }),
      prisma.transfer.count({
        where: {
          status: "blocked",
          reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.transfer.count({
        where: {
          status: "completed",
          reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      ok: true,
      stats: {
        pendingReview: pendingCount,
        blockedToday,
        approvedToday,
      },
    };
  }
}
