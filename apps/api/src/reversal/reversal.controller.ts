import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { reverseTransfer, reverseDeposit, reverseWithdrawal } from "./reversal.service";
import { AuditService } from "../audit/audit.service";

@Controller("admin/reversal")
export class ReversalController {
  constructor(private auditService: AuditService) {}
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("transfer")
  async transferReversal(@Req() req: any, @Body() body: any) {
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) throw new Error("Missing Idempotency-Key");

    const result = await reverseTransfer({
      transferId: String(body.transferId),
      reason: String(body.reason || "admin reversal"),
      idempotencyKey: String(idempotencyKey),
      adminUserId: req.localUser.id,
      requestId: req.requestId,
    });

    // Audit logging for transfer reversal
    await this.auditService.logFinancialAction({
      actorUserId: req.localUser.id,
      eventType: "transfer_reversal",
      amount: result.amount,
      currency: result.currency,
      fromWalletId: result.fromWalletId,
      toWalletId: result.toWalletId,
      referenceId: result.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      meta: { originalTransferId: body.transferId, reason: body.reason },
    });

    return result;
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("deposit")
  async depositReversal(@Req() req: any, @Body() body: any) {
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) throw new Error("Missing Idempotency-Key");

    return reverseDeposit({
      depositId: String(body.depositId),
      reason: String(body.reason || "admin deposit reversal"),
      idempotencyKey: String(idempotencyKey),
      adminUserId: req.localUser.id,
      requestId: req.requestId,
    });
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("withdrawal")
  async withdrawalReversal(@Req() req: any, @Body() body: any) {
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) throw new Error("Missing Idempotency-Key");

    return reverseWithdrawal({
      withdrawalId: String(body.withdrawalId),
      reason: String(body.reason || "admin withdrawal reversal"),
      idempotencyKey: String(idempotencyKey),
      adminUserId: req.localUser.id,
      requestId: req.requestId,
    });
  }
}
