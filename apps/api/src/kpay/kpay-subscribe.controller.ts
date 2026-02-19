import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { AuditService } from "../audit/audit.service";
import { prisma } from "../db/prisma";
import { createSubscription } from "../subscriptions/subscription.service";

@Controller("v1/kpay")
export class KpaySubscribeController {
  constructor(private auditService: AuditService) {}

  /**
   * Subscribe to a plan from the K-Pay catalog.
   *
   * The price comes from the plan — users never type amounts.
   * This prevents fraud + mistakes.
   *
   * POST /v1/kpay/subscribe
   * Body: { planKey: "NETFLIX_STANDARD", externalAccountRef?: "user@email.com" }
   */
  @UseGuards(SupabaseGuard, FreezeGuard)
  @Post("subscribe")
  async subscribe(
    @Req() req: any,
    @Body()
    body: {
      planKey: string;
      externalAccountRef?: string;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    if (!body.planKey) throw new Error("planKey is required");

    // Look up the plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { planKey: body.planKey },
    });

    if (!plan || !plan.active) throw new Error("Plan not found or inactive");

    // Look up the catalog item (merchant)
    const item = await prisma.subscriptionCatalogItem.findUnique({
      where: { id: plan.itemId },
    });

    if (!item || !item.active) throw new Error("Catalog item not found or inactive");

    // Create subscription using existing engine
    const result = await createSubscription({
      userId,
      merchant: item.merchantKey,
      amountUsd: Number(plan.amountUsd),
      externalAccountRef: body.externalAccountRef,
    });

    // Store planKey in subscription meta for dashboard label resolution
    await prisma.subscriptionProxy.update({
      where: { id: result.subscription.id },
      data: {
        meta: { planKey: plan.planKey },
      },
    });

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "kpay_subscription_created",
      amount: Number(plan.amountUsd),
      currency: "USD",
      referenceId: result.subscription.id,
      meta: {
        merchant: item.merchantKey,
        planKey: plan.planKey,
      },
    });

    return {
      ok: true,
      subscriptionId: result.subscription.id,
      merchant: item.merchantKey,
      planKey: plan.planKey,
      amountUsd: Number(plan.amountUsd),
      interval: plan.interval,
    };
  }
}
