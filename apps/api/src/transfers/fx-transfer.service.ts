import { prisma } from "../db/prisma";
import { invalidateBalance } from "../wallets/balance.service";
import { createNotification } from "../notifications/notification.service";
import { emitEvent } from "../services/event-bus.service";
import { getActiveFxRate } from "../fx/fx.service";

export interface FxTransferResult {
  transferId: string;
  fxRate: number;
  sentUsd: number;
  receivedHtg: number;
  deduplicated: boolean;
}

/**
 * Execute a cross-currency transfer (USD -> HTG).
 *
 * This is a WRAPPER — it does NOT modify executeTransfer.
 * It handles FX conversion by creating separate ledger entries
 * at the correct amounts for each currency.
 *
 * Flow:
 *   1. Resolve sender USD wallet + recipient HTG wallet
 *   2. Get active FX rate
 *   3. Debit sender in USD, credit recipient in HTG
 *   4. Create Transfer record (amount = USD amount, currency = "USD")
 *   5. Audit + notify + emit event
 */
export async function executeFxTransfer(params: {
  senderUserId: string;
  recipientUserId: string;
  amountUsd: number;
  idempotencyKey: string;
}): Promise<FxTransferResult> {
  const { senderUserId, recipientUserId, amountUsd, idempotencyKey } = params;

  if (amountUsd <= 0) throw new Error("Amount must be positive");
  if (senderUserId === recipientUserId) throw new Error("Cannot transfer to yourself");

  // Idempotency check
  const existing = await prisma.transfer.findUnique({
    where: { idempotencyKey },
  });
  if (existing) {
    // Reconstruct FX info from the ledger entries
    const creditEntry = await prisma.ledgerEntry.findFirst({
      where: { transferId: existing.id, type: "transfer_in" },
      select: { amount: true },
    });
    return {
      transferId: existing.id,
      fxRate: creditEntry ? Number(creditEntry.amount) / amountUsd : 0,
      sentUsd: amountUsd,
      receivedHtg: creditEntry ? Number(creditEntry.amount) : 0,
      deduplicated: true,
    };
  }

  // Resolve wallets
  const senderWallet = await prisma.wallet.findFirst({
    where: { userId: senderUserId, currency: "USD", type: "USER" },
  });
  if (!senderWallet) throw new Error("Sender USD wallet not found");

  const recipientWallet = await prisma.wallet.findFirst({
    where: { userId: recipientUserId, currency: "HTG", type: "USER" },
  });
  if (!recipientWallet) throw new Error("Recipient HTG wallet not found");

  // Check frozen status
  const sender = await prisma.user.findUnique({
    where: { id: senderUserId },
    select: { isFrozen: true, firstName: true, phone: true },
  });
  if (sender?.isFrozen) throw new Error("Sender account is frozen");

  const recipient = await prisma.user.findUnique({
    where: { id: recipientUserId },
    select: { isFrozen: true, firstName: true, phone: true },
  });
  if (recipient?.isFrozen) throw new Error("Recipient account is frozen");

  // Get FX rate
  const fxRate = await getActiveFxRate("USD", "HTG");
  const amountHtg = Math.round(amountUsd * fxRate * 100) / 100;

  // Execute in transaction
  const transfer = await prisma.$transaction(async (tx) => {
    // Check available USD balance (total minus holds)
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

    if (available < amountUsd) {
      throw new Error("Insufficient USD balance");
    }

    // Create transfer record (amount in sender currency = USD)
    const t = await tx.transfer.create({
      data: {
        fromWalletId: senderWallet.id,
        toWalletId: recipientWallet.id,
        senderUserId,
        amount: amountUsd,
        currency: "USD",
        status: "completed",
        idempotencyKey,
      },
    });

    // Double-entry ledger: debit USD, credit HTG
    await tx.ledgerEntry.createMany({
      data: [
        {
          walletId: senderWallet.id,
          amount: -amountUsd,
          type: "transfer_out",
          transferId: t.id,
          reference: `fx:USD->HTG@${fxRate}`,
        },
        {
          walletId: recipientWallet.id,
          amount: amountHtg,
          type: "transfer_in",
          transferId: t.id,
          reference: `fx:USD->HTG@${fxRate}`,
        },
      ],
    });

    return t;
  });

  // Invalidate balance caches
  await invalidateBalance(senderWallet.id);
  await invalidateBalance(recipientWallet.id);

  // Update contact
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

  // Notifications with FX context
  await createNotification(
    senderUserId,
    "Remittance Sent",
    `You sent $${amountUsd} USD (${amountHtg.toLocaleString()} HTG) to ${recipient?.firstName || "family"}.`,
    "transfer",
  );

  await createNotification(
    recipientUserId,
    "Money Received",
    `You received ${amountHtg.toLocaleString()} HTG from ${sender?.firstName || "diaspora family"}.`,
    "transfer",
  );

  // Domain event with full FX metadata
  await emitEvent("remittance.posted", {
    transferId: transfer.id,
    fromWalletId: senderWallet.id,
    toWalletId: recipientWallet.id,
    amountUsd,
    amountHtg,
    fxRate,
    senderUserId,
    recipientUserId,
  });

  return {
    transferId: transfer.id,
    fxRate,
    sentUsd: amountUsd,
    receivedHtg: amountHtg,
    deduplicated: false,
  };
}
