import { Controller, Logger, Post, Req } from "@nestjs/common";
import { MoncashService } from "./moncash.service";
import { pool } from "../db/pool";
import { postDeposit } from "../wallets/deposit.service";

/**
 * MonCash webhook handler.
 * MonCash does NOT send a signature — we ALWAYS re-verify the payment
 * via their API before crediting any wallet.
 */
@Controller("v1/webhooks/moncash")
export class MoncashWebhookController {
  private readonly logger = new Logger(MoncashWebhookController.name);

  constructor(private readonly moncash: MoncashService) {}

  @Post()
  async handleWebhook(@Req() req: any) {
    // MonCash may send orderId as transactionId or orderId — try both
    const body = req.body ?? {};
    const orderId: string | undefined =
      body.orderId || body.transactionId || body.order_id || body.transaction_id;

    if (!orderId) {
      this.logger.warn("MonCash webhook: no orderId in payload", body);
      return { received: true }; // 200 to stop retries
    }

    const txnResult = await pool.query(
      `SELECT * FROM "LocalPaymentTxn" WHERE "orderId" = $1 AND provider = 'moncash' LIMIT 1`,
      [orderId],
    );
    const txn = txnResult.rows[0];

    if (!txn) {
      this.logger.warn(`MonCash webhook: unknown orderId=${orderId}`);
      return { received: true };
    }

    if (txn.status !== "pending") {
      // Already processed — idempotent
      return { received: true, deduped: true };
    }

    // Always re-verify via API — never trust webhook payload amounts
    const result = await this.moncash.verify(orderId);

    if (result.status === "confirmed") {
      const walletResult = await pool.query(
        `SELECT id FROM "Wallet" WHERE "userId" = $1 AND currency = $2 LIMIT 1`,
        [txn.userId, txn.currency],
      );
      const wallet = walletResult.rows[0];

      if (wallet) {
        const paidAmount = result.paidAmount ?? Number(txn.amount);
        await postDeposit({
          walletId: wallet.id,
          amount: paidAmount,
          currency: txn.currency,
          source: "moncash",
          reference: orderId,
          idempotencyKey: `moncash:${orderId}`,
        });
      }

      await pool.query(
        `UPDATE "LocalPaymentTxn" SET "status" = 'confirmed', "updatedAt" = now() WHERE id = $1`,
        [txn.id],
      );

      this.logger.log(`MonCash deposit confirmed: orderId=${orderId}, userId=${txn.userId}`);
    } else if (result.status === "failed") {
      await pool.query(
        `UPDATE "LocalPaymentTxn" SET "status" = 'failed', "updatedAt" = now() WHERE id = $1`,
        [txn.id],
      );
    }

    return { received: true };
  }
}
