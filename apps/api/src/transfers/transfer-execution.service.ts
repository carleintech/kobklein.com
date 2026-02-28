import { prisma } from "../db/prisma";
import { invalidateBalance } from "../wallets/balance.service";
import { createNotification } from "../notifications/notification.service";
import { emitEvent } from "../services/event-bus.service";
import { evaluateTransactionRisk } from "../risk/risk-engine.service";
import { getActiveFxRate } from "../fx/fx.service";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute available balance from ledger entries (total − holds).
 */
function computeAvailable(entries: { amount: any; type: string }[]): number {
  let total = 0;
  let held  = 0;
  for (const e of entries) {
    total += Number(e.amount);
    if (e.type === "hold_debit")   held += Math.abs(Number(e.amount));
    if (e.type === "hold_release") held -= Math.abs(Number(e.amount));
    if (e.type === "hold_seize")   held -= Math.abs(Number(e.amount));
  }
  return total - Math.max(0, held);
}

/**
 * Single source of truth for executing a transfer.
 *
 * Supports:
 *  - Same-currency transfers (HTG→HTG, USD→USD)
 *  - Cross-currency transfers (HTG→USD, USD→HTG) with live FX rates
 *  - Optional flat fee deduction (in sender's currency → TREASURY wallet)
 *
 * Resolves wallets fresh at execution time by userId + currency.
 */
export async function executeTransfer(params: {
  senderUserId: string;
  recipientUserId: string;
  amount: number;          // amount the sender sends (in fromCurrency)
  currency: string;        // sender's currency (fromCurrency)
  toCurrency?: string;     // recipient's currency — detected automatically if omitted
  idempotencyKey: string;
  fee?: number;            // flat fee in sender's currency (already validated)
  riskContext?: {
    ip?: string;
    userAgent?: string;
    isNewDevice?: boolean;
  };
  skipRiskCheck?: boolean;
}) {
  const {
    senderUserId,
    recipientUserId,
    amount,
    currency,
    idempotencyKey,
    fee = 0,
    riskContext,
    skipRiskCheck,
  } = params;

  if (amount <= 0) throw new Error("Amount must be positive");
  if (senderUserId === recipientUserId) throw new Error("Cannot transfer to yourself");

  // Idempotency check
  const existing = await prisma.transfer.findUnique({ where: { idempotencyKey } });
  if (existing) return { transferId: existing.id, deduplicated: true };

  // ── Resolve wallets by currency ──────────────────────────────────
  // Sender wallet: find by userId + fromCurrency
  const senderWallet = await prisma.wallet.findFirst({
    where: { userId: senderUserId, currency: currency.toUpperCase() },
  }) ?? await prisma.wallet.findFirst({
    where: { userId: senderUserId, type: "USER" },
  });

  if (!senderWallet) throw new Error("Sender wallet not found");
  const fromCurrency = senderWallet.currency.toUpperCase();

  // Recipient wallet: use toCurrency if specified, otherwise detect from their wallet
  let recipientWallet: typeof senderWallet | null = null;
  if (params.toCurrency) {
    recipientWallet = await prisma.wallet.findFirst({
      where: { userId: recipientUserId, currency: params.toCurrency.toUpperCase() },
    });
  }
  if (!recipientWallet) {
    // Auto-detect: prefer same currency, fall back to their primary wallet
    recipientWallet = await prisma.wallet.findFirst({
      where: { userId: recipientUserId, currency: fromCurrency },
    }) ?? await prisma.wallet.findFirst({
      where: { userId: recipientUserId, type: "USER" },
    });
  }
  if (!recipientWallet) throw new Error("Recipient wallet not found");
  const toCurrency = recipientWallet.currency.toUpperCase();

  // ── Freeze checks ────────────────────────────────────────────────
  const [sender, recipient] = await Promise.all([
    prisma.user.findUnique({
      where: { id: senderUserId },
      select: { isFrozen: true, firstName: true, phone: true, role: true },
    }),
    prisma.user.findUnique({
      where: { id: recipientUserId },
      select: { isFrozen: true, firstName: true, phone: true, role: true },
    }),
  ]);
  if (sender?.isFrozen)    throw new Error("Sender account is frozen");
  if (recipient?.isFrozen) throw new Error("Recipient account is frozen");

  // ── FX rate (only for cross-currency) ───────────────────────────
  let fxRate   = 1;
  let toAmount = amount; // amount recipient receives (in toCurrency)

  if (fromCurrency !== toCurrency) {
    if (fromCurrency === "USD" && toCurrency === "HTG") {
      fxRate   = await getActiveFxRate("USD", "HTG");
      toAmount = Math.round(amount * fxRate * 100) / 100;
    } else if (fromCurrency === "HTG" && toCurrency === "USD") {
      const usdToHtg = await getActiveFxRate("USD", "HTG");
      fxRate   = 1 / usdToHtg;           // HTG→USD rate
      toAmount = Math.round(amount * fxRate * 10000) / 10000; // 4 decimal places for USD
      // Enforce minimum meaningful USD amount
      if (toAmount < 0.01) {
        throw new Error(
          `Amount too small: ${amount} ${fromCurrency} converts to $${toAmount.toFixed(4)} USD (minimum $0.01 USD). ` +
          `Current rate: 1 USD = ${usdToHtg} HTG.`,
        );
      }
    } else {
      throw new Error(`FX pair ${fromCurrency}→${toCurrency} not supported`);
    }
  }

  // Total sender must have: amount + fee
  const totalRequired = amount + fee;

  // ── Risk Evaluation ──────────────────────────────────────────────
  let riskEventId: string | undefined;

  if (!skipRiskCheck && riskContext) {
    const riskResult = await evaluateTransactionRisk({
      userId: senderUserId,
      amount,
      currency: fromCurrency,
      recipientUserId,
      isNewDevice: riskContext.isNewDevice,
      ip: riskContext.ip,
      userAgent: riskContext.userAgent,
      eventType: "transfer_attempt",
    });

    riskEventId = riskResult.riskEventId;

    if (riskResult.action === "frozen") {
      await prisma.user.update({
        where: { id: senderUserId },
        data: {
          isFrozen: true,
          freezeReason: `Auto-frozen by risk engine (score: ${riskResult.score})`,
          frozenAt: new Date(),
        },
      });
      await createNotification(
        senderUserId,
        "Account Frozen",
        "Your account has been temporarily frozen due to suspicious activity. Contact support.",
        "system",
      );
      throw new Error("Transfer blocked — account frozen due to high risk");
    }

    if (riskResult.action === "blocked") {
      const heldTransfer = await prisma.$transaction(async (tx) => {
        const entries = await tx.ledgerEntry.findMany({
          where: { walletId: senderWallet!.id },
          select: { amount: true, type: true },
        });
        const available = computeAvailable(entries);
        if (available < totalRequired) throw new Error("Insufficient balance");

        const t = await tx.transfer.create({
          data: {
            fromWalletId: senderWallet!.id,
            toWalletId: recipientWallet!.id,
            senderUserId,
            amount,
            currency: fromCurrency,
            status: "pending_review",
            idempotencyKey,
            riskEventId,
          },
        });
        await tx.ledgerEntry.create({
          data: {
            walletId: senderWallet!.id,
            amount: -totalRequired,
            type: "hold_debit",
            transferId: t.id,
            reference: `risk_hold:${riskResult.score}`,
          },
        });
        return t;
      });

      await invalidateBalance(senderWallet!.id).catch(() => {});
      await createNotification(
        senderUserId,
        "Transfer Under Review",
        `Your transfer of ${amount} ${fromCurrency} is being reviewed. Funds are on hold.`,
        "system",
      );
      return { transferId: heldTransfer.id, deduplicated: false, held: true, riskEventId };
    }

    if (riskResult.action === "otp_required") {
      return { requiresOtp: true, riskEventId };
    }
  }

  // ── Treasury wallet for fee collection ──────────────────────────
  let treasuryWallet: typeof senderWallet | null = null;
  if (fee > 0) {
    treasuryWallet = await prisma.wallet.findFirst({
      where: { type: "TREASURY", currency: fromCurrency },
    });
    // If treasury not found, still proceed — fee is logged but not collected
  }

  // ── Execute in a single atomic transaction ───────────────────────
  const transfer = await prisma.$transaction(async (tx) => {
    const entries = await tx.ledgerEntry.findMany({
      where: { walletId: senderWallet!.id },
      select: { amount: true, type: true },
    });
    const available = computeAvailable(entries);
    if (available < totalRequired) throw new Error("Insufficient balance");

    const fxRef = fromCurrency !== toCurrency
      ? `fx:${fromCurrency}->${toCurrency}@${fxRate.toFixed(6)}`
      : undefined;

    const t = await tx.transfer.create({
      data: {
        fromWalletId: senderWallet!.id,
        toWalletId: recipientWallet!.id,
        senderUserId,
        amount,
        currency: fromCurrency,
        status: "completed",
        idempotencyKey,
        riskEventId,
      },
    });

    const ledgerEntries: Parameters<typeof tx.ledgerEntry.createMany>[0]["data"] = [
      // Debit sender (amount only — fee handled separately below)
      {
        walletId: senderWallet!.id,
        amount: -amount,
        type: "transfer_out",
        transferId: t.id,
        reference: fxRef,
      },
      // Credit recipient (converted amount)
      {
        walletId: recipientWallet!.id,
        amount: toAmount,
        type: "transfer_in",
        transferId: t.id,
        reference: fxRef,
      },
    ];

    // Fee entries (debit sender + credit treasury)
    if (fee > 0) {
      ledgerEntries.push({
        walletId: senderWallet!.id,
        amount: -fee,
        type: "fee_debit",
        transferId: t.id,
        reference: `fee:${fromCurrency}`,
      });
      if (treasuryWallet) {
        ledgerEntries.push({
          walletId: treasuryWallet.id,
          amount: fee,
          type: "fee_credit",
          transferId: t.id,
          reference: `fee:${fromCurrency}`,
        });
      }
    }

    await tx.ledgerEntry.createMany({ data: ledgerEntries });
    return t;
  });

  // Invalidate balance caches (Redis optional)
  await Promise.all([
    invalidateBalance(senderWallet!.id).catch(() => {}),
    invalidateBalance(recipientWallet!.id).catch(() => {}),
    treasuryWallet ? invalidateBalance(treasuryWallet.id).catch(() => {}) : Promise.resolve(),
  ]);

  // Fire-and-forget side effects — NEVER block the response
  const fxDisplay = fromCurrency !== toCurrency
    ? ` (${toAmount} ${toCurrency} at rate ${fxRate.toFixed(4)})`
    : "";
  const feeDisplay = fee > 0 ? ` + ${fee} ${fromCurrency} fee` : "";

  Promise.allSettled([
    prisma.transferContact.upsert({
      where: { userId_contactUserId: { userId: senderUserId, contactUserId: recipientUserId } },
      update: { transferCount: { increment: 1 }, lastTransferAt: new Date() },
      create: { userId: senderUserId, contactUserId: recipientUserId },
    }),
    createNotification(
      senderUserId,
      "Money Sent",
      `You sent ${amount} ${fromCurrency}${feeDisplay}${fxDisplay} to ${recipient?.firstName || "recipient"}.`,
      "transfer",
    ),
    createNotification(
      recipientUserId,
      "Money Received",
      `You received ${toAmount} ${toCurrency} from ${sender?.firstName || "someone"}.`,
      "transfer",
    ),
    emitEvent("transfer.posted", {
      transferId: transfer.id,
      fromWalletId: senderWallet!.id,
      toWalletId: recipientWallet!.id,
      amount, toAmount, fromCurrency, toCurrency, fxRate, fee, senderUserId, recipientUserId,
    }),
  ]).catch(() => {});

  return {
    transferId: transfer.id,
    deduplicated: false,
    riskEventId,
    fxRate,
    fromCurrency,
    toCurrency,
    sentAmount: amount,
    receivedAmount: toAmount,
    fee,
    feeCurrency: fromCurrency,
  };
}
