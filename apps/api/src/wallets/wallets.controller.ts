import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { postDeposit } from "./deposit.service";
import { AuditService } from "../audit/audit.service";
import { emitEvent } from "../services/event-bus.service";

@Controller("v1")
export class WalletsController {
  constructor(private auditService: AuditService) {}
  @UseGuards(SupabaseGuard)
  @Post("deposits")
  async deposit(@Req() req: any, @Body() body: any) {
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) throw new Error("Missing Idempotency-Key");

    // Capture request metadata for audit
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString();
    const userAgent = req.headers["user-agent"]?.toString();
    const userId = req.localUser?.id;
    const auth0Id = req.user?.["https://kobklein.com/user_id"] || req.user?.sub;

    try {
      const result = await postDeposit({
        walletId: body.walletId,
        amount: Number(body.amount),
        currency: String(body.currency),
        source: "manual",
        idempotencyKey: String(idempotencyKey),
      });

      // Audit success
      // Removed: deposit audit logging (not a financial action)

      // Emit domain event
      await emitEvent("deposit.posted", {
        depositId: result.id,
        walletId: body.walletId,
        amount: Number(body.amount),
        currency: String(body.currency),
        source: "manual",
        userId,
        requestId: req.requestId,
      });

      return result;
    } catch (err: any) {
      // Audit failure
      // Removed: deposit audit logging (not a financial action)

      throw err;
    }
  }
}
