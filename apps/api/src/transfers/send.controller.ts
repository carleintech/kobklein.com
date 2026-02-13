import { Body, Controller, Post, UseGuards, Req } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { computeWalletBalance } from "../wallets/balance.service";
import { checkDailyTransferLimit } from "../limits/transfer-limit.service";
import { createNotification } from "../notifications/notification.service";
import { AuditService } from "../audit/audit.service";

@Controller("transfers")
export class SendMoneyController {
  constructor(private auditService: AuditService) {}
  @UseGuards(Auth0Guard, FreezeGuard)
  @Post("send")
  async send(
    @Req() req: any,
    @Body() body: { phone: string; amount: number; currency: string }
  ) {
    const senderId = req.user.sub;
    const idempotencyKey = req.headers["idempotency-key"];
    if (!idempotencyKey) throw new Error("Missing Idempotency-Key");

    const senderUser = await prisma.user.findUnique({
      where: { auth0Id: senderId },
    });

    const senderWallet = await prisma.wallet.findFirst({
      where: { userId: senderUser?.id, type: "USER" },
    });

    if (!senderWallet) throw new Error("Sender wallet not found");

    const recipientUser = await prisma.user.findFirst({
      where: { phone: body.phone },
    });

    if (!recipientUser) throw new Error("Recipient not found");

    const recipientWallet = await prisma.wallet.findFirst({
      where: { userId: recipientUser.id, type: "USER" },
    });

    if (!recipientWallet) throw new Error("Recipient wallet missing");

    const balance = await computeWalletBalance(senderWallet.id);

    if (balance.availableBalance < body.amount)
      throw new Error("Insufficient funds");

    await checkDailyTransferLimit({
      userId: senderUser!.id,
      amount: body.amount,
    });

    // Check for new device + large transfer = auto-freeze
    const isNewDevice = req.security?.isNewDevice;

    if (isNewDevice && body.amount >= 2000) {
      await prisma.user.update({
        where: { id: senderUser!.id },
        data: {
          isFrozen: true,
          freezeReason: "High amount from new device",
          frozenAt: new Date(),
        },
      });

      await createNotification(
        senderUser!.id,
        "Account Frozen",
        "We detected a high-risk transfer from a new device. Your account has been temporarily frozen."
      );

      throw new Error("High-risk transfer blocked. Account frozen.");
    }

    if (body.amount > 1000) {
      return { requiresOtp: true };
    }

    const tx = await prisma.$transaction(async (db) => {
      const transfer = await db.transfer.create({
        data: {
          fromWalletId: senderWallet.id,
          toWalletId: recipientWallet.id,
          senderUserId: senderUser!.id,
          amount: body.amount,
          currency: body.currency,
          status: "completed",
          idempotencyKey: String(idempotencyKey),
        },
      });

      await db.ledgerEntry.create({
        data: {
          walletId: senderWallet.id,
          amount: -body.amount,
          type: "transfer_out",
          transferId: transfer.id,
        },
      });

      await db.ledgerEntry.create({
        data: {
          walletId: recipientWallet.id,
          amount: body.amount,
          type: "transfer_in",
          transferId: transfer.id,
        },
      });

      return transfer;
    });

    await prisma.transferContact.upsert({
      where: {
        userId_contactUserId: {
          userId: senderUser!.id,
          contactUserId: recipientUser.id,
        },
      },
      update: {},
      create: {
        userId: senderUser!.id,
        contactUserId: recipientUser.id,
      },
    });

    // Create notifications
    await createNotification(
      senderUser!.id,
      "Money Sent",
      `You sent ${body.amount} HTG to ${recipientUser.firstName || recipientUser.phone}`,
      "transfer"
    );

    await createNotification(
      recipientUser.id,
      "Money Received",
      `You received ${body.amount} HTG from ${senderUser!.firstName || "someone"}`,
      "transfer"
    );

    // Audit log the transfer
    await this.auditService.logFinancialAction({
      actorUserId: senderId,
      eventType: "transfer_sent",
      amount: body.amount,
      currency: body.currency,
      fromWalletId: senderWallet.id,
      toWalletId: recipientWallet.id,
      referenceId: tx.id,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    return { ok: true, transferId: tx.id };
  }
}
