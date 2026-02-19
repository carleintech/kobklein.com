import { Body, Controller, Get, Query, Post, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";
import { getActiveFxRateFull } from "../fx/fx.service";
import { AuditService } from "../audit/audit.service";

/**
 * Admin FX Rate Management
 *
 * View active rates, set new rates with spread control,
 * and monitor FX revenue.
 */
@Controller("v1/admin/fx")
export class AdminFxController {
  constructor(private auditService: AuditService) {}

  /**
   * GET /v1/admin/fx/active
   * Get the current active FX rate for USD→HTG.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("active")
  async getActiveRate() {
    try {
      const rate = await getActiveFxRateFull("USD", "HTG");
      return { ok: true, rate };
    } catch {
      return { ok: false, rate: null, message: "No active rate configured" };
    }
  }

  /**
   * POST /v1/admin/fx/set
   * Set a new FX rate with mid + spread.
   *
   * buy = mid × (1 - spread/2)  → what user receives (favorable to platform)
   * sell = mid × (1 + spread/2) → what platform sells at
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("set")
  async setRate(
    @Body()
    body: {
      mid: number;
      spreadBps?: number;
      source?: string;
      adminUserId: string;
    },
  ) {
    if (!body.mid || body.mid <= 0) throw new Error("Mid rate must be positive");

    const spreadBps = body.spreadBps ?? 250; // Default 2.5%
    const halfSpread = spreadBps / 10000 / 2;

    const buy = Math.round(body.mid * (1 - halfSpread) * 1000000) / 1000000;
    const sell = Math.round(body.mid * (1 + halfSpread) * 1000000) / 1000000;

    // Deactivate all existing USD→HTG rates
    await prisma.fxRate.updateMany({
      where: { fromCurrency: "USD", toCurrency: "HTG", active: true },
      data: { active: false },
    });

    // Create new active rate
    const rate = await prisma.fxRate.create({
      data: {
        fromCurrency: "USD",
        toCurrency: "HTG",
        rate: buy, // Legacy field — set to buy rate for backward compat
        mid: body.mid,
        buy,
        sell,
        spreadBps,
        source: body.source || "manual",
        active: true,
      },
    });

    await this.auditService.logFinancialAction({
      actorUserId: body.adminUserId,
      eventType: "fx_rate_set",
      meta: {
        mid: body.mid,
        buy,
        sell,
        spreadBps,
        source: body.source || "manual",
      },
    });

    return {
      ok: true,
      rate: {
        id: rate.id,
        mid: Number(rate.mid),
        buy: Number(rate.buy),
        sell: Number(rate.sell),
        spreadBps: rate.spreadBps,
        source: rate.source,
      },
    };
  }

  /**
   * GET /v1/admin/fx/history
   * View FX rate change history.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("history")
  async rateHistory(@Query("limit") limit?: string) {
    const take = Math.min(parseInt(limit || "20", 10), 100);

    const rates = await prisma.fxRate.findMany({
      where: { fromCurrency: "USD", toCurrency: "HTG" },
      orderBy: { createdAt: "desc" },
      take,
    });

    return {
      ok: true,
      rates: rates.map((r) => ({
        id: r.id,
        mid: r.mid ? Number(r.mid) : Number(r.rate),
        buy: r.buy ? Number(r.buy) : Number(r.rate),
        sell: r.sell ? Number(r.sell) : Number(r.rate),
        spreadBps: r.spreadBps,
        source: r.source,
        active: r.active,
        createdAt: r.createdAt,
      })),
    };
  }

  /**
   * GET /v1/admin/fx/revenue
   * FX spread revenue summary.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("revenue")
  async fxRevenue(@Query("days") days?: string) {
    const n = Math.min(parseInt(days || "30", 10), 365);
    const since = new Date();
    since.setDate(since.getDate() - n);

    const conversions = await prisma.fxConversion.findMany({
      where: { createdAt: { gte: since } },
      select: {
        fromAmount: true,
        toAmount: true,
        profit: true,
        createdAt: true,
      },
    });

    const totalFromAmount = conversions.reduce(
      (s, c) => s + Number(c.fromAmount),
      0,
    );
    const totalToAmount = conversions.reduce(
      (s, c) => s + Number(c.toAmount),
      0,
    );
    const totalProfit = conversions.reduce(
      (s, c) => s + Number(c.profit),
      0,
    );

    return {
      ok: true,
      periodDays: n,
      conversionCount: conversions.length,
      totalUsdConverted: totalFromAmount,
      totalHtgDelivered: totalToAmount,
      totalProfitHtg: totalProfit,
    };
  }
}
