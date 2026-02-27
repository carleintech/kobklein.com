import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { prisma } from "../db/prisma";
import { executeTransfer } from "../transfers/transfer-execution.service";
import { createNotification } from "../notifications/notification.service";

// Daily limit for emergency sends (USD)
const EMERGENCY_DAILY_LIMIT_USD = 200;

/**
 * POST /v1/family/emergency-send
 *
 * "Voye Pou Yo" — One-click emergency send to the designated emergency family contact.
 * No PIN/OTP required IF the contact is marked as isFavorite + isEmergencyContact.
 * Daily limit: $200 USD (hard cap, no override).
 *
 * Idempotency keys for emergency sends always follow the pattern:
 *   "emergency:{diasporaUserId}:{timestamp}"
 * This allows us to track daily totals without a separate Transfer.type field.
 *
 * Body: { amountUsd: number }
 */
@Controller("v1/family")
@UseGuards(SupabaseGuard, FreezeGuard)
export class EmergencySendController {
  @Post("emergency-send")
  async emergencySend(
    @Req() req: any,
    @Body() body: { amountUsd?: number; amount?: number },
  ) {
    const diasporaUserId = req.localUser?.id || req.user?.sub;
    // Accept both `amountUsd` (from web/mobile) and `amount` (legacy)
    const amount = Number(body.amountUsd ?? body.amount ?? 0);

    if (!amount || amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    if (amount > EMERGENCY_DAILY_LIMIT_USD) {
      throw new BadRequestException(
        `Emergency send limit is $${EMERGENCY_DAILY_LIMIT_USD} USD per transaction`,
      );
    }

    // ── Find emergency contact (isFavorite AND isEmergencyContact) ──────────
    const emergencyLink = await prisma.familyLink.findFirst({
      where: {
        diasporaUserId,
        isEmergencyContact: true,
        isFavorite:         true,
      },
      include: {
        familyUser: {
          select: { id: true, firstName: true, lastName: true, handle: true },
        },
      },
    });

    if (!emergencyLink) {
      throw new ForbiddenException(
        "No emergency contact set. Go to Family settings to designate one (must be a Favorite).",
      );
    }

    // ── Daily limit check ────────────────────────────────────────────────────
    // Emergency sends use idempotency keys prefixed "emergency:{userId}:" so we
    // can sum only emergency sends without a separate Transfer.type column.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEmergency = await prisma.transfer.aggregate({
      where: {
        senderUserId:   diasporaUserId,
        idempotencyKey: { startsWith: `emergency:${diasporaUserId}:` },
        status:         { in: ["completed", "posted", "pending", "pending_review"] },
        createdAt:      { gte: today },
      },
      _sum: { amount: true },
    });

    const todayTotal = Number(todayEmergency._sum.amount ?? 0);
    if (todayTotal + amount > EMERGENCY_DAILY_LIMIT_USD) {
      const remaining = Math.max(0, EMERGENCY_DAILY_LIMIT_USD - todayTotal);
      throw new BadRequestException(
        `Daily emergency send limit reached ($${EMERGENCY_DAILY_LIMIT_USD} USD). ` +
          `You have $${remaining.toFixed(2)} remaining today.`,
      );
    }

    // ── Execute transfer via shared execution pipeline ───────────────────────
    const idempotencyKey = `emergency:${diasporaUserId}:${Date.now()}`;

    const result = await executeTransfer({
      senderUserId:    diasporaUserId,
      recipientUserId: emergencyLink.familyUserId,
      amount,
      currency:        "USD",
      idempotencyKey,
      skipRiskCheck:   true, // Emergency sends bypass risk evaluation
    });

    // ── Notify recipient ─────────────────────────────────────────────────────
    const recipientName =
      [emergencyLink.familyUser.firstName, emergencyLink.familyUser.lastName]
        .filter(Boolean)
        .join(" ") ||
      emergencyLink.familyUser.handle ||
      "your family";

    await createNotification(
      emergencyLink.familyUserId,
      "Emergency Transfer Received 🚨",
      `$${amount} USD was sent to you as an emergency transfer.`,
      "incoming_transfer",
    ).catch(() => {
      // Notification failure should not block the transfer response
    });

    return {
      ok:                  true,
      transferId:          result.transferId,
      amount,
      currency:            "USD",
      to:                  recipientName,
      toHandle:            emergencyLink.familyUser.handle,
      remainingDailyLimit: Math.max(0, EMERGENCY_DAILY_LIMIT_USD - todayTotal - amount),
    };
  }
}
