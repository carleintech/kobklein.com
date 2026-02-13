import { prisma } from "../db/prisma";

/**
 * Calculate merchant fee for a payment.
 *
 * Priority:
 *   1. Per-merchant fee profile (MerchantFeeProfile) if exists + active
 *   2. Global fee config (FeeConfig type: "merchant_payment")
 *   3. No fee (0)
 *
 * Phase 46: Added per-merchant fee profile support (percent/fixed/hybrid/none).
 */
export async function calculateMerchantFee(
  amount: number,
  merchantId?: string,
) {
  // 1. Check per-merchant profile first
  if (merchantId) {
    const profile = await prisma.merchantFeeProfile.findUnique({
      where: { merchantId },
    });

    if (profile && profile.active) {
      const fee = calcFee({
        mode: profile.mode as "percent" | "fixed" | "hybrid" | "none",
        percentBps: profile.percentBps,
        fixedFee: Number(profile.fixedFee),
        amount,
      });

      return { fee, net: amount - fee };
    }
  }

  // 2. Fall back to global FeeConfig
  const config = await prisma.feeConfig.findFirst({
    where: { type: "merchant_payment", active: true },
  });

  if (!config) return { fee: 0, net: amount };

  const percent = Number(config.percent);
  const flat = Number(config.flat);

  const fee = (amount * percent) / 100 + flat;
  const net = amount - fee;

  return { fee, net };
}

/**
 * Pure fee calculation (no DB lookup).
 * Used internally and can be used for previews.
 */
export function calcFee(params: {
  mode: "percent" | "fixed" | "hybrid" | "none";
  percentBps: number;
  fixedFee: number;
  amount: number;
}): number {
  if (params.mode === "none") return 0;

  const pct = (params.amount * params.percentBps) / 10000;
  const fixed = params.fixedFee;

  if (params.mode === "percent") return Math.round(pct * 100) / 100;
  if (params.mode === "fixed") return fixed;

  // hybrid
  return Math.round((pct + fixed) * 100) / 100;
}
