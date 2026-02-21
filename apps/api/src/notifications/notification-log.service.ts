import { pool } from "../db/pool";

// ─── Write logs ────────────────────────────────────────────────

export async function logNotificationQueued(params: {
  channel: string;
  type: string;
  to: string;
  body: string;
  jobId?: string;
  userId?: string;
}): Promise<string> {
  const result = await pool.query(
    `INSERT INTO "NotificationLog" ("channel", "type", "to", "body", "status", "jobId", "userId", "attempts")
     VALUES ($1, $2, $3, $4, 'queued', $5, $6, 0)
     RETURNING id`,
    [params.channel, params.type, params.to, params.body, params.jobId ?? null, params.userId ?? null],
  );
  return result.rows[0].id;
}

export async function markNotificationSent(logId: string, attempts: number): Promise<void> {
  await pool.query(
    `UPDATE "NotificationLog"
     SET status = 'sent', "sentAt" = now(), attempts = $1
     WHERE id = $2`,
    [attempts, logId],
  );
}

export async function markNotificationFailed(logId: string, error: string, attempts: number): Promise<void> {
  await pool.query(
    `UPDATE "NotificationLog"
     SET status = 'failed', error = $1, attempts = $2
     WHERE id = $3`,
    [error, attempts, logId],
  );
}

// ─── Read logs (admin) ─────────────────────────────────────────

export async function getNotificationLogs(params: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: any[]; total: number }> {
  const { status, limit = 50, offset = 0 } = params;

  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (status && status !== "all") {
    conditions.push(`n.status = $${idx++}`);
    values.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT n.*, u."firstName", u."email"
       FROM "NotificationLog" n
       LEFT JOIN "User" u ON u.id = n."userId"
       ${where}
       ORDER BY n."createdAt" DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset],
    ),
    pool.query(
      `SELECT COUNT(*)::int as total FROM "NotificationLog" n ${where}`,
      values,
    ),
  ]);

  return {
    rows: dataResult.rows,
    total: countResult.rows[0].total,
  };
}

export async function getNotificationStats(): Promise<{
  total: number;
  sent: number;
  failed: number;
  queued: number;
  todaySent: number;
  todayFailed: number;
}> {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = 'sent')::int as sent,
      COUNT(*) FILTER (WHERE status = 'failed')::int as failed,
      COUNT(*) FILTER (WHERE status = 'queued')::int as queued,
      COUNT(*) FILTER (WHERE status = 'sent' AND "createdAt" >= CURRENT_DATE)::int as "todaySent",
      COUNT(*) FILTER (WHERE status = 'failed' AND "createdAt" >= CURRENT_DATE)::int as "todayFailed"
    FROM "NotificationLog"
  `);
  return result.rows[0];
}

export async function getNotificationById(id: string) {
  const result = await pool.query(
    `SELECT * FROM "NotificationLog" WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

/**
 * Reset a failed notification to queued so the worker picks it up again.
 */
export async function resetNotificationForRetry(id: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE "NotificationLog"
     SET status = 'queued', error = NULL, "sentAt" = NULL
     WHERE id = $1 AND status = 'failed'
     RETURNING id`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
