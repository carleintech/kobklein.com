import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { computeWalletBalance } from "../wallets/balance.service";
import { generateUniqueWithdrawalCode } from "./withdrawal-code.service";
import { AuditService } from "../audit/audit.service";

@Controller("merchant")
export class MerchantWithdrawController {
  constructor(private auditService: AuditService) {}

  @UseGuards(Auth0Guard, FreezeGuard)
  @Post("withdraw")
  async withdraw(
    @Req() req: any,
    @Body() body: { amount: number; currency: string }
  ) {
    const userId = req.user.sub;

    const merchant = await prisma.merchant.findFirst({
      where: { userId },
    });
    if (!merchant) throw new Error("Merchant not found");

    const wallet = await prisma.wallet.findFirst({
      where: { userId, type: "MERCHANT" },
    });
    if (!wallet) throw new Error("Merchant wallet not found");

    const balance = await computeWalletBalance(wallet.id);

    if (balance.availableBalance < body.amount)
      throw new Error("Insufficient funds");

    const code = await generateUniqueWithdrawalCode(prisma);

    const record = await prisma.merchantWithdrawal.create({
      data: {
        merchantId: merchant.id,
        walletId: wallet.id,
        amount: body.amount,
        currency: body.currency,
        code,
      },
    });

    // Audit logging for merchant withdrawal
    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "merchant_withdrawal",
      amount: body.amount,
      currency: body.currency,
      fromWalletId: wallet.id,
      referenceId: record.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      meta: { withdrawalCode: code },
    });

    return { code: record.code };
  }
}