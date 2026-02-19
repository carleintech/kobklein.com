import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";

@Controller("wallet")
export class WalletBalanceController {
  @UseGuards(SupabaseGuard)
  @Get("balance")
  async balance(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const wallet = await prisma.wallet.findFirst({
      where: { userId, type: "USER" },
    });

    if (!wallet) return { balance: 0 };

    const sum = await prisma.ledgerEntry.aggregate({
      where: { walletId: wallet.id },
      _sum: { amount: true },
    });

    const last = await prisma.ledgerEntry.findFirst({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
    });

    return {
      balance: Number(sum._sum.amount ?? 0),
      lastTransaction: last
        ? {
            type: last.type,
            amount: Number(last.amount),
            createdAt: last.createdAt,
          }
        : null,
    };
  }
}