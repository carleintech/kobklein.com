import { Controller, Headers, Post, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { StripeService } from "../services/stripe.service";
import { pool } from "../db/pool";
import { postDeposit } from "../wallets/deposit.service";
import { createChargebackCase } from "../cases/case.service";

@Controller("webhooks/stripe")
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}
  @Post()
  async stripeWebhook(@Req() req: any, @Headers("stripe-signature") sig?: string) {
    const secret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET missing");
    if (!sig) throw new Error("Missing stripe-signature header");

    let event: Stripe.Event;

    try {
      // raw body required
      event = this.stripeService.client.webhooks.constructEvent(req.rawBody, sig, secret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err?.message ?? "unknown"}`);
    }

    const eventId = event.id;
    const eventType = event.type;

    // Dedup webhook (idempotent)
    const existingResult = await pool.query(
      `SELECT 1 FROM "WebhookEvent" WHERE provider = $1 AND "eventId" = $2`,
      ["stripe", eventId],
    );
    if (existingResult.rows.length > 0) return { received: true, deduped: true };

    await pool.query(
      `INSERT INTO "WebhookEvent" ("id", "provider", "eventId", "type", "payload", "receivedAt", "status")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), 'received')`,
      ["stripe", eventId, eventType, JSON.stringify(event)],
    );

    // Handle success events -> create Deposit (ledger)
    if (eventType === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;

      const walletId = pi.metadata?.walletId;
      const currency = (pi.currency || "usd").toUpperCase();
      const amountMinor = pi.amount_received ?? pi.amount;
      const amount = amountMinor / 100;

      if (!walletId) {
        await pool.query(
          `UPDATE "WebhookEvent" SET status = 'processed', "processedAt" = now() WHERE provider = $1 AND "eventId" = $2`,
          ["stripe", eventId],
        );
        return { received: true, processed: true, note: "test event without walletId" };
      }

      // Create a deposit idempotently (use PI id)
      await postDeposit({
        walletId,
        amount,
        currency,
        source: "stripe",
        reference: pi.id,
        idempotencyKey: `stripe:${pi.id}`,
      });

      await pool.query(
        `UPDATE "WebhookEvent" SET status = 'processed', "processedAt" = now() WHERE provider = $1 AND "eventId" = $2`,
        ["stripe", eventId],
      );

      return { received: true, processed: true };
    }

    if (eventType === "payment_intent.payment_failed") {
      await pool.query(
        `UPDATE "WebhookEvent" SET status = 'processed', "processedAt" = now() WHERE provider = $1 AND "eventId" = $2`,
        ["stripe", eventId],
      );
      return { received: true, processed: true };
    }

    // Handle Stripe chargebacks — auto-create compliance case
    if (eventType === "charge.dispute.created") {
      const dispute = event.data.object as any;
      const chargeId = dispute.charge;
      const amount = (dispute.amount ?? 0) / 100;
      const currency = (dispute.currency ?? "usd").toUpperCase();
      const reason = dispute.reason ?? "unknown";

      // Try to find the related deposit via Stripe charge/PI
      const piId = dispute.payment_intent;
      let depositId: string | undefined;
      let userId: string | undefined;
      if (piId) {
        const depResult = await pool.query(
          `SELECT d.id, d."walletId" FROM "Deposit" d WHERE d."idempotencyKey" = $1`,
          [`stripe:${piId}`],
        );
        if (depResult.rows.length > 0) {
          depositId = depResult.rows[0].id;
          const walletResult = await pool.query(
            `SELECT "userId" FROM "Wallet" WHERE id = $1`,
            [depResult.rows[0].walletId],
          );
          userId = walletResult.rows[0]?.userId;
        }
      }

      await createChargebackCase({
        userId,
        depositId,
        stripeDisputeId: dispute.id ?? chargeId,
        amount,
        currency,
        reason,
      });

      await pool.query(
        `UPDATE "WebhookEvent" SET status = 'processed', "processedAt" = now() WHERE provider = $1 AND "eventId" = $2`,
        ["stripe", eventId],
      );
      return { received: true, processed: true, caseCreated: true };
    }

    // Unhandled events: mark processed so they don't pile up
    await pool.query(
      `UPDATE "WebhookEvent" SET status = 'processed', "processedAt" = now() WHERE provider = $1 AND "eventId" = $2`,
      ["stripe", eventId],
    );

    return { received: true, processed: true };
  }
}
