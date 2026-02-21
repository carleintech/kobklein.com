/**
 * Billing Controller — Plan subscription management for users.
 *
 * POST /v1/billing/checkout       — Create Stripe Checkout session for a plan
 * POST /v1/billing/portal         — Create Stripe Customer Portal session
 * GET  /v1/billing/plans          — List available plans for user's role
 * GET  /v1/billing/my-plan        — Get current active plan
 * GET  /v1/billing/my-features    — Get resolved features from active plan
 */
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";
import {
  createCheckoutSession,
  createPortalSession,
  getUserPlanFeatures,
} from "./plan-billing.service";

@Controller("v1/billing")
@UseGuards(SupabaseGuard)
export class BillingController {
  /**
   * POST /v1/billing/checkout
   * Creates a Stripe Checkout Session for the specified plan.
   */
  @Post("checkout")
  async checkout(
    @Req() req: any,
    @Body() body: {
      planSlug: string;
      successUrl?: string;
      cancelUrl?: string;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    if (!userId) throw new Error("Unauthorized");

    const baseUrl = process.env.WEB_APP_URL || "http://localhost:3003";
    const successUrl = body.successUrl || `${baseUrl}/settings/plan?success=true`;
    const cancelUrl = body.cancelUrl || `${baseUrl}/settings/plan?canceled=true`;

    const session = await createCheckoutSession(
      userId,
      body.planSlug,
      successUrl,
      cancelUrl,
    );

    return { ok: true, ...session };
  }

  /**
   * POST /v1/billing/portal
   * Creates a Stripe Customer Portal session for managing subscription.
   */
  @Post("portal")
  async portal(
    @Req() req: any,
    @Body() body: { returnUrl?: string },
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    if (!userId) throw new Error("Unauthorized");

    const baseUrl = process.env.WEB_APP_URL || "http://localhost:3003";
    const returnUrl = body.returnUrl || `${baseUrl}/settings/plan`;

    const result = await createPortalSession(userId, returnUrl);
    return { ok: true, ...result };
  }

  /**
   * GET /v1/billing/plans
   * List available plans for the user's role.
   */
  @Get("plans")
  async listPlans(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, preferredLang: true },
    });
    if (!user) throw new Error("User not found");

    const lang = user.preferredLang || "en";

    const plans = await prisma.platformPlan.findMany({
      where: { role: user.role, active: true },
      orderBy: { tier: "asc" },
    });

    // Resolve localized names
    const result = plans.map((p) => {
      const nameKey = `name${lang.charAt(0).toUpperCase()}${lang.slice(1)}` as keyof typeof p;
      const descKey = `desc${lang.charAt(0).toUpperCase()}${lang.slice(1)}` as keyof typeof p;

      return {
        slug: p.slug,
        tier: p.tier,
        priceUsd: p.priceUsd,
        interval: p.interval,
        name: (p[nameKey] as string) || p.nameEn,
        description: (p[descKey] as string) || p.descEn || "",
        features: p.features,
        stripePriceId: p.stripePriceId ? true : false, // boolean — don't expose actual ID
      };
    });

    return { plans: result };
  }

  /**
   * GET /v1/billing/my-plan
   * Get the user's current active plan.
   */
  @Get("my-plan")
  async myPlan(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;
    if (!userId) throw new Error("Unauthorized");

    const userPlan = await prisma.userPlan.findFirst({
      where: {
        userId,
        status: { in: ["active", "trialing"] },
        currentPeriodEnd: { gte: new Date() },
      },
      include: { plan: true },
      orderBy: { plan: { tier: "desc" } },
    });

    if (!userPlan) {
      return { plan: null, status: "free" };
    }

    return {
      plan: {
        slug: userPlan.plan.slug,
        tier: userPlan.plan.tier,
        name: userPlan.plan.nameEn,
        priceUsd: userPlan.plan.priceUsd,
        interval: userPlan.plan.interval,
        features: userPlan.plan.features,
      },
      status: userPlan.status,
      currentPeriodEnd: userPlan.currentPeriodEnd,
      canceledAt: userPlan.canceledAt,
    };
  }

  /**
   * GET /v1/billing/my-features
   * Get resolved features from the user's active plan.
   */
  @Get("my-features")
  async myFeatures(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;
    if (!userId) throw new Error("Unauthorized");

    const result = await getUserPlanFeatures(userId);
    if (!result) {
      return { tier: 0, features: {} };
    }

    return { tier: result.plan.tier, features: result.features };
  }
}
