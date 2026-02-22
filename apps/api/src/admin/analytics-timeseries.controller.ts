import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";

@Controller("v1/admin/analytics")
export class AnalyticsTimeseriesController {
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("daily-volume")
  async daily(@Query("days") days = "30") {
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const rows = await prisma.$queryRaw<
      { day: string; volume: number }[]
    >`
      SELECT
        DATE("createdAt") as day,
        SUM(amount)::float as volume
      FROM "Transfer"
      WHERE "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `;

    return rows.map(r => ({
      day: r.day,
      volume: Number(r.volume || 0),
    }));
  }
}