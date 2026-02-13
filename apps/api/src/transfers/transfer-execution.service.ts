import { prisma } from "../db/prisma";
import { invalidateBalance } from "../wallets/balance.service";
import { createNotification } from "../notifications/notification.service";
import { emitEvent } from "../services/event-bus.service";
import {
  evaluateTransactionRisk,
  type RiskAction,
} from "../risk/risk-engine.service";

/**
 * Single source of truth for executing a transfer.
 * Used by both low-risk (immediate) and OTP-confirmed flows.
 *
 * Phase 42 addition: integrates risk engine evaluation.
 * High-risk transfers are held with "pending_review" status
 * for admin approval instead of being executed immediately.
 *
 * Resolves wallets fresh at execution time (never uses stale references).
 */
export async function executeTransfer(params: {
  senderUserId: string;
  recipientUserId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  // Optional risk context — if provided, risk evaluation runs
  riskContext?: {
    ip?: string;
    userAgent?: string;
    isNewDevice?: boolean;
  };
  // Skip risk check (used by admin-approved transfers or cron jobs)
  skipRiskCheck?: boolean;
}) {
  const {
    senderUserId,
    recipientUserId,
    amount,
    currency,
    idempotencyKey,
    riskContext,
    skipRiskCheck,
  } = params;

  if (amount <= 0) throw new Error("Amount must be positive");
  if (senderUserId === recipientUserId)
    throw new Error("Cannot transfer to yourself");

  // Idempotency check
  const existing = await prisma.transfer.findUnique({
    where: { idempotencyKey },
  });
  if (existing) return { transferId: existing.id, deduplicated: true };

  // Resolve wallets fresh (safety — respects latest state)
  const senderWallet = await prisma.wallet.findFirst({
    where: { userId: senderUserId, type: "USER" },
  });

  const recipientWallet = await prisma.wallet.findFirst({
    where: { userId: recipientUserId, type: "USER" },
  });

  if (!senderWallet) throw new Error("Sender wallet not found");
  if (!recipientWallet) throw new Error("Recipient wallet not found");

  // Check sender is not frozen
  const sender = await prisma.user.findUnique({
    where: { id: senderUserId },
    select: { isFrozen: true, firstName: true, phone: true },
  });
  if (sender?.isFrozen) throw new Error("Sender account is frozen");

  // Check recipient is not frozen
  const recipient = await prisma.user.findUnique({
    where: { id: recipientUserId },
    select: { isFrozen: true, firstName: true, phone: true },
  });
  if (recipient?.isFrozen) throw new Error("Recipient account is frozen");

  // ── Risk Evaluation (Phase 42) ──────────────────────────────────
  let riskEventId: string | undefined;

  if (!skipRiskCheck && riskContext) {
    const riskResult = await evaluateTransactionRisk({
      userId: senderUserId,
      amount,
      currency,
      recipientUserId,
      isNewDevice: riskContext.isNewDevice,
      ip: riskContext.ip,
      userAgent: riskContext.userAgent,
      eventType: "transfer_attempt",
    });

    riskEventId = riskResult.riskEventId;

    if (riskResult.action === "frozen") {
      // Auto-freeze the sender
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
        "Your account has been temporarily frozen due to suspicious activity. Contact support for assistance.",
        "system",
      );

      throw new Error("Transfer blocked — account frozen due to high risk");
    }

    if (riskResult.action === "blocked") {
      // Create transfer with pending_review + place a hold
      const heldTransfer = await prisma.$transaction(async (tx) => {
        // Check balance first
        const entries = await tx.ledgerEntry.findMany({
          where: { walletId: senderWallet.id },
          select: { amount: true, type: true },
        });

        let total = 0;
        let held = 0;
        for (const e of entries) {
          total += Number(e.amount);
          if (e.type === "hold_debit")
            held += Math.abs(Number(e.amount));
          if (e.type === "hold_release")
            held -= Math.abs(Number(e.amount));
          if (e.type === "hold_seize")
            held -= Math.abs(Number(e.amount));
        }
        if (held < 0) held = 0;
        const available = total - held;

        if (available < amount) throw new Error("Insufficient balance");

        // Create transfer in pending_review state
        const t = await tx.transfer.create({
          data: {
            fromWalletId: senderWallet.id,
            toWalletId: recipientWallet.id,
            senderUserId,
            amount,
            currency,
            status: "pending_review",
            idempotencyKey,
            riskEventId,
          },
        });

        // Place a hold on the funds (so sender can't spend them)
        await tx.ledgerEntry.create({
          data: {
            walletId: senderWallet.id,
            amount: -amount,
            type: "hold_debit",
            transferId: t.id,
            reference: `risk_hold:${riskResult.score}`,
          },
        });

        return t;
      });

      await invalidateBalance(senderWallet.id);

      await createNotification(
        senderUserId,
        "Transfer Under Review",
        `Your transfer of ${amount} ${currency} is being reviewed for security. Funds are on hold until review is complete.`,
        "system",
      );

      return {
        transferId: heldTransfer.id,
        deduplicated: false,
        held: true,
        riskEventId,
      };
    }

    if (riskResult.action === "otp_required") {
      // Return early — caller must handle OTP flow
      return {
        requiresOtp: true,
        riskEventId,
      };
    }
  }

  // ── Normal Execution (low risk or risk check skipped) ───────────
  const transfer = await prisma.$transaction(async (tx) => {
    // Check available balance (total minus holds)
    const entries = await tx.ledgerEntry.findMany({
      where: { walletId: senderWallet.id },
      select: { amount: true, type: true },
    });

    let total = 0;
    let held = 0;
    for (const e of entries) {
      total += Number(e.amount);
      if (e.type === "hold_debit") held += Math.abs(Number(e.amount));
      if (e.type === "hold_release") held -= Math.abs(Number(e.amount));
      if (e.type === "hold_seize") held -= Math.abs(Number(e.amount));
    }
    if (held < 0) held = 0;
    const available = total - held;

    if (available < amount) {
      throw new Error("Insufficient balance");
    }

    // Create transfer record
    const t = await tx.transfer.create({
      data: {
        fromWalletId: senderWallet.id,
        toWalletId: recipientWallet.id,
        senderUserId,
        amount,
        currency,
        status: "completed",
        idempotencyKey,
        riskEventId,
      },
    });

    // Double-entry ledger
    await tx.ledgerEntry.createMany({
      data: [
        {
          walletId: senderWallet.id,
          amount: -amount,
          type: "transfer_out",
          transferId: t.id,
        },
        {
          walletId: recipientWallet.id,
          amount: amount,
          type: "transfer_in",
          transferId: t.id,
        },
      ],
    });

    return t;
  });

  // Invalidate balance cache
  await invalidateBalance(senderWallet.id);
  await invalidateBalance(recipientWallet.id);

  // Save contact
  await prisma.transferContact.upsert({
    where: {
      userId_contactUserId: {
        userId: senderUserId,
        contactUserId: recipientUserId,
      },
    },
    update: {
      transferCount: { increment: 1 },
      lastTransferAt: new Date(),
    },
    create: {
      userId: senderUserId,
      contactUserId: recipientUserId,
    },
  });

  // Notifications
  await createNotification(
    senderUserId,
    "Money Sent",
    `You sent ${amount} ${currency} to ${recipient?.firstName || "recipient"}.`,
    "transfer",
  );

  await createNotification(
    recipientUserId,
    "Money Received",
    `You received ${amount} ${currency} from ${sender?.firstName || "someone"}.`,
    "transfer",
  );

  // Domain event
  await emitEvent("transfer.posted", {
    transferId: transfer.id,
    fromWalletId: senderWallet.id,
    toWalletId: recipientWallet.id,
    amount,
    currency,
    senderUserId,
    recipientUserId,
  });

  return { transferId: transfer.id, deduplicated: false, riskEventId };
}
