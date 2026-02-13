import { prisma } from "../db/prisma";

/**
 * Sanctions Screening Service
 *
 * Phase 1: Placeholder — always returns "clear" but logs the check.
 * Phase 2: Integrate with a real sanctions API (ComplyAdvantage, Dow Jones,
 *          or free OFAC SDN list at https://sanctionslist.ofac.treas.gov/).
 *
 * USER ACTION REQUIRED (future): Sign up for a sanctions screening provider
 * and replace the screenUser() logic.
 */

export interface ScreeningResult {
  result: "clear" | "match" | "error";
  source: string;
  matchData?: any;
}

/**
 * Screen a user against sanctions lists.
 *
 * Currently a placeholder that always returns "clear" but records the check.
 */
export async function screenUser(userId: string): Promise<ScreeningResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
    // KycProfile has the country
  });

  const profile = await prisma.kycProfile.findUnique({
    where: { userId },
    select: { country: true, fullName: true },
  });

  const fullName = profile?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const country = profile?.country || null;

  // Phase 1: Placeholder — always clear
  // TODO: Replace with real sanctions API call
  const result: ScreeningResult = {
    result: "clear",
    source: "manual",
    matchData: null,
  };

  // Log the check regardless
  await prisma.sanctionsCheck.create({
    data: {
      userId,
      fullName: fullName || "Unknown",
      country,
      result: result.result,
      source: result.source,
      matchData: result.matchData,
    },
  });

  return result;
}

/**
 * Get sanctions screening history for a user.
 */
export async function getScreeningHistory(userId: string) {
  return prisma.sanctionsCheck.findMany({
    where: { userId },
    orderBy: { checkedAt: "desc" },
    take: 50,
  });
}
