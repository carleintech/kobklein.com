/**
 * AML (Anti-Money Laundering) Service — KobKlein API
 *
 * Evaluates transfers against AML rules and creates flags.
 * Rules:
 * - velocity: too many transfers in short time window
 * - structuring: amounts just below reporting threshold
 * - large_cash: cash operations above threshold
 * - sanctioned_country: transfer to/from high-risk country
 * - pattern: unusual activity patterns
 */
import { prisma } from "../db/prisma";

// ─── Configuration ───────────────────────────────────────────────────

const AML_RULES = {
  velocity: {
    maxTransfers24h: 10,
    maxTransfers1h: 5,
    severity: "medium" as const,
  },
  structuring: {
    reportingThresholdHTG: 250_000, // BRH reporting threshold
    reportingThresholdUSD: 3_000,
    windowPercent: 0.9, // Flag if amount is 90-99% of threshold
    severity: "high" as const,
  },
  largeCash: {
    thresholdHTG: 500_000,
    thresholdUSD: 5_000,
    severity: "high" as const,
  },
  sanctionedCountries: ["IR", "KP", "SY", "CU", "VE"],
};

// ─── Evaluation ──────────────────────────────────────────────────────

/**
 * Evaluate a transfer for AML flags.
 * Returns created flags (empty array if clean).
 */
export async function evaluateTransfer(params: {
  userId: string;
  transferId: string;
  amount: number;
  currency: string;
  type: string; // transfer, cash_in, cash_out
  recipientCountry?: string;
}): Promise<{ flags: Array<{ id: string; type: string; severity: string }> }> {
  const flags: Array<{ id: string; type: string; severity: string }> = [];

  // Rule 1: Velocity check
  const velocityFlag = await checkVelocity(params.userId, params.transferId);
  if (velocityFlag) flags.push(velocityFlag);

  // Rule 2: Structuring detection
  const structuringFlag = checkStructuring(
    params.amount,
    params.currency,
    params.userId,
    params.transferId,
  );
  if (structuringFlag) flags.push(await createFlag(structuringFlag));

  // Rule 3: Large cash operations
  if (params.type === "cash_in" || params.type === "cash_out") {
    const largeCashFlag = checkLargeCash(
      params.amount,
      params.currency,
      params.userId,
      params.transferId,
    );
    if (largeCashFlag) flags.push(await createFlag(largeCashFlag));
  }

  // Rule 4: Sanctioned country
  if (params.recipientCountry) {
    const sanctionFlag = checkSanctionedCountry(
      params.recipientCountry,
      params.userId,
      params.transferId,
    );
    if (sanctionFlag) flags.push(await createFlag(sanctionFlag));
  }

  return { flags };
}

// ─── Individual Rule Checks ──────────────────────────────────────────

async function checkVelocity(
  userId: string,
  transferId: string,
): Promise<{ id: string; type: string; severity: string } | null> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [count1h, count24h] = await Promise.all([
    prisma.ledgerEntry.count({
      where: {
        wallet: { userId },
        createdAt: { gte: oneHourAgo },
        amount: { lt: 0 }, // outgoing only
      },
    }),
    prisma.ledgerEntry.count({
      where: {
        wallet: { userId },
        createdAt: { gte: oneDayAgo },
        amount: { lt: 0 },
      },
    }),
  ]);

  if (count1h >= AML_RULES.velocity.maxTransfers1h) {
    return createFlag({
      userId,
      type: "velocity",
      severity: "high",
      description: `${count1h} outgoing transactions in last hour (limit: ${AML_RULES.velocity.maxTransfers1h})`,
      ruleId: "velocity_1h",
      transferId,
      metadata: { count1h, count24h },
    });
  }

  if (count24h >= AML_RULES.velocity.maxTransfers24h) {
    return createFlag({
      userId,
      type: "velocity",
      severity: AML_RULES.velocity.severity,
      description: `${count24h} outgoing transactions in last 24h (limit: ${AML_RULES.velocity.maxTransfers24h})`,
      ruleId: "velocity_24h",
      transferId,
      metadata: { count1h, count24h },
    });
  }

  return null;
}

function checkStructuring(
  amount: number,
  currency: string,
  userId: string,
  transferId: string,
): FlagInput | null {
  const threshold =
    currency === "HTG"
      ? AML_RULES.structuring.reportingThresholdHTG
      : AML_RULES.structuring.reportingThresholdUSD;

  const floor = threshold * AML_RULES.structuring.windowPercent;

  if (amount >= floor && amount < threshold) {
    return {
      userId,
      type: "structuring",
      severity: AML_RULES.structuring.severity,
      description: `Amount ${currency} ${amount.toLocaleString()} is ${((amount / threshold) * 100).toFixed(1)}% of reporting threshold (${currency} ${threshold.toLocaleString()})`,
      ruleId: "structuring_threshold",
      transferId,
      metadata: { amount, currency, threshold, percentOfThreshold: amount / threshold },
    };
  }

  return null;
}

function checkLargeCash(
  amount: number,
  currency: string,
  userId: string,
  transferId: string,
): FlagInput | null {
  const threshold =
    currency === "HTG"
      ? AML_RULES.largeCash.thresholdHTG
      : AML_RULES.largeCash.thresholdUSD;

  if (amount >= threshold) {
    return {
      userId,
      type: "large_cash",
      severity: AML_RULES.largeCash.severity,
      description: `Large cash operation: ${currency} ${amount.toLocaleString()} exceeds threshold of ${currency} ${threshold.toLocaleString()}`,
      ruleId: "large_cash",
      transferId,
      metadata: { amount, currency, threshold },
    };
  }

  return null;
}

function checkSanctionedCountry(
  country: string,
  userId: string,
  transferId: string,
): FlagInput | null {
  if (AML_RULES.sanctionedCountries.includes(country.toUpperCase())) {
    return {
      userId,
      type: "sanctioned_country",
      severity: "critical",
      description: `Transfer involves sanctioned country: ${country}`,
      ruleId: "sanctioned_country",
      transferId,
      metadata: { country },
    };
  }

  return null;
}

// ─── Flag CRUD ───────────────────────────────────────────────────────

interface FlagInput {
  userId: string;
  type: string;
  severity: string;
  description: string;
  ruleId?: string;
  transferId?: string;
  metadata?: any;
}

async function createFlag(
  input: FlagInput,
): Promise<{ id: string; type: string; severity: string }> {
  const flag = await prisma.amlFlag.create({
    data: {
      userId: input.userId,
      type: input.type,
      severity: input.severity,
      description: input.description,
      ruleId: input.ruleId,
      transferId: input.transferId,
      metadata: input.metadata,
    },
  });

  return { id: flag.id, type: flag.type, severity: flag.severity };
}

/**
 * Admin: List AML flags with filters.
 */
export async function listFlags(options?: {
  status?: string;
  severity?: string;
  type?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (options?.status) where.status = options.status;
  if (options?.severity) where.severity = options.severity;
  if (options?.type) where.type = options.type;
  if (options?.userId) where.userId = options.userId;

  const [flags, total] = await Promise.all([
    prisma.amlFlag.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      include: {
        user: {
          select: { id: true, kId: true, firstName: true, lastName: true, phone: true },
        },
      },
    }),
    prisma.amlFlag.count({ where }),
  ]);

  return { flags, total };
}

/**
 * Admin: Resolve an AML flag.
 */
export async function resolveFlag(
  flagId: string,
  adminUserId: string,
  status: "resolved" | "false_positive" | "escalated",
  note?: string,
) {
  return prisma.amlFlag.update({
    where: { id: flagId },
    data: {
      status,
      resolvedBy: adminUserId,
      resolvedAt: new Date(),
      resolveNote: note,
    },
  });
}

/**
 * Get AML summary stats for admin dashboard.
 */
export async function getAmlStats() {
  const [open, investigating, escalated, resolvedToday] = await Promise.all([
    prisma.amlFlag.count({ where: { status: "open" } }),
    prisma.amlFlag.count({ where: { status: "investigating" } }),
    prisma.amlFlag.count({ where: { status: "escalated" } }),
    prisma.amlFlag.count({
      where: {
        status: { in: ["resolved", "false_positive"] },
        resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  const bySeverity = await prisma.amlFlag.groupBy({
    by: ["severity"],
    where: { status: { in: ["open", "investigating"] } },
    _count: true,
  });

  return {
    open,
    investigating,
    escalated,
    resolvedToday,
    bySeverity: bySeverity.reduce(
      (acc, s) => ({ ...acc, [s.severity]: s._count }),
      {} as Record<string, number>,
    ),
  };
}
