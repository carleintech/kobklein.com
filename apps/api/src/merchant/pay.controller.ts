import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { computeWalletBalance } from "../wallets/balance.service";
import { calculateMerchantFee } from "../fees/fee.service";
import { createNotification } from "../notifications/notification.service";
import { AuditService } from "../audit/audit.service";

@Controller("merchant")
export class MerchantPayController {
  constructor(private auditService: AuditService) {}
  @UseGuards(SupabaseGuard, FreezeGuard)
  @Post("pay")
  async pay(
    @Req() req: any,
    @Body() body: { code?: string; merchantId?: string; amount: number; currency: string }
  ) {
    const userId = req.user.sub;

    let merchant;
    if (body.code) {
      merchant = await prisma.merchant.findUnique({
        where: { paymentCode: body.code },
      });
    } else if (body.merchantId) {
      merchant = await prisma.merchant.findUnique({
        where: { id: body.merchantId },
      });
    }

    if (!merchant) throw new Error("Merchant not found");

    const customerWallet = await prisma.wallet.findFirst({
      where: { userId, type: "USER" },
    });

    if (!customerWallet) throw new Error("Customer wallet not found");

    const merchantWallet = await prisma.wallet.findFirst({
      where: { userId: merchant.userId, type: "MERCHANT" },
    });

    if (!merchantWallet) throw new Error("Merchant wallet not found");

    const balance = await computeWalletBalance(customerWallet.id);

    if (balance.availableBalance < body.amount)
      throw new Error("Insufficient funds");

    // Check for new device + large payment = auto-freeze
    const isNewDevice = req.security?.isNewDevice;

    if (isNewDevice && body.amount >= 2000) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isFrozen: true,
          freezeReason: "High amount from new device",
          frozenAt: new Date(),
        },
      });

      await createNotification(
        userId,
        "Account Frozen",
        "We detected a high-risk payment from a new device. Your account has been temporarily frozen."
      );

      throw new Error("High-risk payment blocked. Account frozen.");
    }

    const { fee, net } = await calculateMerchantFee(body.amount, merchant.id);

    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.$transaction(async (db) => {
      await db.ledgerEntry.create({
        data: {
          walletId: customerWallet.id,
          amount: -body.amount,
          type: "merchant_payment",
        },
      });

      await db.ledgerEntry.create({
        data: {
          walletId: merchantWallet.id,
          amount: net,
          type: "merchant_payment",
        },
      });

      const treasuryWallet = await db.wallet.findFirst({
        where: { type: "TREASURY" },
      });

      if (!treasuryWallet) throw new Error("Treasury wallet not found");

      await db.ledgerEntry.create({
        data: {
          walletId: treasuryWallet.id,
          amount: fee,
          type: "merchant_fee",
        },
      });
    });

    // Create in-app notification
    await createNotification(
      customerWallet.userId,
      "Payment Sent",
      `You paid ${body.amount} HTG to ${merchant.businessName}`,
      "merchant"
    );

    // Audit log the merchant payment
    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "merchant_payment",
      amount: body.amount,
      currency: body.currency,
      fromWalletId: customerWallet.id,
      toWalletId: merchantWallet.id,
      referenceId: transactionId,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      meta: { fee, net, merchantId: merchant.id },
    });

    return {
      ok: true,
      receipt: {
        merchant: merchant.businessName,
        amount: body.amount,
        fee,
        net,
        transactionId,
        createdAt: new Date().toISOString(),
      },
    };
  }
}