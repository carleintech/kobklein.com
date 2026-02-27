import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { computeWalletBalance, getBalance } from "./balance.service";

@Controller("v1/wallets")
export class WalletBalanceController {
  /**
   * GET /v1/wallets/balance
   * Returns both the primary USER wallet summary (totalBalance, availableBalance, heldBalance)
   * AND the full balances array across all wallets — satisfies both client.tsx and wallet/page.tsx.
   */
  @UseGuards(SupabaseGuard)
  @Get("balance")
  async balance(@Req() req: any) {
    // localUser.id is the DB cuid; req.user.sub is the Supabase UUID — never mix them
    const userId = req.localUser?.id || req.user?.sub;

    try {
      const wallets = await prisma.wallet.findMany({
        where: { userId },
      });

      if (!wallets.length) {
        return { totalBalance: 0, availableBalance: 0, heldBalance: 0, balances: [] };
      }

      // Build per-wallet balances (used by wallet/page.tsx)
      const balances = await Promise.all(
        wallets.map(async (w) => ({
          walletId: w.id,
          currency: w.currency,
          type: w.type,
          balance: await getBalance(w.id).catch(() => 0),
        }))
      );

      // Primary USER wallet full detail (used by client.tsx)
      const primaryWallet = wallets.find(w => w.type === "USER") ?? wallets[0];
      const primary = await computeWalletBalance(primaryWallet.id);

      return {
        // Flat fields for client.tsx
        totalBalance:      primary.totalBalance,
        availableBalance:  primary.availableBalance,
        heldBalance:       primary.heldBalance,
        // Array for wallet/page.tsx
        balances,
      };
    } catch (err) {
      console.error("[WalletBalance] Unexpected error:", err);
      // Return safe zeros instead of a 500 so the dashboard still renders
      return { totalBalance: 0, availableBalance: 0, heldBalance: 0, balances: [] };
    }
  }
}