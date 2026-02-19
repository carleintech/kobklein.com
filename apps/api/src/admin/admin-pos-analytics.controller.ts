import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";

/**
 * Admin POS Analytics
 *
 * Gross/Fee/Net breakdown for merchant payments across the platform.
 * Uses the existing ledger types:
 *   - merchant_payment (customer debit = gross, merchant credit = net)
 *   - merchant_fee (treasury credit = platform fee)
 */
@Controller("v1/admin/pos")
export class AdminPosAnalyticsController {
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("analytics")
  async analytics(@Query("days") days?: string) {
    const n = Math.min(parseInt(days || "30", 10), 365);
    const since = new Date();
    since.setDate(since.getDate() - n);

    const [feeResult, merchantCreditResult] = await Promise.all([
      // Total fees collected by treasury
      prisma.ledgerEntry.aggregate({
        where: { type: "merchant_fee", createdAt: { gte: since } },
        _sum: { amount: true },
        _count: true,
      }),
      // Total net credited to merchants
      prisma.ledgerEntry.aggregate({
        where: {
          type: "merchant_payment",
          amount: { gt: 0 }, // Only credits (merchant side)
          createdAt: { gte: since },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalFee = Number(feeResult._sum.amount ?? 0);
    const totalNet = Number(merchantCreditResult._sum.amount ?? 0);
    const totalGross = totalNet + totalFee;

    return {
      ok: true,
      periodDays: n,
      pos: {
        totalGross,
        totalFee,
        totalNet,
        transactionCount: merchantCreditResult._count,
      },
    };
  }
}
