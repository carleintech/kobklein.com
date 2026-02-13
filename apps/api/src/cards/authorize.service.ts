import { prisma } from "../db/prisma";
import { computeWalletBalance, invalidateBalance } from "../wallets/balance.service";
import { emitEvent } from "../services/event-bus.service";

/**
 * Authorize (hold) a transaction on a virtual card.
 *
 * Creates a ledger hold and a VirtualCardTxn with status "authorized".
 * Returns the transaction record.
 */
export async function authorizeCardTransaction(params: {
  cardId: string;
  amount: number;
  currency: string;
  merchantName?: string;
  merchantCategory?: string;
  merchantCountry?: string;
  meta?: any;
}) {
  const { cardId, amount, currency, merchantName, merchantCategory, merchantCountry, meta } = params;

  if (amount <= 0) throw new Error("Amount must be positive");

  // Fetch card
  const card = await prisma.virtualCard.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Card not found");
  if (card.status !== "active") throw new Error("Card is not active");

  // Resolve the user's USD wallet
  const wallet = await prisma.wallet.findFirst({
    where: { userId: card.userId, currency: card.currency, type: "USER" },
  });
  if (!wallet) throw new Error("Wallet not found for card currency");

  // Check available balance (total minus existing holds)
  const balance = await computeWalletBalance(wallet.id);
  if (balance.availableBalance < amount) {
    // Create a declined transaction record
    const declined = await prisma.virtualCardTxn.create({
      data: {
        cardId,
        userId: card.userId,
        status: "declined",
        amount,
        currency,
        merchantName,
        merchantCategory,
        merchantCountry,
        meta,
      },
    });

    await emitEvent("card.authorization.declined", {
      txnId: declined.id,
      cardId,
      userId: card.userId,
      amount,
      currency,
      reason: "insufficient_balance",
    });

    return { ok: false, reason: "insufficient_balance", txn: declined };
  }

  // Execute hold inside a Prisma transaction
  const result = await prisma.$transaction(async (tx) => {
    // Re-check balance inside transaction (optimistic lock)
    const entries = await tx.ledgerEntry.findMany({
      where: { walletId: wallet.id },
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
      throw new Error("Insufficient balance (race check)");
    }

    // Create hold ledger entry
    const holdEntry = await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        amount: -amount, // Negative = debit hold
        type: "hold_debit",
        reference: `card_hold:${merchantName || "purchase"}`,
      },
    });

    // Create card transaction record
    const txn = await tx.virtualCardTxn.create({
      data: {
        cardId,
        userId: card.userId,
        status: "authorized",
        amount,
        currency,
        merchantName,
        merchantCategory,
        merchantCountry,
        holdId: holdEntry.id,
        meta,
      },
    });

    return { holdEntry, txn };
  });

  // Invalidate balance cache
  await invalidateBalance(wallet.id);

  // Emit domain event
  await emitEvent("card.authorization.approved", {
    txnId: result.txn.id,
    cardId,
    userId: card.userId,
    walletId: wallet.id,
    amount,
    currency,
    merchantName,
  });

  return { ok: true, txn: result.txn };
}

/**
 * Reverse an authorized hold (e.g. merchant voided the charge).
 *
 * Releases the held amount and updates the VirtualCardTxn status.
 */
export async function reverseAuthorization(txnId: string) {
  const txn = await prisma.virtualCardTxn.findUnique({ where: { id: txnId } });
  if (!txn) throw new Error("Transaction not found");
  if (txn.status !== "authorized") throw new Error("Only authorized transactions can be reversed");

  const card = await prisma.virtualCard.findUnique({ where: { id: txn.cardId } });
  if (!card) throw new Error("Card not found");

  const wallet = await prisma.wallet.findFirst({
    where: { userId: card.userId, currency: card.currency, type: "USER" },
  });
  if (!wallet) throw new Error("Wallet not found");

  await prisma.$transaction(async (tx) => {
    // Release the hold
    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        amount: Number(txn.amount), // Positive = release
        type: "hold_release",
        reference: `card_reversal:${txn.merchantName || "purchase"}`,
      },
    });

    // Update transaction status
    await tx.virtualCardTxn.update({
      where: { id: txnId },
      data: { status: "reversed" },
    });
  });

  await invalidateBalance(wallet.id);

  await emitEvent("card.authorization.reversed", {
    txnId,
    cardId: txn.cardId,
    userId: card.userId,
    amount: Number(txn.amount),
    currency: txn.currency,
  });

  return { ok: true };
}
