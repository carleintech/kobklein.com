import cron from "node-cron";
import { prisma } from "../db/prisma";
import { chargeSubscription } from "../subscriptions/subscription.service";
import { createNotification } from "../notifications/notification.service";
import { emitEvent } from "../services/event-bus.service";
import { renderTemplate, toLang } from "../i18n/render";
import { computeWalletBalance } from "../wallets/balance.service";

const MAX_FAILURES = 3;

/**
 * Grace period in days — after each failure, push nextBilling forward by this
 * many days to give the user time to top up before the next retry.
 */
const GRACE_DAYS = 2;

/**
 * Resolve user's preferred language for i18n notifications.
 */
async function getUserLang(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredLang: true },
  });
  return toLang(user?.preferredLang);
}

/**
 * Process all due subscriptions.
 * Called daily by the cron scheduler.
 */
async function processBillingCycle() {
  const now = new Date();

  // Find all active subscriptions due for billing
  const dueSubs = await prisma.subscriptionProxy.findMany({
    where: {
      status: "active",
      nextBilling: { lte: now },
    },
    take: 200, // Process in batches
  });

  console.log(`[billing] Found ${dueSubs.length} subscriptions due for billing`);

  for (const sub of dueSubs) {
    try {
      // Resolve wallet
      const wallet = await prisma.wallet.findFirst({
        where: { userId: sub.userId, currency: "USD", type: "USER" },
      });

      if (!wallet) {
        console.error(`[billing] No USD wallet for user ${sub.userId}, skipping sub ${sub.id}`);
        continue;
      }

      // Attempt charge
      await chargeSubscription({
        userId: sub.userId,
        walletId: wallet.id,
        merchant: sub.merchant,
        amountUsd: Number(sub.amountUsd),
        referenceNote: `sub:${sub.merchant}:recurring`,
      });

      // Success — advance next billing by 30 days
      const nextBilling = new Date(now);
      nextBilling.setDate(nextBilling.getDate() + 30);

      await prisma.subscriptionProxy.update({
        where: { id: sub.id },
        data: {
          lastCharged: now,
          lastAttempt: now,
          nextBilling,
          failureCount: 0,
        },
      });

      await emitEvent("subscription.charged", {
        subscriptionId: sub.id,
        userId: sub.userId,
        merchant: sub.merchant,
        amountUsd: Number(sub.amountUsd),
      });

      // Send localized "subscription charged" notification
      const lang = await getUserLang(sub.userId);
      const msg = renderTemplate("subscription_charged", lang, {
        merchant: sub.merchant,
        amountUsd: Number(sub.amountUsd),
        nextBilling: nextBilling.toLocaleDateString(),
      });
      await createNotification(sub.userId, msg.title, msg.body, "system");

      console.log(`[billing] Charged ${sub.merchant} $${sub.amountUsd} for user ${sub.userId}`);
    } catch (err: any) {
      // Failed — increment failure count
      const newFailureCount = sub.failureCount + 1;
      const isDelinquent = newFailureCount >= MAX_FAILURES;

      // Grace period: push nextBilling forward so we don't retry immediately
      const graceDate = new Date(now);
      graceDate.setDate(graceDate.getDate() + GRACE_DAYS);

      await prisma.subscriptionProxy.update({
        where: { id: sub.id },
        data: {
          lastAttempt: now,
          failureCount: newFailureCount,
          status: isDelinquent ? "delinquent" : sub.status,
          // Only push nextBilling forward (grace) if not yet delinquent
          ...(isDelinquent ? {} : { nextBilling: graceDate }),
        },
      });

      const lang = await getUserLang(sub.userId);

      if (isDelinquent) {
        const msg = renderTemplate("subscription_suspended", lang, {
          merchant: sub.merchant,
          maxFailures: MAX_FAILURES,
        });
        await createNotification(sub.userId, msg.title, msg.body, "system");

        await emitEvent("subscription.delinquent", {
          subscriptionId: sub.id,
          userId: sub.userId,
          merchant: sub.merchant,
          failureCount: newFailureCount,
        });
      } else {
        const msg = renderTemplate("payment_failed", lang, {
          merchant: sub.merchant,
          attempt: newFailureCount,
          maxAttempts: MAX_FAILURES,
        });
        await createNotification(sub.userId, msg.title, msg.body, "system");
      }

      console.error(`[billing] Failed to charge ${sub.merchant} for user ${sub.userId}: ${err.message}`);
    }
  }
}

/**
 * Auto-resume delinquent subscriptions whose users now have sufficient balance.
 *
 * Runs after the main billing cycle. For each delinquent subscription:
 * 1. Check if the user's USD wallet now covers the subscription amount
 * 2. If yes → attempt the charge, reset status to active, notify user
 *
 * This creates a better UX: users just top up and their subscriptions
 * automatically resume without manual intervention.
 */
async function processAutoResume() {
  const delinquentSubs = await prisma.subscriptionProxy.findMany({
    where: { status: "delinquent" },
    take: 100,
  });

  if (delinquentSubs.length === 0) return;

  console.log(`[billing] Checking ${delinquentSubs.length} delinquent subscriptions for auto-resume`);

  for (const sub of delinquentSubs) {
    try {
      const wallet = await prisma.wallet.findFirst({
        where: { userId: sub.userId, currency: "USD", type: "USER" },
      });

      if (!wallet) continue;

      // Check if balance now covers the subscription
      const balance = await computeWalletBalance(wallet.id);
      if (balance.availableBalance < Number(sub.amountUsd)) continue;

      // Attempt to charge
      await chargeSubscription({
        userId: sub.userId,
        walletId: wallet.id,
        merchant: sub.merchant,
        amountUsd: Number(sub.amountUsd),
        referenceNote: `sub:${sub.merchant}:auto-resume`,
      });

      // Success — reactivate subscription
      const nextBilling = new Date();
      nextBilling.setDate(nextBilling.getDate() + 30);

      await prisma.subscriptionProxy.update({
        where: { id: sub.id },
        data: {
          status: "active",
          lastCharged: new Date(),
          lastAttempt: new Date(),
          nextBilling,
          failureCount: 0,
        },
      });

      const lang = await getUserLang(sub.userId);
      const msg = renderTemplate("subscription_auto_resumed", lang, {
        merchant: sub.merchant,
      });
      await createNotification(sub.userId, msg.title, msg.body, "system");

      await emitEvent("subscription.auto_resumed", {
        subscriptionId: sub.id,
        userId: sub.userId,
        merchant: sub.merchant,
      });

      console.log(`[billing] Auto-resumed ${sub.merchant} for user ${sub.userId}`);
    } catch {
      // Charge still failed — user needs more funds, try again tomorrow
      continue;
    }
  }
}

/**
 * Start the daily billing scheduler.
 * Runs every day at 06:00 UTC.
 */
export function startBillingScheduler() {
  cron.schedule("0 6 * * *", async () => {
    console.log("[billing] Starting daily billing cycle...");
    try {
      await processBillingCycle();
      await processAutoResume();
      console.log("[billing] Billing cycle complete");
    } catch (err: any) {
      console.error("[billing] Billing cycle error:", err.message);
    }
  });
}
