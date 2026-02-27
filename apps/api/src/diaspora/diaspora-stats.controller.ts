import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";

/**
 * GET /v1/diaspora/stats
 *
 * Lightweight stats endpoint for the diaspora mobile dashboard.
 * Returns: sentThisMonth, totalTransfers, savedVsWesternUnion
 */
@Controller("v1/diaspora")
@UseGuards(SupabaseGuard)
export class DiasporaStatsController {
  @Get("stats")
  async stats(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const senderWallets = await prisma.wallet.findMany({
      where: { userId, currency: "USD", type: "USER" },
      select: { id: true },
    });
    const walletIds = senderWallets.map((w) => w.id);

    if (!walletIds.length) {
      return { sentThisMonth: 0, totalTransfers: 0, savedVsWesternUnion: 0 };
    }

    const now            = new Date();
    const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthTransfers, allTransfers] = await Promise.all([
      // Sent this calendar month
      prisma.transfer.aggregate({
        where: {
          fromWalletId: { in: walletIds },
          status:       { in: ["completed", "posted"] },
          createdAt:    { gte: startOfMonth },
        },
        _sum:   { amount: true },
        _count: true,
      }),
      // All time transfers count
      prisma.transfer.count({
        where: {
          fromWalletId: { in: walletIds },
          status:       { in: ["completed", "posted"] },
        },
      }),
    ]);

    const sentThisMonth     = Number(monthTransfers._sum.amount ?? 0);
    const monthCount        = monthTransfers._count;
    // Savings vs Western Union: avg WU fee ~$8.99, KobKlein ~$1.99, saves ~$7/transfer
    const savedVsWesternUnion = Math.round(monthCount * 7.0 * 100) / 100;

    return {
      sentThisMonth,
      totalTransfers: allTransfers,
      savedVsWesternUnion,
    };
  }
}
