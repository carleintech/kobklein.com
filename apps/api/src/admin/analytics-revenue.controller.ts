import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";

@Controller("admin/analytics")
export class AnalyticsRevenueController {
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("daily-revenue")
  async daily(@Query("days") days = "30") {
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const rows = await prisma.$queryRaw<
      { day: string; revenue: number }[]
    >`
      SELECT
        DATE("createdAt") as day,
        SUM(amount)::float as revenue
      FROM "LedgerEntry"
      WHERE "createdAt" >= ${since} AND type = 'merchant_fee'
      GROUP BY day
      ORDER BY day ASC
    `;

    return rows.map(r => ({
      day: r.day,
      revenue: Number(r.revenue || 0),
    }));
  }
}