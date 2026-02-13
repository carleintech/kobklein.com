import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { sendByPhone } from "./phone-transfer.service";
import { getContacts, checkPhone } from "./contact.service";
import { enforceTransferVelocity } from "../fraud/risk.service";
// Removed: auditLog import (legacy controller)
import { emitEvent } from "../services/event-bus.service";

/**
 * @deprecated LEGACY — This controller uses the raw-SQL postTransfer pipeline.
 * New clients should use POST /v1/transfers/attempt + /v1/transfers/confirm
 * which goes through executeTransfer (Prisma-based, with risk/OTP step-up).
 * Kept for backward compatibility with older mobile app versions.
 */
@Controller("v1")
export class SendController {
  @UseGuards(Auth0Guard)
  @Post("send")
  async send(@Req() req: any, @Body() body: any) {
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) throw new Error("Missing Idempotency-Key");

    const userId = req.localUser?.id;
    if (!userId) throw new Error("Missing local user");

    const ip = req.ip || req.headers["x-forwarded-for"]?.toString();
    const userAgent = req.headers["user-agent"]?.toString();
    const auth0Id = req.user?.sub;

    await enforceTransferVelocity(userId);

    try {
      const result = await sendByPhone({
        senderUserId: userId,
        recipientPhone: body.phone,
        amount: Number(body.amount),
        currency: body.currency || "HTG",
        idempotencyKey: String(idempotencyKey),
      });

      // Removed: audit logging (legacy controller)

      await emitEvent("transfer.posted", {
        transferId: result.id,
        phone: body.phone,
        amount: Number(body.amount),
        currency: body.currency || "HTG",
        userId,
      });

      return result;
    } catch (err: any) {
      // Removed: audit logging (legacy controller)
      throw err;
    }
  }

  @UseGuards(Auth0Guard)
  @Get("contacts")
  async contacts(@Req() req: any, @Query("limit") limit?: string) {
    const userId = req.localUser?.id;
    if (!userId) throw new Error("Missing local user");
    return getContacts(userId, Number(limit) || 20);
  }

  @UseGuards(Auth0Guard)
  @Get("contacts/check")
  async checkContact(@Req() req: any, @Query("phone") phone: string) {
    if (!phone) throw new Error("Phone parameter required");
    const user = await checkPhone(phone);
    return { found: !!user, user: user ? { firstName: user.firstName, lastName: user.lastName, handle: user.handle } : null };
  }
}
