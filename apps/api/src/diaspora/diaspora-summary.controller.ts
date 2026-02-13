import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { computeWalletBalance } from "../wallets/balance.service";
import { getActiveFxRate } from "../fx/fx.service";

@Controller("v1/diaspora")
export class DiasporaSummaryController {
  /**
   * Diaspora-focused summary: USD balance, FX rate, family stats.
   * Complements the existing GET /v1/family/dashboard (HTG-focused).
   */
  @UseGuards(Auth0Guard)
  @Get("summary")
  async summary(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    // USD wallet balance
    const usdWallet = await prisma.wallet.findFirst({
      where: { userId, currency: "USD", type: "USER" },
    });

    let usdBalance = 0;
    if (usdWallet) {
      const bal = await computeWalletBalance(usdWallet.id);
      usdBalance = bal.availableBalance;
    }

    // HTG wallet balance (optional — diaspora might have one)
    const htgWallet = await prisma.wallet.findFirst({
      where: { userId, currency: "HTG", type: "USER" },
    });

    let htgBalance = 0;
    if (htgWallet) {
      const bal = await computeWalletBalance(htgWallet.id);
      htgBalance = bal.availableBalance;
    }

    // Family count
    const familyCount = await prisma.familyLink.count({
      where: { diasporaUserId: userId },
    });

    // Current FX rate (best-effort — don't crash if not configured)
    let fxRate: number | null = null;
    try {
      fxRate = await getActiveFxRate("USD", "HTG");
    } catch {
      // FX rate not yet configured — return null
    }

    // Total sent to family (all time)
    const familyLinks = await prisma.familyLink.findMany({
      where: { diasporaUserId: userId },
      select: { familyUserId: true },
    });
    const familyUserIds = familyLinks.map((l) => l.familyUserId);

    let totalSentToFamily = 0;
    if (usdWallet && familyUserIds.length > 0) {
      const familyWallets = await prisma.wallet.findMany({
        where: { userId: { in: familyUserIds } },
        select: { id: true },
      });
      const familyWalletIds = familyWallets.map((w) => w.id);

      if (familyWalletIds.length > 0) {
        const transfers = await prisma.transfer.findMany({
          where: {
            fromWalletId: usdWallet.id,
            toWalletId: { in: familyWalletIds },
            status: "completed",
          },
          select: { amount: true },
        });
        totalSentToFamily = transfers.reduce(
          (sum, t) => sum + Number(t.amount),
          0,
        );
      }
    }

    return {
      usdBalance,
      htgBalance,
      familyCount,
      fxRate,
      totalSentUsd: totalSentToFamily,
      walletId: usdWallet?.id || null,
    };
  }
}
