import { prisma } from "../db/prisma";
import { computeWalletBalance } from "../wallets/balance.service";
import { enqueueSMS } from "../notifications/notification.service";

// Default low-float threshold in HTG (can be made configurable later)
const DEFAULT_LOW_FLOAT_THRESHOLD = 5000;
// Minimum interval between low-float alerts (1 hour)
const ALERT_COOLDOWN_MS = 60 * 60 * 1000;

export async function checkLowFloat() {
  const distributors = await prisma.distributor.findMany({
    where: { status: "active" },
    include: { User: true },
  });

  for (const d of distributors) {
    const wallet = await prisma.wallet.findFirst({
      where: { userId: d.userId, type: "DISTRIBUTOR" },
    });

    if (!wallet) continue;

    const balance = await computeWalletBalance(wallet.id);

    if (balance.availableBalance < DEFAULT_LOW_FLOAT_THRESHOLD) {
      // Check if we already alerted recently via notification log
      const recentAlert = await prisma.notificationLog.findFirst({
        where: {
          userId: d.userId,
          type: "low_float_alert",
          createdAt: { gte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
        },
        orderBy: { createdAt: "desc" },
      });

      if (recentAlert) continue;

      if (d.User?.phone) {
        await enqueueSMS(
          d.User.phone,
          `KobKlein Alert: Your float is low (${balance.availableBalance}). Please refill soon.`,
        );

        // Log the alert to prevent spam
        await prisma.notificationLog.create({
          data: {
            userId: d.userId,
            channel: "sms",
            type: "low_float_alert",
            to: d.User.phone,
            body: `Low float alert: ${balance.availableBalance}`,
            status: "queued",
          },
        });
      }
    }
  }
}
