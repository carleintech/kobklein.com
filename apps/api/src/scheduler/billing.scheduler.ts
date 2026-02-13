import cron from "node-cron";
import { prisma } from "../db/prisma";
import { chargeSubscription } from "../subscriptions/subscription.service";
import { createNotification } from "../notifications/notification.service";
import { emitEvent } from "../services/event-bus.service";

const MAX_FAILURES = 3;

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

      console.log(`[billing] Charged ${sub.merchant} $${sub.amountUsd} for user ${sub.userId}`);
    } catch (err: any) {
      // Failed — increment failure count
      const newFailureCount = sub.failureCount + 1;
      const isDelinquent = newFailureCount >= MAX_FAILURES;

      await prisma.subscriptionProxy.update({
        where: { id: sub.id },
        data: {
          lastAttempt: now,
          failureCount: newFailureCount,
          status: isDelinquent ? "delinquent" : sub.status,
        },
      });

      if (isDelinquent) {
        await createNotification(
          sub.userId,
          "Subscription Suspended",
          `Your ${sub.merchant} subscription was suspended after ${MAX_FAILURES} failed payment attempts. Please top up your USD wallet.`,
          "system",
        );

        await emitEvent("subscription.delinquent", {
          subscriptionId: sub.id,
          userId: sub.userId,
          merchant: sub.merchant,
          failureCount: newFailureCount,
        });
      } else {
        await createNotification(
          sub.userId,
          "Payment Failed",
          `Your ${sub.merchant} payment failed (attempt ${newFailureCount}/${MAX_FAILURES}). Please ensure you have sufficient USD balance.`,
          "system",
        );
      }

      console.error(`[billing] Failed to charge ${sub.merchant} for user ${sub.userId}: ${err.message}`);
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
      console.log("[billing] Billing cycle complete");
    } catch (err: any) {
      console.error("[billing] Billing cycle error:", err.message);
    }
  });
}
