import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { pool } from "../db/pool";

@Controller("v1/admin/reports")
export class SettlementReportsController {
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("distributor-cashouts")
  async distributorCashouts(@Query("days") days?: string) {
    const d = Math.min(Number(days ?? 7), 30);

    const start = new Date();
    start.setDate(start.getDate() - d);

    // Pull completed withdrawals within window
    const rows = await pool.query(`
      SELECT "distributorId", amount, "feeAmount", currency, "updatedAt"
      FROM "Withdrawal"
      WHERE status = $1 AND "updatedAt" >= $2 AND "distributorId" IS NOT NULL
      ORDER BY "updatedAt" DESC
    `, ["completed", start]);

    // Simple aggregation in JS (fast enough for MVP)
    const map = new Map<string, any>();

    for (const r of rows.rows) {
      const key = `${r.distributorId}:${r.currency}`;
      const curr = map.get(key) ?? {
        distributorId: r.distributorId,
        currency: r.currency,
        totalCashout: 0,
        totalFees: 0,
        count: 0,
      };

      curr.totalCashout += Number(r.amount);
      curr.totalFees += Number(r.feeAmount ?? 0);
      curr.count += 1;

      map.set(key, curr);
    }

    return Array.from(map.values()).sort((a, b) => b.totalCashout - a.totalCashout);
  }
}