import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";

/**
 * Admin Treasury Dashboard
 *
 * Shows treasury wallet balances (computed from ledger) and revenue breakdown
 * by type (merchant fees, FX profit, cash-out fees, commissions).
 *
 * Uses the existing TREASURY wallets (Wallet model with type: "TREASURY").
 * NO separate TreasuryWallet model — that pattern was wrong in the pasted code.
 */
@Controller("v1/admin/treasury")
export class AdminTreasuryController {
  /**
   * GET /v1/admin/treasury
   * Get all treasury wallet balances (computed from ledger entries).
   */
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get()
  async getBalances() {
    const treasuryWallets = await prisma.wallet.findMany({
      where: { type: "TREASURY" },
    });

    const balances: { walletId: string; currency: string; balance: number }[] = [];

    for (const wallet of treasuryWallets) {
      const result = await prisma.ledgerEntry.aggregate({
        where: { walletId: wallet.id },
        _sum: { amount: true },
      });

      balances.push({
        walletId: wallet.id,
        currency: wallet.currency,
        balance: Number(result._sum.amount ?? 0),
      });
    }

    return { ok: true, wallets: balances };
  }

  /**
   * GET /v1/admin/treasury/revenue?days=30
   * Revenue breakdown by ledger type for treasury wallets.
   */
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get("revenue")
  async revenueBreakdown(@Query("days") days?: string) {
    const n = Math.min(parseInt(days || "30", 10), 365);
    const since = new Date();
    since.setDate(since.getDate() - n);

    const treasuryWallets = await prisma.wallet.findMany({
      where: { type: "TREASURY" },
      select: { id: true, currency: true },
    });

    const walletIds = treasuryWallets.map((w) => w.id);

    // Get all treasury credits grouped by type
    const entries = await prisma.ledgerEntry.findMany({
      where: {
        walletId: { in: walletIds },
        amount: { gt: 0 }, // Only credits (revenue)
        createdAt: { gte: since },
      },
      select: { amount: true, type: true, walletId: true },
    });

    // Build breakdown
    const breakdown: Record<string, number> = {};
    for (const e of entries) {
      const key = e.type;
      breakdown[key] = (breakdown[key] || 0) + Number(e.amount);
    }

    const totalRevenue = Object.values(breakdown).reduce(
      (s, v) => s + v,
      0,
    );

    return {
      ok: true,
      periodDays: n,
      totalRevenue,
      breakdown,
      // Common categories explained:
      // merchant_fee — POS + merchant payment fees
      // fx_profit — FX spread revenue
      // cash_out_fee — distributor cash-out fees
      // commission — distributor commissions
    };
  }
}
