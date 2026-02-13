import { prisma } from "../db/prisma";
import { pool } from "../db/pool";

/**
 * KYC Tier Definitions (Haiti regulatory context):
 *
 * Tier 0: <$50/month  — Phone-only (default)
 * Tier 1: <$500/month — Requires: National ID/passport + selfie
 * Tier 2: <$5,000/month — Requires: Tier 1 + address proof
 * Tier 3: Unlimited — Enhanced due diligence (manual admin review)
 */

interface KycTierResult {
  currentTier: number;
  requiredTier: number;
  gaps: string[];
  monthlyVolume: number;
}

/**
 * Calculate the user's 30-day transaction volume (in USD equivalent).
 */
async function getMonthlyVolume(userId: string): Promise<number> {
  const result = await pool.query(
    `
    SELECT COALESCE(SUM(ABS(le.amount)), 0) as total
    FROM "LedgerEntry" le
    JOIN "Wallet" w ON w.id = le."walletId"
    WHERE w."userId" = $1
      AND le."createdAt" >= NOW() - INTERVAL '30 days'
    `,
    [userId],
  );
  return Number(result.rows[0]?.total ?? 0);
}

/**
 * Determine the required KYC tier based on the user's transaction volume.
 */
function getTierForVolume(volumeUsd: number): number {
  if (volumeUsd < 50) return 0;
  if (volumeUsd < 500) return 1;
  if (volumeUsd < 5000) return 2;
  return 3;
}

/**
 * Evaluate KYC tier requirements for a user.
 * Returns the current tier, required tier, and any document gaps.
 */
export async function evaluateKycTier(userId: string): Promise<KycTierResult> {
  const [user, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { kycTier: true } }),
    prisma.kycProfile.findUnique({ where: { userId } }),
  ]);

  const monthlyVolume = await getMonthlyVolume(userId);
  const requiredTier = getTierForVolume(monthlyVolume);
  const currentTier = user?.kycTier ?? 0;

  const gaps: string[] = [];

  if (requiredTier >= 1) {
    if (!profile?.documentType) gaps.push("ID document type required");
    if (!profile?.idNumber) gaps.push("ID number required");
    if (!profile?.documentUrl) gaps.push("ID document photo required");
    if (!profile?.selfieUrl) gaps.push("Selfie photo required");
  }

  if (requiredTier >= 2) {
    if (!profile?.addressProof) gaps.push("Address proof required");
    if (!profile?.address) gaps.push("Physical address required");
  }

  if (requiredTier >= 3) {
    gaps.push("Enhanced due diligence — manual admin review required");
  }

  return {
    currentTier,
    requiredTier,
    gaps,
    monthlyVolume,
  };
}

/**
 * Get a list of missing documents/fields for the user's current KYC profile.
 */
export async function getKycGaps(userId: string): Promise<string[]> {
  const result = await evaluateKycTier(userId);
  return result.gaps;
}
