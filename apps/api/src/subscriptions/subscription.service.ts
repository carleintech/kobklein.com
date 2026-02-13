import { prisma } from "../db/prisma";
import { computeWalletBalance, invalidateBalance } from "../wallets/balance.service";
import { emitEvent } from "../services/event-bus.service";
import { createNotification } from "../notifications/notification.service";

/**
 * Create a new subscription proxy (e.g. Netflix, Spotify).
 *
 * This doesn't actually connect to the external merchant yet —
 * it registers the intent so the billing scheduler can charge monthly.
 */
export async function createSubscription(params: {
  userId: string;
  merchant: string;
  amountUsd: number;
  externalAccountRef?: string;
}) {
  const { userId, merchant, amountUsd, externalAccountRef } = params;

  if (amountUsd <= 0) throw new Error("Amount must be positive");

  // KYC gate
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycTier: true, isFrozen: true },
  });

  if (!user) throw new Error("User not found");
  if (user.isFrozen) throw new Error("Account is frozen");
  if ((user.kycTier ?? 0) < 2) {
    throw new Error("KYC tier 2 required for subscriptions");
  }

  // Ensure user has a USD wallet
  let wallet = await prisma.wallet.findFirst({
    where: { userId, currency: "USD", type: "USER" },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, currency: "USD", type: "USER" },
    });
  }

  // Check balance covers at least the first charge
  const balance = await computeWalletBalance(wallet.id);
  if (balance.availableBalance < amountUsd) {
    throw new Error("Insufficient USD balance for first billing cycle");
  }

  // Check for duplicate active subscription to same merchant
  const existingSub = await prisma.subscriptionProxy.findFirst({
    where: {
      userId,
      merchant: merchant.toUpperCase(),
      status: { in: ["active", "paused"] },
    },
  });

  if (existingSub) {
    throw new Error(`Active subscription to ${merchant} already exists`);
  }

  // Next billing = 30 days from now
  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + 30);

  // Charge the first month immediately
  const chargeResult = await chargeSubscription({
    userId,
    walletId: wallet.id,
    merchant: merchant.toUpperCase(),
    amountUsd,
    referenceNote: `sub:${merchant.toUpperCase()}:first`,
  });

  const subscription = await prisma.subscriptionProxy.create({
    data: {
      userId,
      merchant: merchant.toUpperCase(),
      externalAccountRef,
      amountUsd,
      currency: "USD",
      status: "active",
      nextBilling,
      lastCharged: new Date(),
    },
  });

  await emitEvent("subscription.created", {
    subscriptionId: subscription.id,
    userId,
    merchant: merchant.toUpperCase(),
    amountUsd,
  });

  await createNotification(
    userId,
    "Subscription Active",
    `Your ${merchant.toUpperCase()} subscription ($${amountUsd}/mo) is now active.`,
    "system",
  );

  return {
    subscription,
    firstCharge: chargeResult,
  };
}

/**
 * Charge a subscription billing cycle.
 * Called by the billing scheduler and by createSubscription for the first month.
 */
export async function chargeSubscription(params: {
  userId: string;
  walletId: string;
  merchant: string;
  amountUsd: number;
  referenceNote?: string;
}) {
  const { userId, walletId, merchant, amountUsd, referenceNote } = params;

  const result = await prisma.$transaction(async (tx) => {
    // Check balance inside transaction
    const entries = await tx.ledgerEntry.findMany({
      where: { walletId },
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
      throw new Error("Insufficient balance for subscription charge");
    }

    // Debit the wallet
    const entry = await tx.ledgerEntry.create({
      data: {
        walletId,
        amount: -amountUsd,
        type: "subscription_charge",
        reference: referenceNote || `sub:${merchant}`,
      },
    });

    return { ledgerEntryId: entry.id };
  });

  await invalidateBalance(walletId);

  return result;
}

/**
 * Pause a subscription.
 */
export async function pauseSubscription(subscriptionId: string, userId: string) {
  const sub = await prisma.subscriptionProxy.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error("Subscription not found");
  if (sub.userId !== userId) throw new Error("Not your subscription");
  if (sub.status !== "active") throw new Error("Can only pause active subscriptions");

  await prisma.subscriptionProxy.update({
    where: { id: subscriptionId },
    data: { status: "paused" },
  });

  await createNotification(
    userId,
    "Subscription Paused",
    `Your ${sub.merchant} subscription has been paused. No further charges will occur until resumed.`,
    "system",
  );

  return { ok: true, status: "paused" };
}

/**
 * Resume a paused subscription.
 */
export async function resumeSubscription(subscriptionId: string, userId: string) {
  const sub = await prisma.subscriptionProxy.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error("Subscription not found");
  if (sub.userId !== userId) throw new Error("Not your subscription");
  if (sub.status !== "paused") throw new Error("Can only resume paused subscriptions");

  // Next billing = 30 days from now
  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + 30);

  await prisma.subscriptionProxy.update({
    where: { id: subscriptionId },
    data: { status: "active", nextBilling, failureCount: 0 },
  });

  await createNotification(
    userId,
    "Subscription Resumed",
    `Your ${sub.merchant} subscription is active again. Next charge: $${sub.amountUsd} on ${nextBilling.toLocaleDateString()}.`,
    "system",
  );

  return { ok: true, status: "active", nextBilling };
}

/**
 * Cancel a subscription permanently.
 */
export async function cancelSubscription(subscriptionId: string, userId: string) {
  const sub = await prisma.subscriptionProxy.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error("Subscription not found");
  if (sub.userId !== userId) throw new Error("Not your subscription");
  if (sub.status === "canceled") throw new Error("Already canceled");

  await prisma.subscriptionProxy.update({
    where: { id: subscriptionId },
    data: { status: "canceled" },
  });

  await createNotification(
    userId,
    "Subscription Canceled",
    `Your ${sub.merchant} subscription has been canceled.`,
    "system",
  );

  await emitEvent("subscription.canceled", {
    subscriptionId,
    userId,
    merchant: sub.merchant,
  });

  return { ok: true, status: "canceled" };
}
