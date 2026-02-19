import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { StripeService } from "../services/stripe.service";
import { pool } from "../db/pool";

@Controller("v1")
export class PaymentsController {
  constructor(private readonly stripeService: StripeService) {}
  @UseGuards(SupabaseGuard)
  @Post("topup-intents")
  async createTopUp(@Req() req: any, @Body() body: any) {
    const walletId = String(body.walletId);
    const amount = Number(body.amount);
    const currency = String(body.currency || "usd").toLowerCase();

    if (!walletId) throw new Error("walletId required");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("amount must be positive");

    // Ensure wallet belongs to user
    const walletResult = await pool.query(`
      SELECT * FROM "Wallet" WHERE id = $1
    `, [walletId]);
    const wallet = walletResult.rows[0];
    if (!wallet || wallet.userId !== req.localUser.id) throw new Error("Invalid wallet");

    // Stripe uses smallest currency unit (cents)
    const amountMinor = Math.round(amount * 100);

    const pi = await this.stripeService.client.paymentIntents.create({
      amount: amountMinor,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        walletId,
        userId: req.localUser.id,
        currency: wallet.currency,
      },
    });

    return {
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
    };
  }
}
