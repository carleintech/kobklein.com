import { pool } from "../db/pool";
import { redis } from "../services/redis.client";
import { createFraudCase } from "../cases/case.service";

function key(userId: string, scope: string) {
  return `risk:${scope}:${userId}`;
}

/**
 * Basic velocity rules (tune later):
 * - max 5 transfer attempts per 60 seconds
 * - max 30 transfer attempts per 1 hour
 * - if exceeded => flag + temporary block
 */
export async function enforceTransferVelocity(userId: string) {
  const perMinuteKey = key(userId, "xfer_1m");
  const perHourKey = key(userId, "xfer_1h");
  const blockKey = key(userId, "blocked");

  // If blocked, deny immediately
  const blocked = await redis.get(blockKey);
  if (blocked) {
    throw new Error("Account temporarily blocked due to suspicious activity");
  }

  // Increment counters
  const minuteCount = await redis.incr(perMinuteKey);
  const hourCount = await redis.incr(perHourKey);

  // Set TTL on first increment
  if (minuteCount === 1) await redis.expire(perMinuteKey, 60);
  if (hourCount === 1) await redis.expire(perHourKey, 3600);

  const MAX_PER_MINUTE = 5;
  const MAX_PER_HOUR = 30;

  if ((minuteCount ?? 0) > MAX_PER_MINUTE || (hourCount ?? 0) > MAX_PER_HOUR) {
    // Write a DB flag for admin visibility/audit
    const flagResult = await pool.query(
      `INSERT INTO "RiskFlag" ("id", "userId", "type", "severity", "details", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, now())
       RETURNING id`,
      [userId, "velocity", 3, JSON.stringify({ minuteCount, hourCount, maxPerMinute: MAX_PER_MINUTE, maxPerHour: MAX_PER_HOUR })],
    );

    // Auto-create fraud investigation case
    await createFraudCase({
      userId,
      riskFlagId: flagResult.rows[0].id,
      severity: 3,
      details: `Velocity breach: ${minuteCount}/min, ${hourCount}/hr`,
    });

    // Temporary block for 10 minutes
    await redis.set(blockKey, "1", { EX: 600 });

    throw new Error("Transfer velocity exceeded; account temporarily blocked");
  }
}

export async function flagRisk(params: {
  userId: string;
  type: string;
  severity: number;
  details?: any;
}) {
  const { userId, type, severity, details } = params;
  const flagResult = await pool.query(
    `INSERT INTO "RiskFlag" ("id", "userId", "type", "severity", "details", "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, now())
     RETURNING id`,
    [userId, type, severity, details ? JSON.stringify(details) : null],
  );

  // Auto-create case for high-severity flags
  if (severity >= 3) {
    await createFraudCase({
      userId,
      riskFlagId: flagResult.rows[0].id,
      severity,
      details: typeof details === "object" ? JSON.stringify(details) : details,
    });
  }
}
