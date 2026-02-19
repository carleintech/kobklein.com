import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";

@Controller("v1/merchant")
export class MerchantStatsController {
  @UseGuards(SupabaseGuard)
  @Get("stats")
  async stats(@Req() req: any) {
    // localUser.id is the DB cuid — must use this for Prisma queries, not req.user.sub (Supabase UUID)
    const userId = req.localUser?.id || req.user?.sub;

    const merchant = await prisma.merchant.findFirst({
      where: { userId },
    });

    if (!merchant) {
      return { error: "Merchant not found" };
    }

    const wallet = await prisma.wallet.findFirst({
      where: { userId, type: "MERCHANT" },
    });

    if (!wallet) {
      return { error: "Merchant wallet not found" };
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's payments (count + sum)
    const todayPayments = await prisma.ledgerEntry.findMany({
      where: {
        walletId: wallet.id,
        type: "merchant_payment",
        createdAt: { gte: startOfDay },
      },
      select: { amount: true },
    });

    // Week sales
    const weekPayments = await prisma.ledgerEntry.aggregate({
      where: {
        walletId: wallet.id,
        type: "merchant_payment",
        createdAt: { gte: startOfWeek },
      },
      _sum: { amount: true },
    });

    // Month sales
    const monthPayments = await prisma.ledgerEntry.aggregate({
      where: {
        walletId: wallet.id,
        type: "merchant_payment",
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    const todayFees = await prisma.ledgerEntry.aggregate({
      where: {
        walletId: wallet.id,
        type: "merchant_fee",
        createdAt: { gte: startOfDay },
      },
      _sum: { amount: true },
    });

    const balance = await prisma.ledgerEntry.aggregate({
      where: { walletId: wallet.id },
      _sum: { amount: true },
    });

    return {
      todaySales: todayPayments.reduce((s, e) => s + Number(e.amount), 0),
      todayCount: todayPayments.length,
      todayFees: Number(todayFees._sum.amount ?? 0),
      balance: Number(balance._sum.amount ?? 0),
      netToday:
        todayPayments.reduce((s, e) => s + Number(e.amount), 0) -
        Number(todayFees._sum.amount ?? 0),
      weekSales: Number(weekPayments._sum.amount ?? 0),
      monthSales: Number(monthPayments._sum.amount ?? 0),
    };
  }

  // Keep old route for backward compatibility
  @UseGuards(SupabaseGuard)
  @Get("today")
  async today(@Req() req: any) {
    return this.stats(req);
  }
}