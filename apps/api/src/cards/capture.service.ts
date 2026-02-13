import { prisma } from "../db/prisma";
import { invalidateBalance } from "../wallets/balance.service";
import { emitEvent } from "../services/event-bus.service";

/**
 * Capture (settle) a previously authorized card transaction.
 *
 * The hold is converted to a final debit on the wallet.
 * captureAmount can be ≤ the original authorized amount (partial capture).
 */
export async function captureCardTransaction(params: {
  txnId: string;
  captureAmount?: number; // If omitted, captures full authorized amount
}) {
  const { txnId } = params;

  const txn = await prisma.virtualCardTxn.findUnique({ where: { id: txnId } });
  if (!txn) throw new Error("Transaction not found");
  if (txn.status !== "authorized") throw new Error("Only authorized transactions can be captured");

  const authorizedAmount = Number(txn.amount);
  const captureAmount = params.captureAmount ?? authorizedAmount;

  if (captureAmount <= 0) throw new Error("Capture amount must be positive");
  if (captureAmount > authorizedAmount) {
    throw new Error("Capture amount cannot exceed authorized amount");
  }

  const card = await prisma.virtualCard.findUnique({ where: { id: txn.cardId } });
  if (!card) throw new Error("Card not found");

  const wallet = await prisma.wallet.findFirst({
    where: { userId: card.userId, currency: card.currency, type: "USER" },
  });
  if (!wallet) throw new Error("Wallet not found");

  const result = await prisma.$transaction(async (tx) => {
    // 1) Release the original hold
    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        amount: authorizedAmount, // Positive = release full hold
        type: "hold_release",
        reference: `card_capture_release:${txn.merchantName || "purchase"}`,
      },
    });

    // 2) Create the final capture debit
    const captureEntry = await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        amount: -captureAmount, // Negative = final debit
        type: "card_capture",
        reference: `card_capture:${txn.merchantName || "purchase"}`,
      },
    });

    // 3) If partial capture, the difference is returned to available balance
    //    (already handled by releasing full hold and debiting less)

    // 4) Update the transaction record
    await tx.virtualCardTxn.update({
      where: { id: txnId },
      data: {
        status: "captured",
        amount: captureAmount, // Update to actual captured amount
        captureLedgerId: captureEntry.id,
      },
    });

    return { captureEntry };
  });

  await invalidateBalance(wallet.id);

  await emitEvent("card.captured", {
    txnId,
    cardId: txn.cardId,
    userId: card.userId,
    walletId: wallet.id,
    authorizedAmount,
    captureAmount,
    currency: txn.currency,
    merchantName: txn.merchantName,
  });

  return {
    ok: true,
    txnId,
    captureAmount,
    authorizedAmount,
  };
}
