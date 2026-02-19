import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { computeWalletBalance } from "../wallets/balance.service";

@Controller("v1/distributor")
export class DistributorSummaryController {

  @UseGuards(SupabaseGuard)
  @Get("dashboard")
  async dashboard(@Req() req: any) {
    // localUser.id is the DB cuid — must use this for Prisma queries, not req.user.sub (Supabase UUID)
    const userId = req.localUser?.id || req.user?.sub;

    const distributor = await prisma.distributor.findUnique({
      where: { userId },
    });

    if (!distributor) {
      return {
        distributorId: null,
        businessName: null,
        status: "pending",
        floatBalance: 0,
        totalFloat: 0,
        todayTransactions: 0,
        todayCommissions: 0,
        commissionRate: 0,
        settlements: [],
      };
    }

    const floatWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        type: "DISTRIBUTOR",
        currency: "HTG",
      },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayTxns = await prisma.distributorTxn.findMany({
      where: {
        distributorId: distributor.id,
        createdAt: { gte: startOfDay },
      },
    });

    const todayCashIn = todayTxns
      .filter(t => t.type === "cash_in")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const todayCashOut = todayTxns
      .filter(t => t.type === "cash_out")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const todayCommission = todayTxns
      .reduce((sum, t) => sum + Number(t.commission || 0), 0);

    const totalCommission = await prisma.distributorCommission.aggregate({
      where: { distributorId: distributor.id },
      _sum: { amount: true },
    });

    // All-time total float loaded
    const allTimeTxns = await prisma.distributorTxn.findMany({
      where: { distributorId: distributor.id, type: "cash_in" },
      select: { amount: true },
    });
    const totalFloat = allTimeTxns.reduce((sum, t) => sum + Number(t.amount), 0);

    const recentTxns = await prisma.distributorTxn.findMany({
      where: { distributorId: distributor.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const floatBalance = floatWallet ? await computeWalletBalance(floatWallet.id) : null;

    return {
      distributorId: distributor.id,
      businessName: distributor.businessName || null,
      status: distributor.status || "active",
      floatBalance: floatBalance?.availableBalance || 0,
      totalFloat,
      todayTransactions: todayTxns.length,
      todayCommissions: todayCommission,
      commissionRate: Number(distributor.commissionOut || 0.02),
      settlements: recentTxns.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        currency: t.currency || "HTG",
        type: t.type,
        createdAt: t.createdAt,
      })),
    };
  }

  // Keep old route alias for backward compatibility
  @UseGuards(SupabaseGuard)
  @Get("summary")
  async summary(@Req() req: any) {
    return this.dashboard(req);
  }
}
