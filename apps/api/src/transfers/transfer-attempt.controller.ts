import { BadRequestException, Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { AuditService } from "../audit/audit.service";
import { evaluateTransactionRisk } from "../risk/risk-engine.service";
import { createOtpChallenge } from "../otp/otp-challenge.service";
import { executeTransfer } from "./transfer-execution.service";
import { withIdempotency } from "../idempotency/idempotency.service";
import { checkSendLimit } from "../limits/spending-limits.service";
import { getTransferFee, getRoleCurrency } from "../fees/fee-engine.service";
import { getActiveFxRate } from "../fx/fx.service";
import { prisma } from "../db/prisma";
import { createNotification } from "../notifications/notification.service";

@Controller("v1/transfers")
export class TransferAttemptController {
  constructor(private auditService: AuditService) {}

  /**
   * Step 1: Attempt a transfer.
   *
   * Returns a full preview (fee, FX rate, received amount) so the
   * frontend can show exactly what will happen before confirmation.
   *
   * - Low risk  → execute immediately, returns ok + preview
   * - Medium    → OTP step-up, returns challengeId + preview
   * - High      → freeze + block
   */
  @UseGuards(SupabaseGuard, FreezeGuard)
  @Post("attempt")
  async attempt(
    @Req() req: any,
    @Body() body: {
      recipientUserId: string;
      amount: number;
      currency: string; // sender's currency (fromCurrency)
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) throw new BadRequestException("Missing Idempotency-Key");

    const ip =
      req.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip;

    // ── Resolve sender + recipient ───────────────────────────────
    const [senderUser, recipientUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, kycTier: true },
      }),
      prisma.user.findUnique({
        where: { id: body.recipientUserId },
        select: { role: true },
      }),
    ]);

    if (!recipientUser) throw new BadRequestException("Recipient not found");

    const fromRole     = senderUser?.role   ?? "CLIENT";
    const toRole       = recipientUser.role ?? "CLIENT";
    const fromCurrency = body.currency.toUpperCase();

    // Detect recipient's currency from their actual wallet (not just role assumption)
    const recipientWallet = await prisma.wallet.findFirst({
      where: { userId: body.recipientUserId, type: "USER" },
    });
    const toCurrency = recipientWallet?.currency?.toUpperCase()
      ?? getRoleCurrency(toRole);

    // ── FX preview ───────────────────────────────────────────────
    let fxRate         = 1;
    let receivedAmount = body.amount;

    if (fromCurrency !== toCurrency) {
      try {
        if (fromCurrency === "USD" && toCurrency === "HTG") {
          fxRate         = await getActiveFxRate("USD", "HTG");
          receivedAmount = Math.round(body.amount * fxRate * 100) / 100;
        } else if (fromCurrency === "HTG" && toCurrency === "USD") {
          const usdToHtg = await getActiveFxRate("USD", "HTG");
          fxRate         = 1 / usdToHtg;
          receivedAmount = Math.round(body.amount * fxRate * 10000) / 10000;
          if (receivedAmount < 0.01) {
            throw new BadRequestException(
              `Amount too small: ${body.amount} HTG = $${receivedAmount.toFixed(4)} USD. ` +
              `You need at least ${Math.ceil(0.01 / fxRate)} HTG. ` +
              `(Rate: 1 USD = ${usdToHtg} HTG)`,
            );
          }
        }
      } catch (e) {
        if (e instanceof BadRequestException) throw e;
        throw new BadRequestException(
          `Exchange rate unavailable for ${fromCurrency}→${toCurrency}. Please try again.`,
        );
      }
    }

    // ── Fee lookup ───────────────────────────────────────────────
    const feeResult = await getTransferFee({
      fromRole,
      toRole,
      fromCurrency,
      toCurrency,
      amount: body.amount,
    });
    const feeAmount = feeResult.feeAmount;

    // ── Spending limit check (amount + fee) ──────────────────────
    await checkSendLimit(userId, body.amount + feeAmount);

    // ── Risk evaluation ──────────────────────────────────────────
    const risk = await evaluateTransactionRisk({
      userId,
      amount: body.amount,
      currency: fromCurrency,
      recipientUserId: body.recipientUserId,
      isNewDevice: req.security?.isNewDevice === true,
      ip,
    });

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "risk_evaluated",
      amount: body.amount,
      currency: fromCurrency,
      referenceId: "transfer_attempt",
      ip,
      userAgent: req.headers?.["user-agent"],
      meta: { score: risk.score, reasons: risk.reasons, riskLevel: risk.riskLevel },
    });

    // ── Shared preview returned to frontend ──────────────────────
    const preview = {
      fromCurrency,
      toCurrency,
      sentAmount: body.amount,
      receivedAmount,
      fxRate,
      isCrossCurrency: fromCurrency !== toCurrency,
      fee: feeAmount,
      feeCurrency: feeResult.feeCurrency,
      totalDeducted: body.amount + feeAmount,
      corridorLabel: feeResult.corridorLabel,
    };

    // ── HIGH RISK ────────────────────────────────────────────────
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
        currency: fromCurrency,
        ip,
        meta: { reasons: risk.reasons, score: risk.score },
      });
      throw new BadRequestException(
        "High-risk transfer blocked. Account frozen for protection.",
      );
    }

    // ── MEDIUM RISK → OTP step-up ────────────────────────────────
    if (risk.riskLevel === "medium") {
      const { challengeId, otpCode } = await createOtpChallenge({
        userId,
        purpose: "transfer",
        payload: {
          recipientUserId: body.recipientUserId,
          amount: body.amount,
          currency: fromCurrency,
          toCurrency,
          fee: feeAmount,
          feeCurrency: feeResult.feeCurrency,
          idempotencyKey,
        },
      });

      return {
        otpRequired: true,
        challengeId,
        otpCode,
        riskLevel: risk.riskLevel,
        riskScore: risk.score,
        preview,
      };
    }

    // ── LOW RISK → execute immediately ───────────────────────────
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
          currency: fromCurrency,
          toCurrency,
          fee: feeAmount,
          idempotencyKey: String(idempotencyKey),
        });
        return {
          ok: true,
          transferId: transfer.transferId,
          riskLevel: risk.riskLevel,
          riskScore: risk.score,
          preview,
        };
      },
    });

    return result;
  }
}
