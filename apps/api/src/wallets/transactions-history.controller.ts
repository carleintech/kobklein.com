import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { getUserLimits } from "../limits/spending-limits.service";

@Controller("v1/transactions")
export class TransactionsHistoryController {
  /**
   * Unified transaction history from ledger entries.
   * Returns all money movement for the user's wallets.
   */
  @UseGuards(SupabaseGuard)
  @Get()
  async list(
    @Req() req: any,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: { id: true, currency: true },
    });

    const walletIds = wallets.map(w => w.id);

    if (walletIds.length === 0) return [];

    const take = Math.min(Number(limit) || 50, 100);
    const skip = Number(offset) || 0;

    const entries = await prisma.ledgerEntry.findMany({
      where: { walletId: { in: walletIds } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        walletId: true,
        amount: true,
        type: true,
        transferId: true,
        reference: true,
        createdAt: true,
      },
    });

    return entries;
  }

  /**
   * Get user's spending limits info.
   */
  @UseGuards(SupabaseGuard)
  @Get("limits")
  async limits(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    return getUserLimits(userId);
  }
}
