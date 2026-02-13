import cron from "node-cron";
import { prisma } from "../db/prisma";
import { computeWalletBalance } from "../wallets/balance.service";

/**
 * Job A — Subscription Due Soon (3 days out).
 *
 * Checks active subscriptions with nextBilling within 3 days
 * and creates an in-app "subscription_due" notification.
 * De-duplicates per subscription + billing date.
 *
 * Now stores templateKey + params for i18n rendering.
 */
async function checkSubscriptionReminders() {
  const now = new Date();
  const in3Days = new Date(now);
  in3Days.setDate(in3Days.getDate() + 3);

  const dueSoon = await prisma.subscriptionProxy.findMany({
    where: {
      status: "active",
      nextBilling: {
        gte: now,
        lte: in3Days,
      },
    },
    take: 300,
  });

  let created = 0;

  for (const sub of dueSoon) {
    // De-dupe: check if we already notified for this billing cycle
    const dedupeKey = `sub_due:${sub.id}:${sub.nextBilling.toISOString().slice(0, 10)}`;

    const already = await prisma.notification.findFirst({
      where: {
        userId: sub.userId,
        type: "subscription_due",
        data: {
          path: ["dedupeKey"],
          equals: dedupeKey,
        },
      },
    });

    if (already) continue;

    const amountUsd = Number(sub.amountUsd);

    // Store both English fallback (title/body) AND template data for i18n
    await prisma.notification.create({
      data: {
        userId: sub.userId,
        title: `Upcoming payment: ${sub.merchant}`,
        body: `Your ${sub.merchant} subscription ($${amountUsd}) is due soon. Ensure your USD wallet has enough balance.`,
        type: "subscription_due",
        templateKey: "subscription_due",
        params: {
          merchant: sub.merchant,
          amountUsd,
          nextBilling: sub.nextBilling.toISOString(),
        },
        data: {
          dedupeKey,
          subscriptionId: sub.id,
          merchant: sub.merchant,
          amountUsd,
          nextBilling: sub.nextBilling.toISOString(),
        },
      },
    });

    created++;
  }

  console.log(`[notifications] Subscription reminders: ${created} created (${dueSoon.length} checked)`);
}

/**
 * Job B — Low Balance Warning.
 *
 * For each user with active subscriptions, checks if their USD wallet
 * balance can cover the next charge. If not, sends a warning.
 * De-duplicates: max one low-balance alert per user per day.
 *
 * Now stores templateKey + params for i18n rendering.
 */
async function checkLowBalanceWarnings() {
  const activeSubs = await prisma.subscriptionProxy.findMany({
    where: { status: "active" },
    take: 500,
  });

  // Group by user → max subscription amount (worst case)
  const byUser = new Map<string, { maxDue: number; merchant: string }>();
  for (const sub of activeSubs) {
    const amt = Number(sub.amountUsd);
    const existing = byUser.get(sub.userId);
    if (!existing || amt > existing.maxDue) {
      byUser.set(sub.userId, { maxDue: amt, merchant: sub.merchant });
    }
  }

  let warned = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const [userId, { maxDue, merchant }] of byUser.entries()) {
    // Find user's USD wallet
    const wallet = await prisma.wallet.findFirst({
      where: { userId, currency: "USD", type: "USER" },
    });

    if (!wallet) continue;

    // Compute balance from ledger
    const balance = await computeWalletBalance(wallet.id);

    if (balance.availableBalance >= maxDue) continue;

    // De-dupe: one alert per user per day
    const dedupeKey = `low_balance:${userId}:${today}`;

    const already = await prisma.notification.findFirst({
      where: {
        userId,
        type: "low_balance",
        data: {
          path: ["dedupeKey"],
          equals: dedupeKey,
        },
      },
    });

    if (already) continue;

    const availableBalance = Math.round(balance.availableBalance * 100) / 100;

    await prisma.notification.create({
      data: {
        userId,
        title: "Low balance warning",
        body: `Your USD wallet balance ($${availableBalance}) may not cover your ${merchant} subscription ($${maxDue}). Top up to avoid payment failure.`,
        type: "low_balance",
        templateKey: "low_balance",
        params: {
          availableBalance,
          maxDue,
          merchant,
        },
        data: {
          dedupeKey,
          availableBalance,
          maxDue,
          merchant,
        },
      },
    });

    warned++;
  }

  console.log(`[notifications] Low balance warnings: ${warned} created (${byUser.size} users checked)`);
}

/**
 * Start the notification reminder scheduler.
 *
 * - Subscription due reminders: daily at 08:05 UTC
 * - Low balance warnings: daily at 08:15 UTC
 */
export function startNotificationScheduler() {
  cron.schedule("5 8 * * *", async () => {
    console.log("[notifications] Running subscription reminders...");
    try {
      await checkSubscriptionReminders();
    } catch (err: any) {
      console.error("[notifications] Subscription reminder error:", err.message);
    }
  });

  cron.schedule("15 8 * * *", async () => {
    console.log("[notifications] Running low balance warnings...");
    try {
      await checkLowBalanceWarnings();
    } catch (err: any) {
      console.error("[notifications] Low balance warning error:", err.message);
    }
  });
}
