import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { computeWalletBalance, invalidateBalance } from "../wallets/balance.service";
import { calculateMerchantFee } from "../fees/fee.service";
import { createNotification } from "../notifications/notification.service";
import { verifyPosSignature } from "../utils/qr-signature";
import { AuditService } from "../audit/audit.service";

/**
 * POS Payment Controller
 *
 * Customer scans a merchant's QR code (containing a signed POS request)
 * and pays. Atomic double-entry ledger settlement with fee split.
 */
@Controller("v1/pay")
export class PayPosController {
  constructor(private auditService: AuditService) {}

  /**
   * POST /v1/pay/pos
   *
   * Body: { requestId, merchantId, amount, currency, signature }
   * (all fields come from the scanned QR code)
   */
  @UseGuards(Auth0Guard, FreezeGuard)
  @Post("pos")
  async payPosRequest(
    @Req() req: any,
    @Body()
    body: {
      requestId: string;
      merchantId: string;
      amount: number;
      currency: string;
      signature: string;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    // ── 1. Verify HMAC signature ───────────────────────────────
    const validSig = verifyPosSignature(
      {
        requestId: body.requestId,
        merchantId: body.merchantId,
        amount: String(body.amount),
        currency: body.currency,
      },
      body.signature,
    );

    if (!validSig) throw new Error("Invalid QR signature");

    // ── 2. Load and validate the POS request ───────────────────
    const posRequest = await prisma.merchantPosRequest.findUnique({
      where: { id: body.requestId },
      include: { merchant: true },
    });

    if (!posRequest) throw new Error("Payment request not found");
    if (posRequest.merchantId !== body.merchantId) throw new Error("Merchant mismatch");

    if (posRequest.status !== "pending") {
      throw new Error(`Request already ${posRequest.status}`);
    }

    if (new Date() > posRequest.expiresAt) {
      await prisma.merchantPosRequest.update({
        where: { id: posRequest.id },
        data: { status: "expired" },
      });
      throw new Error("Payment request has expired");
    }

    // Verify amount matches (prevent QR tampering on the client side)
    if (Number(posRequest.amount) !== body.amount) {
      throw new Error("Amount mismatch");
    }

    // Prevent merchant from paying their own request
    if (posRequest.merchant.userId === userId) {
      throw new Error("Cannot pay your own POS request");
    }

    // ── 3. Resolve wallets ─────────────────────────────────────
    const customerWallet = await prisma.wallet.findFirst({
      where: { userId, type: "USER", currency: body.currency },
    });

    if (!customerWallet) throw new Error("Wallet not found");

    const merchantWallet = await prisma.wallet.findFirst({
      where: { userId: posRequest.merchant.userId, type: "MERCHANT", currency: body.currency },
    });

    if (!merchantWallet) throw new Error("Merchant wallet not found");

    // ── 4. Check balance ───────────────────────────────────────
    const balance = await computeWalletBalance(customerWallet.id);

    if (balance.availableBalance < body.amount) {
      throw new Error("Insufficient funds");
    }

    // ── 5. Calculate fee (checks per-merchant profile first) ──
    const { fee, net } = await calculateMerchantFee(body.amount, posRequest.merchantId);

    // ── 6. Atomic ledger settlement ────────────────────────────
    const txRef = `pos_${posRequest.id}`;

    await prisma.$transaction(async (db) => {
      // Re-check POS request is still pending inside the transaction
      const fresh = await db.merchantPosRequest.findUnique({
        where: { id: posRequest.id },
      });
      if (!fresh || fresh.status !== "pending") {
        throw new Error("Request already processed");
      }

      // Debit customer wallet (full amount)
      await db.ledgerEntry.create({
        data: {
          walletId: customerWallet.id,
          amount: -body.amount,
          type: "merchant_payment",
          reference: txRef,
        },
      });

      // Credit merchant wallet (net after fee)
      await db.ledgerEntry.create({
        data: {
          walletId: merchantWallet.id,
          amount: net,
          type: "merchant_payment",
          reference: txRef,
        },
      });

      // Credit treasury (fee)
      if (fee > 0) {
        const treasuryWallet = await db.wallet.findFirst({
          where: { type: "TREASURY" },
        });

        if (treasuryWallet) {
          await db.ledgerEntry.create({
            data: {
              walletId: treasuryWallet.id,
              amount: fee,
              type: "merchant_fee",
              reference: txRef,
            },
          });
        }
      }

      // Mark POS request as paid
      await db.merchantPosRequest.update({
        where: { id: posRequest.id },
        data: {
          status: "paid",
          paidByUserId: userId,
          paidAt: new Date(),
          transferId: txRef,
        },
      });
    });

    // ── 7. Invalidate balance caches ───────────────────────────
    await invalidateBalance(customerWallet.id);
    await invalidateBalance(merchantWallet.id);

    // ── 8. Notifications ───────────────────────────────────────
    await createNotification(
      userId,
      "Payment Sent",
      `You paid ${body.amount} ${body.currency} to ${posRequest.merchant.businessName}`,
      "merchant",
    );

    await createNotification(
      posRequest.merchant.userId,
      "Payment Received",
      `You received ${net} ${body.currency} from a customer (fee: ${fee})`,
      "merchant",
    );

    // ── 9. Audit log ───────────────────────────────────────────
    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "pos_payment",
      amount: body.amount,
      currency: body.currency,
      fromWalletId: customerWallet.id,
      toWalletId: merchantWallet.id,
      referenceId: txRef,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      meta: {
        posRequestId: posRequest.id,
        merchantId: posRequest.merchantId,
        merchantName: posRequest.merchant.businessName,
        fee,
        net,
      },
    });

    // ── 10. Return receipt ─────────────────────────────────────
    return {
      ok: true,
      receipt: {
        requestId: posRequest.id,
        merchant: posRequest.merchant.businessName,
        amount: body.amount,
        currency: body.currency,
        fee,
        net,
        paidAt: new Date().toISOString(),
      },
    };
  }
}
