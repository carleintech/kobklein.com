import { pool } from "../db/pool";

export async function runReconciliation() {
  // Create run record
  const runResult = await pool.query(`
    INSERT INTO "ReconciliationRun" ("id", "startedAt", "status")
    VALUES (gen_random_uuid(), now(), 'running')
    RETURNING *
  `);
  const run = runResult.rows[0];

  try {
    // 1) Total webhook events processed
    const webhookResult = await pool.query(`SELECT COUNT(*)::int as count FROM "WebhookEvent"`);
    const webhookCount = webhookResult.rows[0].count;

    // 2) Pending withdrawals that are expired
    const expiredResult = await pool.query(`
      SELECT COUNT(*)::int as count FROM "Withdrawal"
      WHERE status = 'pending' AND "expiresAt" < now()
    `);
    const expiredPendingWithdrawals = expiredResult.rows[0].count;

    // 3) Stuck domain events (queued > 10 minutes)
    const stuckResult = await pool.query(`
      SELECT COUNT(*)::int as count FROM "DomainEvent"
      WHERE status = 'queued' AND "createdAt" < (now() - interval '10 minutes')
    `);
    const stuckDomainEvents = stuckResult.rows[0].count;

    // 4) Wallets with negative balance (computed from ledger truth)
    const negativeResult = await pool.query(`
      SELECT COUNT(*)::int as count FROM (
        SELECT "walletId", SUM(amount) as balance
        FROM "LedgerEntry"
        GROUP BY "walletId"
        HAVING SUM(amount) < -0.01
      ) sub
    `);
    const negativeWallets = negativeResult.rows[0].count;

    // 5) Orphaned ledger entries (transferId references a non-existent transfer)
    const orphanedResult = await pool.query(`
      SELECT COUNT(*)::int as count FROM "LedgerEntry" le
      WHERE le."transferId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "Transfer" t WHERE t.id = le."transferId")
    `);
    const orphanedLedgerEntries = orphanedResult.rows[0].count;

    // 6) Duplicate webhook events (same provider+eventId appearing more than once — shouldn't happen)
    const dupWebhookResult = await pool.query(`
      SELECT COUNT(*)::int as count FROM (
        SELECT provider, "eventId", COUNT(*) as c
        FROM "WebhookEvent"
        GROUP BY provider, "eventId"
        HAVING COUNT(*) > 1
      ) sub
    `);
    const duplicateWebhooks = dupWebhookResult.rows[0].count;

    const summary = {
      webhookCount,
      expiredPendingWithdrawals,
      stuckDomainEvents,
      negativeWallets,
      orphanedLedgerEntries,
      duplicateWebhooks,
    };

    await pool.query(`
      UPDATE "ReconciliationRun"
      SET status = 'success', "finishedAt" = now(), summary = $1, error = NULL
      WHERE id = $2
    `, [JSON.stringify(summary), run.id]);

    return { runId: run.id, ...summary };
  } catch (e: any) {
    await pool.query(`
      UPDATE "ReconciliationRun"
      SET status = 'failed', "finishedAt" = now(), error = $1
      WHERE id = $2
    `, [e?.message ?? "unknown", run.id]);
    throw e;
  }
}
