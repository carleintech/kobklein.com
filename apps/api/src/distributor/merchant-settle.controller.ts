import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { FreezeGuard } from "../security/freeze.guard";

@Controller("distributor")
export class MerchantSettlementController {
  @UseGuards(Auth0Guard, FreezeGuard)
  @Post("merchant-settle")
  async settle(@Req() req: any, @Body() body: { code: string }) {
    const distributorUserId = req.user.sub;

    const distributor = await prisma.distributor.findFirst({
      where: { userId: distributorUserId },
    });
    if (!distributor) throw new Error("Distributor not found");

    const withdrawal = await prisma.merchantWithdrawal.findUnique({
      where: { code: body.code },
    });

    if (!withdrawal || withdrawal.status !== "pending")
      throw new Error("Invalid code");

    await prisma.$transaction(async (db) => {
      await db.ledgerEntry.create({
        data: {
          walletId: withdrawal.walletId,
          amount: -withdrawal.amount,
          type: "merchant_cashout",
        },
      });

      const distributorWallet = await db.wallet.findFirst({
        where: { userId: distributor.userId, type: "DISTRIBUTOR" },
      });
      if (!distributorWallet) throw new Error("Distributor wallet not found");

      await db.ledgerEntry.create({
        data: {
          walletId: distributorWallet.id,
          amount: -withdrawal.amount,
          type: "merchant_cashout",
        },
      });

      await db.merchantWithdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: "completed",
          distributorId: distributor.id,
          completedAt: new Date(),
        },
      });
    });

    return { ok: true };
  }
}