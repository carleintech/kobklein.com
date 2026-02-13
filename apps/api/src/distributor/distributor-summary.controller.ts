import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { computeWalletBalance } from "../wallets/balance.service";

@Controller("v1/distributor")
export class DistributorSummaryController {

  @UseGuards(Auth0Guard)
  @Get("summary")
  async summary(@Req() req: any) {
    const userId = req.user.sub;

    const distributor = await prisma.distributor.findUnique({
      where: { userId },
    });

    if (!distributor || distributor.status !== "active") {
      throw new Error("Distributor not active");
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

    const recentTxns = await prisma.distributorTxn.findMany({
      where: { distributorId: distributor.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const floatBalance = floatWallet ? await computeWalletBalance(floatWallet.id) : null;

    return {
      floatBalance: floatBalance?.availableBalance || 0,
      today: {
        cashIn: todayCashIn,
        cashOut: todayCashOut,
        commission: todayCommission,
      },
      totalCommission: totalCommission._sum.amount || 0,
      recentTransactions: recentTxns,
    };
  }
}
