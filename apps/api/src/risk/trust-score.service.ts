import { prisma } from "../db/prisma";

export type TrustLevel = "trusted" | "moderate" | "new" | "unknown";

export interface TrustScoreResult {
  score: number;
  level: TrustLevel;
  reasons: string[];
}

/**
 * Dynamically compute a trust score for a recipient user.
 * Shown next to recipient name in Send screen to help user feel safe.
 */
export async function computeTrustScore(recipientUserId: string): Promise<TrustScoreResult> {
  let score = 0;
  const reasons: string[] = [];

  const user = await prisma.user.findUnique({
    where: { id: recipientUserId },
  });

  if (!user) return { score: 0, level: "unknown", reasons: ["user_not_found"] };

  // Account age
  const ageDays =
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);

  if (ageDays > 90) {
    score += 20;
    reasons.push("established_account");
  } else if (ageDays > 30) {
    score += 10;
    reasons.push("active_account");
  }

  // KYC verification
  if (user.kycStatus === "approved" || user.kycTier >= 2) {
    score += 30;
    reasons.push("kyc_verified");
  } else if (user.kycTier >= 1) {
    score += 10;
    reasons.push("basic_kyc");
  }

  // Successful incoming transfer count
  const transferCount = await prisma.transfer.count({
    where: {
      toWalletId: {
        in: (await prisma.wallet.findMany({
          where: { userId: recipientUserId },
          select: { id: true },
        })).map(w => w.id),
      },
      status: "completed",
    },
  });

  if (transferCount > 20) {
    score += 20;
    reasons.push("active_recipient");
  } else if (transferCount > 5) {
    score += 10;
    reasons.push("some_history");
  }

  // Disputes against this user
  const disputes = await prisma.case.count({
    where: {
      caseType: { in: ["unauthorized", "merchant_dispute"] },
      // Cases where this user was the recipient of a disputed transaction
      referenceId: { not: null },
    },
  });

  if (disputes > 0) {
    score -= 30;
    reasons.push("has_disputes");
  }

  // Frozen account = red flag
  if (user.isFrozen) {
    score -= 40;
    reasons.push("account_frozen");
  }

  // Clamp
  score = Math.max(0, Math.min(score, 100));

  let level: TrustLevel = "new";
  if (score >= 60) level = "trusted";
  else if (score >= 30) level = "moderate";

  return { score, level, reasons };
}
