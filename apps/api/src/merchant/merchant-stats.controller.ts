import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";

@Controller("merchant")
export class MerchantStatsController {
  @UseGuards(Auth0Guard)
  @Get("today")
  async today(@Req() req: any) {
    const userId = req.user.sub;

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

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const payments = await prisma.ledgerEntry.aggregate({
      where: {
        walletId: wallet.id,
        type: "merchant_payment",
        createdAt: { gte: start },
      },
      _sum: { amount: true },
    });

    const fees = await prisma.ledgerEntry.aggregate({
      where: {
        type: "merchant_fee",
        createdAt: { gte: start },
      },
      _sum: { amount: true },
    });

    const balance = await prisma.ledgerEntry.aggregate({
      where: { walletId: wallet.id },
      _sum: { amount: true },
    });

    return {
      todaySales: Number(payments._sum.amount ?? 0),
      todayFees: Number(fees._sum.amount ?? 0),
      balance: Number(balance._sum.amount ?? 0),
      netToday:
        Number(payments._sum.amount ?? 0) -
        Number(fees._sum.amount ?? 0),
    };
  }
}