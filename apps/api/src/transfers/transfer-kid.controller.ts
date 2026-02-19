import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { executeTransfer } from "./transfer-execution.service";
import { AuditService } from "../audit/audit.service";

/**
 * Transfer by K-ID — K-Send
 *
 * Resolves the recipient by their K-ID (KP-XXXXXX) and delegates
 * to the existing executeTransfer() engine for atomic settlement.
 *
 * POST /v1/transfers/kid
 */
@Controller("v1/transfers")
export class TransferByKIdController {
  constructor(private auditService: AuditService) {}

  @UseGuards(SupabaseGuard, FreezeGuard)
  @Post("kid")
  async transferByKId(
    @Req() req: any,
    @Body()
    body: {
      toKId: string;
      amount: number;
      currency: string;
      idempotencyKey: string;
    },
  ) {
    const senderUser = req.localUser;
    if (!senderUser) throw new Error("Sender not found");

    if (!body.idempotencyKey) throw new Error("Missing idempotencyKey");
    if (!body.toKId) throw new Error("Missing toKId");
    if (!body.amount || body.amount <= 0) throw new Error("Invalid amount");

    // Resolve recipient by K-ID
    const recipientUser = await prisma.user.findUnique({
      where: { kId: body.toKId },
    });
    if (!recipientUser) throw new Error("K-ID not found");

    if (recipientUser.id === senderUser.id) {
      throw new Error("Cannot transfer to yourself");
    }

    // Delegate to the existing transfer engine
    // (handles balance check, frozen check, double-entry ledger,
    //  idempotency, notifications, cache invalidation, contact upsert)
    const result = await executeTransfer({
      senderUserId: senderUser.id,
      recipientUserId: recipientUser.id,
      amount: body.amount,
      currency: body.currency,
      idempotencyKey: body.idempotencyKey,
    });

    // Audit log
    await this.auditService.logFinancialAction({
      actorUserId: senderUser.id,
      eventType: "k_send",
      amount: body.amount,
      currency: body.currency,
      referenceId: result.transferId,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      meta: {
        toKId: body.toKId,
        recipientUserId: recipientUser.id,
        deduplicated: result.deduplicated,
      },
    });

    return {
      ok: true,
      transferId: result.transferId,
      deduplicated: result.deduplicated,
      User_ScheduledTransfer_recipientUserIdToUser: {
        kId: recipientUser.kId,
        firstName: recipientUser.firstName,
        handle: recipientUser.handle,
      },
    };
  }
}
