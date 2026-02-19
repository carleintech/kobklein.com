/**
 * FX Promotion Service — KobKlein API
 *
 * Finds applicable promotions for a transfer, applies discount,
 * records redemption.
 */
import { prisma } from "../db/prisma";

export interface PromoResult {
  promotionId: string;
  name: string;
  discountBps: number;
  bonusPct: number;
  savedAmount: number; // in destination currency
}

/**
 * Find the best available promotion for a transfer corridor.
 * Checks: active, date range, corridor, min/max amount, usage limits.
 * Returns null if no promo applies.
 */
export async function findBestPromo(params: {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  promoCode?: string;
  userId: string;
}): Promise<PromoResult | null> {
  const now = new Date();

  const where: any = {
    active: true,
    fromCurrency: params.fromCurrency,
    toCurrency: params.toCurrency,
    startsAt: { lte: now },
    endsAt: { gte: now },
  };

  // If user provided a promo code, look for that specific one
  if (params.promoCode) {
    where.code = params.promoCode;
  }

  const promos = await prisma.fxPromotion.findMany({
    where,
    orderBy: { discountBps: "desc" }, // best discount first
  });

  for (const promo of promos) {
    // Check usage limits
    if (promo.maxUses && promo.usedCount >= promo.maxUses) continue;

    // Check min amount
    if (promo.minAmount && params.amount < Number(promo.minAmount)) continue;

    // Check max amount (promo applies up to this amount)
    if (promo.maxAmount && params.amount > Number(promo.maxAmount)) continue;

    // Check corridor if specified
    if (promo.corridor) {
      const expectedCorridor = `${params.fromCurrency}_${params.toCurrency}`;
      if (promo.corridor !== expectedCorridor) continue;
    }

    // Check if user already redeemed (for code-based promos, limit 1 per user)
    if (promo.code) {
      const alreadyUsed = await prisma.fxPromoRedemption.count({
        where: { promotionId: promo.id, userId: params.userId },
      });
      if (alreadyUsed > 0) continue;
    }

    // Calculate savings — discountBps reduces spread, bonusPct adds bonus amount
    const bonusPct = promo.bonusPct ? Number(promo.bonusPct) : 0;

    return {
      promotionId: promo.id,
      name: promo.name,
      discountBps: promo.discountBps,
      bonusPct,
      savedAmount: 0, // calculated at conversion time with actual rate
    };
  }

  return null;
}

/**
 * Apply a promotion: calculate actual savings and record redemption.
 * Called after FX conversion is finalized.
 */
export async function redeemPromo(params: {
  promotionId: string;
  userId: string;
  transferId?: string;
  savedAmount: number;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Record redemption
    await tx.fxPromoRedemption.create({
      data: {
        promotionId: params.promotionId,
        userId: params.userId,
        transferId: params.transferId,
        savedAmount: params.savedAmount,
      },
    });

    // Increment usage count
    await tx.fxPromotion.update({
      where: { id: params.promotionId },
      data: { usedCount: { increment: 1 } },
    });
  });
}

/**
 * Admin: List all promotions (active + expired).
 */
export async function listPromotions(options?: {
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (options?.activeOnly) where.active = true;

  const [promos, total] = await Promise.all([
    prisma.fxPromotion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      include: { _count: { select: { FxPromoRedemption: true } } },
    }),
    prisma.fxPromotion.count({ where }),
  ]);

  return { promos, total };
}

/**
 * Admin: Create a new FX promotion.
 */
export async function createPromotion(data: {
  name: string;
  fromCurrency: string;
  toCurrency: string;
  discountBps: number;
  bonusPct?: number;
  minAmount?: number;
  maxAmount?: number;
  code?: string;
  corridor?: string;
  maxUses?: number;
  startsAt: Date;
  endsAt: Date;
}) {
  return prisma.fxPromotion.create({ data });
}

/**
 * Admin: Deactivate a promotion.
 */
export async function deactivatePromotion(id: string) {
  return prisma.fxPromotion.update({
    where: { id },
    data: { active: false },
  });
}
