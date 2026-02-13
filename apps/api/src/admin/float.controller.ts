import { Body, Controller, Post, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { AuditService } from "../audit/audit.service";

@Controller("admin/float")
export class FloatController {
  constructor(private auditService: AuditService) {}

  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Post("refill")
  async refill(
    @Req() req: any,
    @Body() body: { distributorId: string; amount: number; currency: string }
  ) {
    const treasuryWallet = await prisma.wallet.findFirst({
      where: { type: "TREASURY" },
    });

    const distributorWallet = await prisma.wallet.findFirst({
      where: { userId: body.distributorId, type: "DISTRIBUTOR" },
    });

    if (!treasuryWallet || !distributorWallet)
      throw new Error("Wallet missing");

    const refillRecord = await prisma.$transaction(async (db) => {
      await db.ledgerEntry.create({
        data: {
          walletId: treasuryWallet.id,
          amount: -body.amount,
          type: "float_refill",
        },
      });

      await db.ledgerEntry.create({
        data: {
          walletId: distributorWallet.id,
          amount: body.amount,
          type: "float_refill",
        },
      });

      return await db.floatRefillLog.create({
        data: {
          distributorId: body.distributorId,
          amount: body.amount,
          currency: body.currency,
          performedBy: req.user.sub,
        },
      });
    });

    // Audit logging for admin float refill
    await this.auditService.logFinancialAction({
      actorUserId: req.user.sub,
      eventType: "admin_float_refill",
      amount: body.amount,
      currency: body.currency,
      fromWalletId: treasuryWallet.id,
      toWalletId: distributorWallet.id,
      referenceId: refillRecord.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      meta: {
        distributorId: body.distributorId,
        performedBy: req.user.sub,
      },
    });

    return { ok: true };
  }
}