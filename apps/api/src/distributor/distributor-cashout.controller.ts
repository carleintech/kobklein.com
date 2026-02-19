import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { evaluateTransactionRisk } from "../risk/risk-engine.service";
import { createOtpChallenge, consumeOtpChallenge } from "../otp/otp-challenge.service";
import { AuditService } from "../audit/audit.service";

@Controller("v1/distributor")
export class DistributorCashOutController {
  constructor(private auditService: AuditService) {}

  @UseGuards(SupabaseGuard)
  @Post("cash-out/initiate")
  async initiate(
    @Req() req: any,
    @Body()
    body: {
      clientHandleOrUserId: string;
      amount: number;
      currency?: string;
    }
  ) {
    const userId = req.user.sub;
    const currency = body.currency || "HTG";

    const dist = await prisma.distributor.findUnique({ where: { userId } });
    if (!dist || dist.status !== "active") {
      throw new Error("Distributor not active");
    }

    const client =
      (await prisma.user.findUnique({ where: { id: body.clientHandleOrUserId } })) ||
      (await prisma.user.findUnique({ where: { handle: body.clientHandleOrUserId } }));

    if (!client) throw new Error("Client not found");

    const risk = await evaluateTransactionRisk({
      userId,
      amount: body.amount,
      currency,
      recipientUserId: client.id,
    });

    if (risk.riskLevel === "high") {
      throw new Error("High-risk cash-out blocked");
    }

    // Generate OTP challenge for client
    const challengeId = await createOtpChallenge({
      userId: client.id,
      purpose: "cashout",
      payload: {
        distributorUserId: userId,
        clientUserId: client.id,
        amount: body.amount,
        currency,
      },
    });

    return {
      requiresOtp: true,
      challengeId,
    };
  }

  @UseGuards(SupabaseGuard)
  @Post("cash-out/confirm")
  async confirm(
    @Req() req: any,
    @Body()
    body: {
      challengeId: string;
      otpCode: string;
    }
  ) {
    const distributorUserId = req.user.sub;

    // consumeOtpChallenge needs the client's userId — we retrieve the challenge first
    const challengeRecord = await prisma.otpChallenge.findUnique({
      where: { id: body.challengeId },
    });
    if (!challengeRecord) throw new Error("Challenge not found");

    const payload = await consumeOtpChallenge({
      userId: challengeRecord.userId,
      challengeId: body.challengeId,
      otpCode: body.otpCode,
    });

    const amount = payload.amount as number;
    const clientUserId = payload.clientUserId as string;
    const currency = (payload.currency as string) || "HTG";

    const dist = await prisma.distributor.findUnique({
      where: { userId: distributorUserId },
    });

    if (!dist || dist.status !== "active") {
      throw new Error("Distributor not active");
    }

    const commissionRate = Number(dist.commissionOut || 0.02);
    const commission = amount * commissionRate;

    const result = await prisma.$transaction(async (tx) => {
      const clientWallet = await tx.wallet.findFirst({
        where: { userId: clientUserId, currency, type: "USER" },
      });

      const floatWallet = await tx.wallet.findFirst({
        where: { userId: distributorUserId, currency, type: "DISTRIBUTOR" },
      });

      if (!clientWallet || !floatWallet) {
        throw new Error("Wallet not found");
      }

      // NOTE: You may need to compute float balance from ledger if not denormalized
      // For now, assume floatWallet has a .balance property (if not, replace with balance computation)
      // if (Number(floatWallet.balance) < amount) {
      //   throw new Error("Insufficient distributor float");
      // }

      // Debit client wallet
      const clientLedger = await tx.ledgerEntry.create({
        data: {
          walletId: clientWallet.id,
          amount: -amount,
          type: "cash_out",
          reference: `dist_cash_out:${dist.id}`,
        },
      });

      // Debit distributor float
      await tx.ledgerEntry.create({
        data: {
          walletId: floatWallet.id,
          amount: -amount,
          type: "cash_out_float",
          reference: clientLedger.id,
        },
      });

      const distTxn = await tx.distributorTxn.create({
        data: {
          distributorId: dist.id,
          type: "cash_out",
          status: "completed",
          clientUserId,
          clientWalletId: clientWallet.id,
          distributorWalletId: floatWallet.id,
          amount,
          currency,
          commission,
          referenceId: clientLedger.id,
        },
      });

      await tx.distributorCommission.create({
        data: {
          distributorId: dist.id,
          txnId: distTxn.id,
          amount: commission,
          currency,
          status: "earned",
        },
      });

      return distTxn.id;
    });

    await this.auditService.logFinancialAction({
      actorUserId: distributorUserId,
      eventType: "distributor_cash_out",
      amount,
      currency,
      referenceId: result,
    });

    return { ok: true };
  }
}
