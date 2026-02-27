import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";
import { AuditService } from "../audit/audit.service";
import { enqueueNotification } from "../notifications/notification.queue";

const VALID_ROLES = ["client", "diaspora", "merchant", "distributor", "admin"];
const VALID_CHANNELS = ["push", "email", "sms"];

/**
 * Admin Broadcast Manager
 * POST /v1/admin/broadcast  — send a message to all users or a role segment
 */
@Controller("v1/admin/broadcast")
@UseGuards(SupabaseGuard, RolesGuard)
@Roles("admin")
export class AdminBroadcastController {
  constructor(private auditService: AuditService) {}

  @Post()
  async broadcast(
    @Req() req: any,
    @Body()
    body: {
      subject: string;
      message: string;
      channel: "push" | "email" | "sms";
      targetRole?: string;
      /** max recipients cap for safety */
      limit?: number;
    },
  ) {
    const { subject, message, channel, targetRole, limit = 500 } = body;

    if (!subject || !message || !channel) {
      throw new BadRequestException("subject, message and channel are required");
    }
    if (!VALID_CHANNELS.includes(channel)) {
      throw new BadRequestException(`channel must be one of: ${VALID_CHANNELS.join(", ")}`);
    }
    if (targetRole && !VALID_ROLES.includes(targetRole)) {
      throw new BadRequestException(`targetRole must be one of: ${VALID_ROLES.join(", ")}`);
    }

    const users = await prisma.user.findMany({
      where: {
        isFrozen: false,
        ...(targetRole ? { role: targetRole } : {}),
      },
      select: { id: true, email: true, phone: true },
      take: Math.min(limit, 500),
    });

    let queued = 0;
    for (const user of users) {
      const to =
        channel === "email"
          ? user.email
          : channel === "sms"
            ? user.phone
            : user.id; // push uses userId

      if (!to) continue;

      await enqueueNotification({
        channel,
        to,
        body: message,
        subject,
        type: "admin_broadcast",
        data: { adminId: req.localUser?.id, targetRole: targetRole ?? "all" },
        attempt: 0,
        userId: user.id,
      });
      queued++;
    }

    await this.auditService.logFinancialAction({
      actorUserId: req.localUser?.id,
      eventType: "admin_broadcast",
      meta: { channel, targetRole: targetRole ?? "all", queued, subject },
    });

    return { ok: true, queued, channel, targetRole: targetRole ?? "all" };
  }
}
