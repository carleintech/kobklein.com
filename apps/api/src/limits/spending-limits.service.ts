import { prisma } from "../db/prisma";

/**
 * KYC-based spending limits.
 * Level 0 (unverified) = low limits
 * Level 1 (basic)      = medium limits
 * Level 2 (verified)   = high limits
 */
const LIMITS = {
  0: { dailySend: 5_000, dailyReceive: 10_000, monthly: 50_000 },
  1: { dailySend: 25_000, dailyReceive: 50_000, monthly: 200_000 },
  2: { dailySend: 100_000, dailyReceive: 300_000, monthly: 1_000_000 },
} as const;

function getLimitsForTier(kycTier: number) {
  if (kycTier >= 2) return LIMITS[2];
  if (kycTier >= 1) return LIMITS[1];
  return LIMITS[0];
}

export async function checkSendLimit(userId: string, amount: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycTier: true },
  });

  const limits = getLimitsForTier(user?.kycTier ?? 0);

  // Daily send check
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sent24h = await prisma.transfer.aggregate({
    where: { senderUserId: userId, createdAt: { gte: since24h } },
    _sum: { amount: true },
  });
  const totalSent = Number(sent24h._sum.amount || 0);

  if (totalSent + amount > limits.dailySend) {
    throw new Error(
      `Daily send limit exceeded. Limit: ${limits.dailySend} HTG. Verify your account to increase limits.`,
    );
  }

  // Monthly check
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sentMonth = await prisma.transfer.aggregate({
    where: { senderUserId: userId, createdAt: { gte: since30d } },
    _sum: { amount: true },
  });
  const totalMonth = Number(sentMonth._sum.amount || 0);

  if (totalMonth + amount > limits.monthly) {
    throw new Error(
      `Monthly limit exceeded. Limit: ${limits.monthly} HTG. Verify your account to increase limits.`,
    );
  }

  return {
    dailyUsed: totalSent,
    dailyLimit: limits.dailySend,
    dailyRemaining: limits.dailySend - totalSent,
    monthlyUsed: totalMonth,
    monthlyLimit: limits.monthly,
  };
}

export async function getUserLimits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycTier: true },
  });

  const limits = getLimitsForTier(user?.kycTier ?? 0);

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sent24h = await prisma.transfer.aggregate({
    where: { senderUserId: userId, createdAt: { gte: since24h } },
    _sum: { amount: true },
  });

  return {
    kycTier: user?.kycTier ?? 0,
    dailySend: limits.dailySend,
    dailyReceive: limits.dailyReceive,
    monthly: limits.monthly,
    dailyUsed: Number(sent24h._sum.amount || 0),
  };
}
