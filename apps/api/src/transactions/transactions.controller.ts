import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { postTransfer } from "./transfer.service";
import { enforceTransferVelocity, flagRisk } from "../fraud/risk.service";
import { redis } from "../services/redis.client";
// Removed: auditLog import (legacy controller)
import { emitEvent } from "../services/event-bus.service";

@Controller("v1")
export class TransactionsController {
  @UseGuards(Auth0Guard)
  @Post("transfers")
  async transfer(@Req() req: any, @Body() body: any) {
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) throw new Error("Missing Idempotency-Key header");

    const userId = req.localUser?.id;
    if (!userId) throw new Error("Missing local user");

    // Capture request metadata for audit
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString();
    const userAgent = req.headers["user-agent"]?.toString();
    const auth0Id = req.user?.["https://kobklein.com/user_id"] || req.user?.sub;

    // Enforce velocity limits before processing
    await enforceTransferVelocity(userId);

    // Track failed attempts and audit
    try {
      const result = await postTransfer({
        fromWalletId: body.fromWalletId,
        toWalletId: body.toWalletId,
        amount: Number(body.amount),
        currency: String(body.currency),
        idempotencyKey: String(idempotencyKey),
      });

      // Removed: audit logging (legacy controller)

      // Emit domain event
      await emitEvent("transfer.posted", {
        transferId: result.id,
        fromWalletId: body.fromWalletId,
        toWalletId: body.toWalletId,
        amount: Number(body.amount),
        currency: String(body.currency),
        userId,
        requestId: req.requestId,
      });

      return result;
    } catch (err: any) {
      // Track failures in Redis
      const failKey = `risk:xfer_fail:${userId}`;
      const fails = await redis.incr(failKey);
      if (fails === 1) await redis.expire(failKey, 600); // 10 minutes window

      if (fails >= 5) {
        await flagRisk({
          userId,
          type: "failed_attempts",
          severity: 2,
          details: { fails, windowSeconds: 600 },
        });
      }

      // Removed: audit logging (legacy controller)

      throw err;
    }
  }
}

