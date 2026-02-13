import { Controller, Get, UseGuards } from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { pool } from "../db/pool";

@Controller("admin")
export class AdminController {
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get("stats")
  stats() {
    return { secret: "admin only data" };
  }

  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get("overview")
  async overview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      platformBalance,
      todayVolume,
      todayCashIn,
      todayCashOut,
      activeUsers,
      activeAgents,
      pendingWithdrawals,
      openCases,
      stuckEvents,
    ] = await Promise.all([
      // 1) Total platform liability (sum of all ledger entries)
      pool.query(`SELECT COALESCE(SUM(amount), 0)::numeric as total FROM "LedgerEntry"`),

      // 2) Today transfer volume
      pool.query(`SELECT COALESCE(SUM(amount), 0)::numeric as total FROM "Transfer" WHERE "createdAt" >= $1`, [today]),

      // 3) Today cash-in (deposits)
      pool.query(`SELECT COALESCE(SUM(amount), 0)::numeric as total FROM "Deposit" WHERE "createdAt" >= $1`, [today]),

      // 4) Today cash-out (completed withdrawals)
      pool.query(`SELECT COALESCE(SUM(amount), 0)::numeric as total FROM "Withdrawal" WHERE status = 'completed' AND "updatedAt" >= $1`, [today]),

      // 5) Active users (have at least 1 transfer in last 30 days)
      pool.query(`
        SELECT COUNT(DISTINCT w."userId")::int as count
        FROM "Transfer" t
        JOIN "Wallet" w ON w.id = t."fromWalletId"
        WHERE t."createdAt" >= $1
      `, [new Date(Date.now() - 30 * 86400000)]),

      // 6) Active agents
      pool.query(`SELECT COUNT(*)::int as count FROM "Distributor" WHERE status = 'active'`),

      // 7) Pending withdrawals
      pool.query(`SELECT COUNT(*)::int as count FROM "Withdrawal" WHERE status = 'pending' AND "expiresAt" > now()`),

      // 8) Open cases
      pool.query(`SELECT COUNT(*)::int as count FROM "Case" WHERE status IN ('open', 'investigating')`),

      // 9) Stuck events
      pool.query(`SELECT COUNT(*)::int as count FROM "DomainEvent" WHERE status = 'queued' AND "createdAt" < (now() - interval '10 minutes')`),
    ]);

    return {
      platformBalance: parseFloat(platformBalance.rows[0].total),
      todayVolume: parseFloat(todayVolume.rows[0].total),
      todayCashIn: parseFloat(todayCashIn.rows[0].total),
      todayCashOut: parseFloat(todayCashOut.rows[0].total),
      activeUsers: activeUsers.rows[0].count,
      activeAgents: activeAgents.rows[0].count,
      pendingWithdrawals: pendingWithdrawals.rows[0].count,
      openCases: openCases.rows[0].count,
      stuckEvents: stuckEvents.rows[0].count,
    };
  }

  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get("liquidity")
  async liquidity() {
    // Get all active distributors with their float balances
    const DEFAULT_LOW_FLOAT_THRESHOLD = 5000;

    const distributors = await pool.query(`
      SELECT d.id, d."businessName", d."phonePublic", d."locationText",
             d."commissionIn", d."commissionOut", d.status
      FROM "Distributor" d
      WHERE d.status = 'active'
      ORDER BY d."businessName"
    `);

    const result: Array<{
      id: string; businessName: string; location: string;
      phone: string; floatBalance: number; threshold: number;
      commissionIn: number; commissionOut: number; healthStatus: string;
    }> = [];
    for (const dist of distributors.rows) {
      // Get the distributor's DISTRIBUTOR-type wallet balance
      const balResult = await pool.query(`
        SELECT COALESCE(SUM(le.amount), 0)::numeric as balance
        FROM "LedgerEntry" le
        JOIN "Wallet" w ON w.id = le."walletId"
        WHERE w."userId" = (SELECT "userId" FROM "Distributor" WHERE id = $1)
          AND w.type = 'DISTRIBUTOR'
      `, [dist.id]);

      const floatBalance = parseFloat(balResult.rows[0].balance);
      let healthStatus = "green";
      if (floatBalance <= 0) healthStatus = "critical";
      else if (floatBalance < DEFAULT_LOW_FLOAT_THRESHOLD) healthStatus = "warning";

      result.push({
        id: dist.id,
        businessName: dist.businessName,
        location: dist.locationText,
        phone: dist.phonePublic,
        floatBalance,
        threshold: DEFAULT_LOW_FLOAT_THRESHOLD,
        commissionIn: Number(dist.commissionIn),
        commissionOut: Number(dist.commissionOut),
        healthStatus,
      });
    }

    // Sort: critical first, then warning, then green
    const order = { critical: 0, warning: 1, green: 2 };
    result.sort((a, b) => (order[a.healthStatus as keyof typeof order] ?? 9) - (order[b.healthStatus as keyof typeof order] ?? 9));

    return result;
  }

  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get("recent-activity")
  async recentActivity() {
    const [transfers, deposits, withdrawals] = await Promise.all([
      pool.query(`
        SELECT id, "fromWalletId", "toWalletId", amount, currency, status, "createdAt"
        FROM "Transfer" ORDER BY "createdAt" DESC LIMIT 20
      `),
      pool.query(`
        SELECT id, "walletId", amount, currency, source, "createdAt"
        FROM "Deposit" ORDER BY "createdAt" DESC LIMIT 20
      `),
      pool.query(`
        SELECT id, "userId", "walletId", "distributorId", amount, currency, status, code, "expiresAt", "createdAt"
        FROM "Withdrawal" ORDER BY "createdAt" DESC LIMIT 20
      `),
    ]);

    return {
      recentTransfers: transfers.rows,
      recentDeposits: deposits.rows,
      recentWithdrawals: withdrawals.rows,
    };
  }
}
