/**
 * Plan Features Service — Resolves tier-based features for financial operations.
 *
 * This service bridges the PlatformPlan system with existing financial logic:
 * - Transfer limits adjusted by plan tier
 * - Merchant fee discounts applied to MerchantFeeProfile
 * - Distributor commission bonuses
 * - FX markup reductions for diaspora users
 *
 * Free tier users get default behavior — no plan = no special features.
 */
import { prisma } from "../db/prisma";

export interface PlanFeatureSet {
  tier: number;
  role: string;
  // Diaspora features
  sendLimit?: number;         // monthly USD limit
  fxMarkup?: number;          // FX markup % (lower is better)
  kpayIncluded?: boolean;     // K-Pay subscription access
  familyLinks?: number;       // max family link count
  virtualCard?: boolean;      // virtual card access
  // Merchant features
  feeDiscount?: number;       // fee discount % (0-100)
  posDevices?: number;        // max POS devices
  reportAccess?: string;      // "basic" | "advanced" | "full"
  settlementDays?: number;    // days until settlement (0 = instant)
  // Distributor features
  commissionBonus?: number;   // commission bonus % (added to base rate)
  floatLimit?: number;        // max float amount HTG
  subAgents?: number;         // max sub-agents
  // Shared
  dedicatedSupport?: boolean;
}

/**
 * Resolve the current plan features for a user.
 * Returns default (tier 0) features if no active plan.
 */
export async function resolvePlanFeatures(userId: string): Promise<PlanFeatureSet> {
  const userPlan = await prisma.userPlan.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing"] },
      currentPeriodEnd: { gte: new Date() },
    },
    include: { PlatformPlan: true },
    orderBy: { PlatformPlan: { tier: "desc" } },
  });

  if (!userPlan) {
    // Look up user role for default features
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return getDefaultFeatures(user?.role || "user");
  }

  const features = (userPlan.PlatformPlan.features || {}) as Record<string, any>;

  return {
    tier: userPlan.PlatformPlan.tier,
    role: userPlan.PlatformPlan.role,
    ...features,
  };
}

/**
 * Get default (free tier) features for a role.
 */
function getDefaultFeatures(role: string): PlanFeatureSet {
  switch (role) {
    case "diaspora":
      return {
        tier: 0,
        role: "diaspora",
        sendLimit: 500,
        fxMarkup: 2.0,
        kpayIncluded: false,
        familyLinks: 1,
        virtualCard: false,
      };
    case "merchant":
      return {
        tier: 0,
        role: "merchant",
        feeDiscount: 0,
        posDevices: 1,
        reportAccess: "basic",
        settlementDays: 3,
      };
    case "distributor":
      return {
        tier: 0,
        role: "distributor",
        commissionBonus: 0,
        floatLimit: 50000,
        subAgents: 0,
      };
    default:
      return { tier: 0, role };
  }
}

/**
 * Check if a user's plan allows a specific feature.
 */
export async function hasPlanFeature(
  userId: string,
  feature: string,
): Promise<boolean> {
  const features = await resolvePlanFeatures(userId);
  return !!(features as any)[feature];
}

/**
 * Get the effective daily transfer limit for a user,
 * considering both KYC tier limits and plan-based limits.
 */
export async function getEffectiveTransferLimit(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyTransferLimit: true, role: true },
  });
  if (!user) return 0;

  const kycLimit = Number(user.dailyTransferLimit);
  const features = await resolvePlanFeatures(userId);

  // Plan sendLimit is monthly — convert to daily rough estimate
  if (features.sendLimit) {
    const planDailyEstimate = features.sendLimit / 30;
    // Take the MINIMUM of KYC-based and plan-based limits
    // KYC limit is the regulatory ceiling, plan limit is the commercial tier
    return Math.min(kycLimit, features.sendLimit);
  }

  return kycLimit;
}

/**
 * Calculate effective merchant fee after plan discount.
 */
export function applyPlanFeeDiscount(
  baseFee: number,
  feeDiscountPct: number,
): number {
  if (!feeDiscountPct || feeDiscountPct <= 0) return baseFee;
  const discount = baseFee * (feeDiscountPct / 100);
  return Math.max(0, baseFee - discount);
}

/**
 * Calculate effective commission rate with plan bonus.
 */
export function applyCommissionBonus(
  baseRate: number,
  bonusPct: number,
): number {
  if (!bonusPct || bonusPct <= 0) return baseRate;
  // Bonus adds a percentage ON TOP of base rate
  // e.g., base 2% + 15% bonus = 2% * 1.15 = 2.3%
  return baseRate * (1 + bonusPct / 100);
}
