import { prisma } from "../db/prisma";

export type TransactionRiskLevel = "low" | "medium" | "high";
export type RiskAction = "allowed" | "otp_required" | "blocked" | "frozen";

export interface TransactionRiskResult {
  riskLevel: TransactionRiskLevel;
  score: number;
  reasons: string[];
  action: RiskAction;
  riskEventId?: string; // persisted event ID
}

/**
 * Evaluate risk for a financial transaction.
 *
 * Rules (V2):
 *   R1 — New device:              +40
 *   R2 — New IP:                  +20
 *   R3 — Amount >= 2000:          +20, >= 5000: +40
 *   R4 — Velocity (>3 in 10min):  +40
 *   R5 — New recipient:           +20
 *   R6 — Active account flag:     +20 per active flag (capped at +40)
 *
 * Thresholds:
 *   0–39  = low    → allowed
 *   40–69 = medium → otp_required
 *   70+   = high   → blocked (auto-freeze if 90+)
 */
export async function evaluateTransactionRisk(params: {
  userId: string;
  amount: number;
  currency: string;
  recipientUserId?: string;
  isNewDevice?: boolean;
  ip?: string;
  userAgent?: string;
  eventType?: string; // transfer_attempt | cash_out | merchant_payment
}): Promise<TransactionRiskResult> {
  const reasons: string[] = [];
  let score = 0;

  // R1 — New device
  if (params.isNewDevice) {
    score += 40;
    reasons.push("new_device");
  }

  // R2 — New IP
  if (params.ip) {
    const ipSeen = await prisma.deviceSession.findFirst({
      where: { userId: params.userId, ip: params.ip },
    });

    if (!ipSeen) {
      score += 20;
      reasons.push("new_ip");
    }
  }

  // R3 — Amount threshold
  if (params.amount >= 5000) {
    score += 40;
    reasons.push("high_amount_5000+");
  } else if (params.amount >= 2000) {
    score += 20;
    reasons.push("amount_2000+");
  }

  // R4 — Velocity: transfers in last 10 minutes
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentTransfers = await prisma.transfer.count({
    where: { senderUserId: params.userId, createdAt: { gte: tenMinAgo } },
  });

  if (recentTransfers > 3) {
    score += 40;
    reasons.push("high_velocity");
  }

  // R5 — New recipient
  if (params.recipientUserId) {
    const priorContact = await prisma.transferContact.findUnique({
      where: {
        userId_contactUserId: {
          userId: params.userId,
          contactUserId: params.recipientUserId,
        },
      },
    });

    if (!priorContact) {
      score += 20;
      reasons.push("new_recipient");
    }
  }

  // R6 — Active account flags
  const activeFlags = await prisma.accountFlag.findMany({
    where: { userId: params.userId, resolvedAt: null },
    select: { flagType: true, severity: true },
  });

  if (activeFlags.length > 0) {
    const flagBoost = Math.min(activeFlags.length * 20, 40);
    score += flagBoost;
    reasons.push(
      ...activeFlags.map((f) => `account_flag:${f.flagType}`),
    );
  }

  // Clamp score to 100
  score = Math.min(score, 100);

  // Determine level + action
  let riskLevel: TransactionRiskLevel = "low";
  let action: RiskAction = "allowed";

  if (score >= 70) {
    riskLevel = "high";
    action = score >= 90 ? "frozen" : "blocked";
  } else if (score >= 40) {
    riskLevel = "medium";
    action = "otp_required";
  }

  // Persist risk event
  const riskEvent = await prisma.riskEvent.create({
    data: {
      userId: params.userId,
      eventType: params.eventType || "transfer_attempt",
      riskScore: score,
      riskLevel,
      reasons,
      action,
      ip: params.ip,
      userAgent: params.userAgent,
      meta: {
        amount: params.amount,
        currency: params.currency,
        recipientUserId: params.recipientUserId,
      },
    },
  });

  // Auto-create RiskFlag for high-risk events
  if (riskLevel === "high") {
    await prisma.riskFlag.create({
      data: {
        userId: params.userId,
        type: reasons.includes("high_velocity") ? "velocity" : "suspicious_pattern",
        severity: score >= 90 ? 4 : 3,
        details: { riskEventId: riskEvent.id, score, reasons, action },
      },
    });
  }

  return { riskLevel, reasons, score, action, riskEventId: riskEvent.id };
}

/**
 * Get the risk profile summary for a user.
 * Used by admin dashboard to see a user's risk history.
 */
export async function getUserRiskProfile(userId: string) {
  const [recentEvents, activeFlags, unresolvedRiskFlags] = await Promise.all([
    prisma.riskEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.accountFlag.findMany({
      where: { userId, resolvedAt: null },
    }),
    prisma.riskFlag.findMany({
      where: { userId, resolvedAt: null },
    }),
  ]);

  const highRiskCount = recentEvents.filter(
    (e) => e.riskLevel === "high",
  ).length;

  return {
    userId,
    recentEvents,
    activeFlags,
    unresolvedRiskFlags,
    summary: {
      totalEvents: recentEvents.length,
      highRiskEvents: highRiskCount,
      activeAccountFlags: activeFlags.length,
      unresolvedRiskFlags: unresolvedRiskFlags.length,
    },
  };
}
