import { prisma } from "../db/prisma";

/**
 * Role-Based Limit Engine (Phase 43)
 *
 * Checks daily + monthly transaction limits based on the user's role
 * and currency. Uses the RoleLimitProfile table (admin-configurable)
 * with LimitUsage counters (auto-reset daily/monthly).
 *
 * This complements the existing:
 *   - spending-limits.service.ts (KYC-tier hardcoded limits)
 *   - limit.service.ts (LimitConfig tier-based via raw SQL)
 *   - transfer-limit.service.ts (User.dailyTransferLimit field)
 *
 * Call checkRoleLimits() AFTER existing limit checks for layered protection.
 */

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  dailyUsed?: number;
  dailyLimit?: number;
  dailyRemaining?: number;
  monthlyUsed?: number;
  monthlyLimit?: number;
  monthlyRemaining?: number;
}

export async function checkRoleLimits(params: {
  userId: string;
  role: string;
  currency: string;
  amount: number;
}): Promise<LimitCheckResult> {
  const { userId, role, currency, amount } = params;

  // Look up profile for this role + currency
  const profile = await prisma.roleLimitProfile.findUnique({
    where: { role_currency: { role, currency } },
  });

  // No profile configured = no role-based limit enforced
  if (!profile) return { allowed: true };

  const now = new Date();

  // Get or create usage record
  let usage = await prisma.limitUsage.findUnique({
    where: { userId_currency: { userId, currency } },
  });

  if (!usage) {
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    );

    usage = await prisma.limitUsage.create({
      data: {
        userId,
        currency,
        dailyResetAt: endOfToday,
        monthlyResetAt: startOfNextMonth,
      },
    });
  }

  // Reset daily counter if past reset time
  if (now > usage.dailyResetAt) {
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    usage = await prisma.limitUsage.update({
      where: { id: usage.id },
      data: { dailyUsed: 0, dailyResetAt: endOfToday },
    });
  }

  // Reset monthly counter if past reset time
  if (now > usage.monthlyResetAt) {
    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    );

    usage = await prisma.limitUsage.update({
      where: { id: usage.id },
      data: { monthlyUsed: 0, monthlyResetAt: startOfNextMonth },
    });
  }

  const dailyUsed = Number(usage.dailyUsed);
  const monthlyUsed = Number(usage.monthlyUsed);
  const dailyLimit = Number(profile.dailyLimit);
  const monthlyLimit = Number(profile.monthlyLimit);

  if (dailyUsed + amount > dailyLimit) {
    return {
      allowed: false,
      reason: `Daily ${currency} limit exceeded. Used: ${dailyUsed}, Limit: ${dailyLimit}.`,
      dailyUsed,
      dailyLimit,
      dailyRemaining: Math.max(0, dailyLimit - dailyUsed),
      monthlyUsed,
      monthlyLimit,
      monthlyRemaining: Math.max(0, monthlyLimit - monthlyUsed),
    };
  }

  if (monthlyUsed + amount > monthlyLimit) {
    return {
      allowed: false,
      reason: `Monthly ${currency} limit exceeded. Used: ${monthlyUsed}, Limit: ${monthlyLimit}.`,
      dailyUsed,
      dailyLimit,
      dailyRemaining: Math.max(0, dailyLimit - dailyUsed),
      monthlyUsed,
      monthlyLimit,
      monthlyRemaining: Math.max(0, monthlyLimit - monthlyUsed),
    };
  }

  return {
    allowed: true,
    dailyUsed,
    dailyLimit,
    dailyRemaining: dailyLimit - dailyUsed - amount,
    monthlyUsed,
    monthlyLimit,
    monthlyRemaining: monthlyLimit - monthlyUsed - amount,
  };
}

/**
 * Record usage after a successful transaction.
 * Call this AFTER the transfer/payment commits.
 */
export async function recordLimitUsage(params: {
  userId: string;
  currency: string;
  amount: number;
}) {
  const { userId, currency, amount } = params;
  const now = new Date();

  await prisma.limitUsage.upsert({
    where: { userId_currency: { userId, currency } },
    create: {
      userId,
      currency,
      dailyUsed: amount,
      monthlyUsed: amount,
      dailyResetAt: new Date(new Date(now).setHours(23, 59, 59, 999)),
      monthlyResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    },
    update: {
      dailyUsed: { increment: amount },
      monthlyUsed: { increment: amount },
    },
  });
}

/**
 * Get a user's current limit status for display.
 */
export async function getUserLimitStatus(userId: string, role: string) {
  const currencies = ["HTG", "USD"];
  const result: Record<string, LimitCheckResult> = {};

  for (const currency of currencies) {
    const profile = await prisma.roleLimitProfile.findUnique({
      where: { role_currency: { role, currency } },
    });

    if (!profile) continue;

    const usage = await prisma.limitUsage.findUnique({
      where: { userId_currency: { userId, currency } },
    });

    const dailyUsed = Number(usage?.dailyUsed ?? 0);
    const monthlyUsed = Number(usage?.monthlyUsed ?? 0);
    const dailyLimit = Number(profile.dailyLimit);
    const monthlyLimit = Number(profile.monthlyLimit);

    result[currency] = {
      allowed: true,
      dailyUsed,
      dailyLimit,
      dailyRemaining: Math.max(0, dailyLimit - dailyUsed),
      monthlyUsed,
      monthlyLimit,
      monthlyRemaining: Math.max(0, monthlyLimit - monthlyUsed),
    };
  }

  return result;
}
