import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";

@Controller("v1/admin/analytics")
export class AnalyticsController {
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("overview")
  async overview(@Query("days") days = "30") {
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const transfers = await prisma.transfer.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { amount: true },
      _count: true,
    });

    const merchantPayments = await prisma.ledgerEntry.aggregate({
      where: {
        type: "merchant_payment",
        createdAt: { gte: since },
      },
      _sum: { amount: true },
    });

    const withdrawals = await prisma.merchantWithdrawal.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { amount: true },
      _count: true,
    });

    const deposits = await prisma.deposit.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { amount: true },
    });

    const revenue = await prisma.ledgerEntry.aggregate({
      where: {
        type: "fee",
        createdAt: { gte: since },
      },
      _sum: { amount: true },
    });

    return {
      transferVolume: Number(transfers._sum.amount ?? 0),
      transferCount: transfers._count,
      merchantVolume: Number(merchantPayments._sum.amount ?? 0),
      withdrawalVolume: Number(withdrawals._sum.amount ?? 0),
      withdrawalCount: withdrawals._count,
      depositVolume: Number(deposits._sum.amount ?? 0),
      revenue: Number(revenue._sum.amount ?? 0),
    };
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("users")
  async userGrowth(@Query("days") days = "30") {
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const [total, newThisPeriod, byRole, kycFunnel, amlOpen, amlCritical] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: since } } }),
        prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
        prisma.user.groupBy({ by: ["kycTier"], _count: { _all: true } }),
        prisma.amlFlag.count({ where: { status: "open" } }),
        prisma.amlFlag.count({ where: { status: "open", severity: "critical" } }),
      ]);

    return {
      total,
      newThisPeriod,
      byRole: Object.fromEntries(
        byRole.map((r) => [r.role.toLowerCase(), r._count._all]),
      ),
      kycFunnel: Object.fromEntries(
        kycFunnel.map((k) => [`tier${k.kycTier}`, k._count._all]),
      ),
      amlFlags: { open: amlOpen, critical: amlCritical },
    };
  }
}