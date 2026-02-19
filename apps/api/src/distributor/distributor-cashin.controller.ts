import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { withIdempotency } from "../idempotency/idempotency.service";
import { getIdempotencyKey } from "../idempotency/idempotency.util";
import { evaluateTransactionRisk } from "../risk/risk-engine.service";
import { AuditService } from "../audit/audit.service";

@Controller("v1/distributor")
export class DistributorCashInController {
  constructor(private auditService: AuditService) {}

  @UseGuards(SupabaseGuard)
  @Post("cash-in")
  async cashIn(
    @Req() req: any,
    @Body()
    body: {
      clientHandleOrUserId: string; // handle or userId
      amount: number;
      currency?: string; // default HTG
    }
  ) {
    const userId = req.user.sub;
    const currency = body.currency || "HTG";

    const idemKey = getIdempotencyKey(req, body);
    if (!idemKey) throw new Error("Missing Idempotency-Key");

    return withIdempotency({
      userId,
      route: "POST:/v1/distributor/cash-in",
      key: idemKey,
      body,
      run: async () => {
        // 1) Verify distributor active
        const dist = await prisma.distributor.findUnique({ where: { userId } });
        if (!dist || dist.status !== "active") throw new Error("Distributor not active");

        // 2) Verify distributor KYC level 2
        const distUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!distUser || distUser.kycTier < 2) throw new Error("Distributor must be verified (KYC level 2)");

        // 3) Resolve client by handle or userId
        const client =
          (await prisma.user.findUnique({ where: { id: body.clientHandleOrUserId } })) ||
          (await prisma.user.findUnique({ where: { handle: body.clientHandleOrUserId } }));

        if (!client) throw new Error("Client not found");

        // 4) Risk check (medium can require OTP later; for now we allow cash-in with low/medium)
        const risk = await evaluateTransactionRisk({
          userId,
          amount: body.amount,
          currency,
          recipientUserId: client.id,
        });

        if (risk.riskLevel === "high") throw new Error("High-risk cash-in blocked");

        // 5) Credit client wallet + record txn + commission
        const commissionRate = Number(dist.commissionIn || 0.01);
        const commission = Number(body.amount) * commissionRate;

        const result = await prisma.$transaction(async (tx) => {
          const clientWallet = await tx.wallet.findFirst({
            where: { userId: client.id, currency, type: "USER" },
          });

          if (!clientWallet) throw new Error("Client wallet not found");

          // Ledger credit to client wallet
          const ledger = await tx.ledgerEntry.create({
            data: {
              walletId: clientWallet.id,
              amount: body.amount,
              type: "cash_in",
              reference: `dist_cash_in:${dist.id}`,
            },
          });

          // Distributor txn
          const distTxn = await tx.distributorTxn.create({
            data: {
              distributorId: dist.id,
              type: "cash_in",
              status: "completed",
              clientUserId: client.id,
              clientWalletId: clientWallet.id,
              amount: body.amount,
              currency,
              commission,
              referenceId: ledger.id,
              meta: { riskLevel: risk.riskLevel, reasons: risk.reasons },
            },
          });

          // Commission record
          await tx.distributorCommission.create({
            data: {
              distributorId: dist.id,
              txnId: distTxn.id,
              amount: commission,
              currency,
              status: "earned",
            },
          });

          return { distTxnId: distTxn.id, ledgerId: ledger.id };
        });

        // 6) Audit log (IDs only)
        await this.auditService.logFinancialAction({
          actorUserId: userId,
          eventType: "distributor_cash_in",
          amount: body.amount,
          currency,
          referenceId: result.distTxnId,
          meta: {
            distributorId: dist.id,
            clientUserId: client.id,
            ledgerId: result.ledgerId,
          },
        });

        return { ok: true, ...result };
      },
    });
  }
}
