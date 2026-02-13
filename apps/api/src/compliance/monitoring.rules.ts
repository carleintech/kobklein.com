import { prisma } from "../db/prisma";
import { pool } from "../db/pool";
import { createNotification } from "../notifications/notification.service";
import { renderTemplate, toLang } from "../i18n/render";

/**
 * Compliance monitoring result.
 */
export interface ComplianceResult {
  pass: boolean;
  flags: string[];
  action: "allow" | "review" | "block";
}

/**
 * Run compliance checks on a transfer before it's processed.
 *
 * Rules:
 * 1. Structuring detection — Multiple txns just under threshold within 24h
 * 2. Rapid succession — >5 transfers in 1 hour
 * 3. New account high value — Account <7 days + transfer >$200
 * 4. Dormant account reactivation — No activity 90 days + sudden high volume
 */
export async function checkTransactionCompliance(
  transfer: { fromUserId: string; amount: number; currency: string },
  user: { id: string; createdAt: Date; preferredLang?: string },
): Promise<ComplianceResult> {
  const flags: string[] = [];
  const amount = Number(transfer.amount);

  // ─── Rule 1: Structuring detection ──────────────────────────
  // Multiple transactions just under $500 within 24 hours
  const structuringThreshold = 500;
  const recentTxns = await pool.query(
    `
    SELECT COUNT(*) as cnt, COALESCE(SUM(ABS(le.amount)), 0) as total
    FROM "LedgerEntry" le
    JOIN "Wallet" w ON w.id = le."walletId"
    WHERE w."userId" = $1
      AND le."createdAt" >= NOW() - INTERVAL '24 hours'
      AND le.amount < 0
    `,
    [transfer.fromUserId],
  );

  const count24h = Number(recentTxns.rows[0]?.cnt ?? 0);
  const total24h = Number(recentTxns.rows[0]?.total ?? 0);

  if (
    count24h >= 3 &&
    amount < structuringThreshold &&
    amount > structuringThreshold * 0.8 &&
    total24h + amount > structuringThreshold
  ) {
    flags.push("structuring_suspected");
  }

  // ─── Rule 2: Rapid succession ──────────────────────────────
  const recentHour = await pool.query(
    `
    SELECT COUNT(*) as cnt
    FROM "LedgerEntry" le
    JOIN "Wallet" w ON w.id = le."walletId"
    WHERE w."userId" = $1
      AND le."createdAt" >= NOW() - INTERVAL '1 hour'
      AND le.amount < 0
    `,
    [transfer.fromUserId],
  );

  if (Number(recentHour.rows[0]?.cnt ?? 0) >= 5) {
    flags.push("rapid_succession");
  }

  // ─── Rule 3: New account high value ────────────────────────
  const accountAge = Date.now() - new Date(user.createdAt).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  if (accountAge < sevenDaysMs && amount > 200) {
    flags.push("new_account_high_value");
  }

  // ─── Rule 4: Dormant account reactivation ──────────────────
  const lastActivity = await pool.query(
    `
    SELECT MAX(le."createdAt") as last_tx
    FROM "LedgerEntry" le
    JOIN "Wallet" w ON w.id = le."walletId"
    WHERE w."userId" = $1
      AND le."createdAt" < NOW() - INTERVAL '1 day'
    `,
    [transfer.fromUserId],
  );

  const lastTx = lastActivity.rows[0]?.last_tx;
  if (lastTx) {
    const dormantMs = Date.now() - new Date(lastTx).getTime();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    if (dormantMs > ninetyDaysMs && amount > 100) {
      flags.push("dormant_reactivation");
    }
  }

  // ─── Determine action ──────────────────────────────────────
  if (flags.length === 0) {
    return { pass: true, flags: [], action: "allow" };
  }

  // Block if structuring is suspected (most serious)
  const action = flags.includes("structuring_suspected") ? "block" as const : "review" as const;

  // Create a compliance case
  if (flags.length > 0) {
    await prisma.case.create({
      data: {
        caseType: "compliance_flag",
        status: "open",
        priority: action === "block" ? "critical" : "high",
        reporterUserId: "system",
        subject: `Compliance flag: ${flags.join(", ")}`,
        description: `Transfer of ${transfer.amount} ${transfer.currency} from user ${transfer.fromUserId} triggered: ${flags.join(", ")}`,
        referenceType: "transfer",
      },
    });

    // Notify user
    const lang = toLang(user.preferredLang);
    const msg = renderTemplate("compliance_flag", lang, {
      amount: transfer.amount,
      currency: transfer.currency,
    });
    await createNotification(transfer.fromUserId, msg.title, msg.body, "security");
  }

  return { pass: false, flags, action };
}
