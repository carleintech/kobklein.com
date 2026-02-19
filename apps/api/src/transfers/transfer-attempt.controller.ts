import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { AuditService } from "../audit/audit.service";
import { evaluateTransactionRisk } from "../risk/risk-engine.service";
import { createOtpChallenge } from "../otp/otp-challenge.service";
import { executeTransfer } from "./transfer-execution.service";
import { withIdempotency } from "../idempotency/idempotency.service";
import { checkSendLimit } from "../limits/spending-limits.service";
import { prisma } from "../db/prisma";
import { createNotification } from "../notifications/notification.service";

@Controller("v1/transfers")
export class TransferAttemptController {
  constructor(private auditService: AuditService) {}

  /**
   * Step 1: Attempt a transfer.
   * - Low risk  → execute immediately
   * - Medium    → send OTP, return challengeId
   * - High      → freeze + block
   */
  @UseGuards(SupabaseGuard, FreezeGuard)
  @Post("attempt")
  async attempt(
    @Req() req: any,
    @Body() body: {
      recipientUserId: string;
      amount: number;
      currency: string;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) throw new Error("Missing Idempotency-Key");

    const ip =
      req.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip;

    // Check KYC-based spending limits
    await checkSendLimit(userId, body.amount);

    // Evaluate risk
    const risk = await evaluateTransactionRisk({
      userId,
      amount: body.amount,
      currency: body.currency,
      recipientUserId: body.recipientUserId,
      isNewDevice: req.security?.isNewDevice === true,
      ip,
    });

    // Audit the risk evaluation
    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "risk_evaluated",
      amount: body.amount,
      currency: body.currency,
      referenceId: "transfer_attempt",
      ip,
      userAgent: req.headers?.["user-agent"],
      meta: {
        score: risk.score,
        reasons: risk.reasons,
        riskLevel: risk.riskLevel,
      },
    });

    // HIGH RISK → freeze + block
    if (risk.riskLevel === "high") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isFrozen: true,
          freezeReason: `High risk transfer: ${risk.reasons.join(", ")}`,
          frozenAt: new Date(),
        },
      });

      await createNotification(
        userId,
        "Account Frozen",
        "We detected high-risk activity and froze your account for protection.",
        "security",
      );

      await this.auditService.logFinancialAction({
        actorUserId: userId,
        eventType: "account_frozen_high_risk",
        amount: body.amount,
        currency: body.currency,
        ip,
        meta: { reasons: risk.reasons, score: risk.score },
      });

      throw new Error("High-risk transfer blocked. Account frozen for protection.");
    }

    // MEDIUM RISK → OTP step-up
    if (risk.riskLevel === "medium") {
      const challengeId = await createOtpChallenge({
        userId,
        purpose: "transfer",
        payload: {
          recipientUserId: body.recipientUserId,
          amount: body.amount,
          currency: body.currency,
          idempotencyKey,
        },
      });

      return {
        otpRequired: true,
        challengeId,
        riskLevel: risk.riskLevel,
        riskScore: risk.score,
      };
    }

    // LOW RISK → execute immediately (with idempotency)
    const result = await withIdempotency({
      userId,
      route: "POST:/v1/transfers/attempt",
      key: String(idempotencyKey),
      body,
      run: async () => {
        const transfer = await executeTransfer({
          senderUserId: userId,
          recipientUserId: body.recipientUserId,
          amount: body.amount,
          currency: body.currency,
          idempotencyKey: String(idempotencyKey),
        });

        return {
          ok: true,
          transferId: transfer.transferId,
          riskLevel: risk.riskLevel,
          riskScore: risk.score,
        };
      },
    });

    return result;
  }
}
