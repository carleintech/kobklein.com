import { Controller, Get, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { pool } from "../db/pool";

@Controller("admin/risk")
export class RiskAdminController {
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("flags")
  async flags() {
    const result = await pool.query(`
      SELECT * FROM "RiskFlag" ORDER BY "createdAt" DESC LIMIT 100
    `);
    return result.rows;
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("signals")
  async signals() {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      velocityAlerts,
      reversalsRecent,
      reversalsToday,
      openCases,
      failedWebhooks,
      highSeverityFlags,
      blockedUsers,
      unresolvedFlags,
    ] = await Promise.all([
      // Velocity blocks in last 10 min
      pool.query(
        `SELECT COUNT(*)::int AS count FROM "RiskFlag"
         WHERE type = 'velocity' AND "createdAt" >= $1`,
        [tenMinAgo],
      ),

      // Reversals in last 10 min
      pool.query(
        `SELECT COUNT(*)::int AS count FROM "Reversal"
         WHERE "createdAt" >= $1`,
        [tenMinAgo],
      ),

      // Reversals today (for trend)
      pool.query(
        `SELECT COUNT(*)::int AS count FROM "Reversal"
         WHERE "createdAt" >= $1`,
        [todayStart],
      ),

      // Open/investigating cases
      pool.query(
        `SELECT COUNT(*)::int AS count FROM "Case"
         WHERE status IN ('open', 'investigating')`,
      ),

      // Failed webhook events
      pool.query(
        `SELECT COUNT(*)::int AS count FROM "WebhookEvent"
         WHERE status = 'failed'`,
      ),

      // High severity flags (3+) in last hour
      pool.query(
        `SELECT COUNT(*)::int AS count FROM "RiskFlag"
         WHERE severity >= 3 AND "createdAt" >= $1`,
        [oneHourAgo],
      ),

      // Currently blocked users (severity 3+ unresolved)
      pool.query(
        `SELECT COUNT(DISTINCT "userId")::int AS count FROM "RiskFlag"
         WHERE severity >= 3 AND "resolvedAt" IS NULL`,
      ),

      // Total unresolved risk flags
      pool.query(
        `SELECT COUNT(*)::int AS count FROM "RiskFlag"
         WHERE "resolvedAt" IS NULL`,
      ),
    ]);

    return {
      velocityAlerts: velocityAlerts.rows[0].count,
      reversalsLast10Min: reversalsRecent.rows[0].count,
      reversalsToday: reversalsToday.rows[0].count,
      openCases: openCases.rows[0].count,
      failedWebhooks: failedWebhooks.rows[0].count,
      highSeverityFlagsLastHour: highSeverityFlags.rows[0].count,
      blockedUsers: blockedUsers.rows[0].count,
      unresolvedFlags: unresolvedFlags.rows[0].count,
    };
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("recent-flags")
  async recentFlags() {
    const result = await pool.query(`
      SELECT rf.*, u.phone, u.email
      FROM "RiskFlag" rf
      LEFT JOIN "User" u ON u.id = rf."userId"
      WHERE rf."resolvedAt" IS NULL
      ORDER BY rf.severity DESC, rf."createdAt" DESC
      LIMIT 50
    `);
    return result.rows;
  }
}
