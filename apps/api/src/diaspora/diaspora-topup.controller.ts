import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { StripeService } from "../services/stripe.service";

@Controller("v1/diaspora")
export class DiasporaTopupController {
  constructor(private readonly stripeService: StripeService) {}

  /**
   * Create a Stripe PaymentIntent to fund diaspora USD wallet.
   *
   * The Stripe webhook (payment_intent.succeeded) already handles
   * crediting the wallet via postDeposit — we just pass walletId in metadata.
   */
  @UseGuards(SupabaseGuard)
  @Post("topup-intent")
  async createTopupIntent(
    @Req() req: any,
    @Body() body: { amount: number },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    if (!body.amount || body.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Ensure USD wallet exists (find or create)
    let usdWallet = await prisma.wallet.findFirst({
      where: { userId, currency: "USD", type: "USER" },
    });

    if (!usdWallet) {
      usdWallet = await prisma.wallet.create({
        data: {
          userId,
          currency: "USD",
          type: "USER",
        },
      });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await this.stripeService.client.paymentIntents.create(
      {
        amount: Math.round(body.amount * 100), // cents
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: {
          type: "diaspora_usd_topup",
          userId,
          walletId: usdWallet.id,
          currency: "USD",
        },
      },
    );

    return {
      clientSecret: paymentIntent.client_secret,
      walletId: usdWallet.id,
    };
  }
}
