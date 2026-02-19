import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { computeWalletBalance } from "../wallets/balance.service";
import { AuditService } from "../audit/audit.service";

@Controller("distributor")
export class FloatTransferController {
  constructor(private auditService: AuditService) {}

  @UseGuards(SupabaseGuard, FreezeGuard)
  @Post("float-transfer")
  async transfer(
    @Req() req: any,
    @Body() body: { toDistributorId: string; amount: number; currency: string }
  ) {
    const userId = req.user.sub;

    const fromDistributor = await prisma.distributor.findFirst({
      where: { userId },
    });

    const toDistributor = await prisma.distributor.findUnique({
      where: { id: body.toDistributorId },
    });

    if (!fromDistributor || !toDistributor)
      throw new Error("Distributor not found");

    const fromWallet = await prisma.wallet.findFirst({
      where: { userId: fromDistributor.userId, type: "DISTRIBUTOR" },
    });
    if (!fromWallet) throw new Error("From distributor wallet not found");

    const toWallet = await prisma.wallet.findFirst({
      where: { userId: toDistributor.userId, type: "DISTRIBUTOR" },
    });
    if (!toWallet) throw new Error("To distributor wallet not found");

    const balance = await computeWalletBalance(fromWallet.id);

    if (balance.availableBalance < body.amount)
      throw new Error("Insufficient float");

    const transferRecord = await prisma.$transaction(async (db) => {
      await db.ledgerEntry.create({
        data: {
          walletId: fromWallet.id,
          amount: -body.amount,
          type: "float_transfer",
        },
      });

      await db.ledgerEntry.create({
        data: {
          walletId: toWallet.id,
          amount: body.amount,
          type: "float_transfer",
        },
      });

      return await db.floatTransfer.create({
        data: {
          fromDistributorId: fromDistributor.id,
          toDistributorId: toDistributor.id,
          amount: body.amount,
          currency: body.currency,
        },
      });
    });

    // Audit logging for float transfer
    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "float_transfer",
      amount: body.amount,
      currency: body.currency,
      fromWalletId: fromWallet.id,
      toWalletId: toWallet.id,
      referenceId: transferRecord.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      meta: {
        fromDistributorId: fromDistributor.id,
        toDistributorId: toDistributor.id,
      },
    });

    return { ok: true };
  }
}