import { Controller, Get, UseGuards } from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { pool } from "../db/pool";

@Controller("admin/liquidity")
export class LiquidityController {
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get("agents")
  async agents() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const DEFAULT_LOW_FLOAT_THRESHOLD = 5000;

    // Get all active distributors
    const distributors = await pool.query(`
      SELECT d.id, d."businessName", d."phonePublic", d."locationText",
             d."commissionIn", d."commissionOut", d.status, d."userId"
      FROM "Distributor" d
      WHERE d.status = 'active'
      ORDER BY d."businessName"
    `);

    const result: Array<{
      distributorId: string;
      name: string;
      city: string;
      floatBalance: number;
      threshold: number;
      todayVolume: number;
      todayCashoutCount: number;
      lastCashout: string | null;
      status: "green" | "warning" | "critical";
      riskSignals: string[];
    }> = [];

    for (const dist of distributors.rows) {
      // 1) Float balance from ledger
      const balResult = await pool.query(`
        SELECT COALESCE(SUM(le.amount), 0)::numeric AS balance
        FROM "LedgerEntry" le
        JOIN "Wallet" w ON w.id = le."walletId"
        WHERE w."userId" = $1 AND w.type = 'DISTRIBUTOR'
      `, [dist.userId]);
      const floatBalance = parseFloat(balResult.rows[0].balance);

      // 2) Today cash-out volume + count + last cash-out
      const cashoutResult = await pool.query(`
        SELECT
          COALESCE(SUM(amount), 0)::numeric AS volume,
          COUNT(*)::int AS count,
          MAX("updatedAt") AS last_cashout
        FROM "Withdrawal"
        WHERE "distributorId" = $1
          AND status = 'completed'
          AND "createdAt" >= $2
      `, [dist.id, todayStart]);
      const todayVolume = parseFloat(cashoutResult.rows[0].volume);
      const todayCashoutCount = cashoutResult.rows[0].count;
      const lastCashout = cashoutResult.rows[0].last_cashout;

      // 3) Last cash-out ever (if none today)
      let lastCashoutEver = lastCashout;
      if (!lastCashoutEver) {
        const lastEverResult = await pool.query(`
          SELECT MAX("updatedAt") AS last_cashout
          FROM "Withdrawal"
          WHERE "distributorId" = $1 AND status = 'completed'
        `, [dist.id]);
        lastCashoutEver = lastEverResult.rows[0].last_cashout;
      }

      // 4) Status
      const threshold = DEFAULT_LOW_FLOAT_THRESHOLD;
      let status: "green" | "warning" | "critical" = "green";
      if (floatBalance <= 0 || floatBalance < threshold) {
        status = "critical";
      } else if (floatBalance < threshold * 1.5) {
        status = "warning";
      }

      // 5) Risk signals
      const riskSignals: string[] = [];
      if (floatBalance <= 0) riskSignals.push("ZERO_BALANCE");
      if (floatBalance < threshold) riskSignals.push("BELOW_THRESHOLD");
      if (floatBalance < threshold * 1.5 && floatBalance >= threshold) riskSignals.push("APPROACHING_THRESHOLD");
      if (todayVolume > floatBalance * 3) riskSignals.push("HIGH_VELOCITY");
      if (!lastCashoutEver) riskSignals.push("NEVER_CASHED_OUT");

      // Check if last cash-out was > 24h ago (inactive agent)
      if (lastCashoutEver) {
        const hoursSince = (Date.now() - new Date(lastCashoutEver).getTime()) / 3600000;
        if (hoursSince > 24) riskSignals.push("INACTIVE_24H");
      }

      result.push({
        distributorId: dist.id,
        name: dist.businessName,
        city: dist.locationText,
        floatBalance,
        threshold,
        todayVolume,
        todayCashoutCount,
        lastCashout: lastCashoutEver ?? null,
        status,
        riskSignals,
      });
    }

    // Sort: critical first, then warning, then green; within same status, lowest float first
    const order = { critical: 0, warning: 1, green: 2 };
    result.sort((a, b) => {
      const statusDiff = order[a.status] - order[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.floatBalance - b.floatBalance;
    });

    return result;
  }
}
