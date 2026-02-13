/**
 * Admin Platform Plans Controller
 *
 * Manage platform subscription plans (Diaspora, Merchant, Distributor tiers).
 *
 * GET    /v1/admin/plans              — List all plans
 * POST   /v1/admin/plans              — Create a new plan
 * PATCH  /v1/admin/plans/:slug        — Update a plan
 * POST   /v1/admin/plans/seed         — Seed default plans (dev utility)
 * GET    /v1/admin/plans/subscribers   — List active plan subscribers
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { RolesGuard } from "../policies/roles.guard";
import { Roles } from "../policies/roles.decorator";
import { prisma } from "../db/prisma";

@Controller("v1/admin/plans")
@UseGuards(Auth0Guard, RolesGuard)
@Roles("admin")
export class AdminPlansController {
  /**
   * GET /v1/admin/plans — List all platform plans
   */
  @Get()
  async list() {
    const plans = await prisma.platformPlan.findMany({
      orderBy: [{ role: "asc" }, { tier: "asc" }],
      include: {
        _count: { select: { userPlans: true } },
      },
    });
    return { plans };
  }

  /**
   * POST /v1/admin/plans — Create a new plan
   */
  @Post()
  async create(@Body() body: any) {
    const plan = await prisma.platformPlan.create({
      data: {
        slug: body.slug,
        role: body.role,
        tier: body.tier ?? 1,
        priceUsd: body.priceUsd,
        interval: body.interval || "monthly",
        stripePriceId: body.stripePriceId || null,
        features: body.features || {},
        nameEn: body.nameEn,
        nameFr: body.nameFr || body.nameEn,
        nameHt: body.nameHt || body.nameEn,
        nameEs: body.nameEs || body.nameEn,
        descEn: body.descEn || null,
        descFr: body.descFr || null,
        descHt: body.descHt || null,
        descEs: body.descEs || null,
        active: body.active ?? true,
      },
    });

    return { ok: true, plan };
  }

  /**
   * PATCH /v1/admin/plans/:slug — Update a plan
   */
  @Patch(":slug")
  async update(@Param("slug") slug: string, @Body() body: any) {
    const plan = await prisma.platformPlan.update({
      where: { slug },
      data: {
        ...(body.priceUsd !== undefined && { priceUsd: body.priceUsd }),
        ...(body.tier !== undefined && { tier: body.tier }),
        ...(body.interval && { interval: body.interval }),
        ...(body.stripePriceId !== undefined && { stripePriceId: body.stripePriceId }),
        ...(body.features !== undefined && { features: body.features }),
        ...(body.nameEn && { nameEn: body.nameEn }),
        ...(body.nameFr && { nameFr: body.nameFr }),
        ...(body.nameHt && { nameHt: body.nameHt }),
        ...(body.nameEs && { nameEs: body.nameEs }),
        ...(body.descEn !== undefined && { descEn: body.descEn }),
        ...(body.descFr !== undefined && { descFr: body.descFr }),
        ...(body.descHt !== undefined && { descHt: body.descHt }),
        ...(body.descEs !== undefined && { descEs: body.descEs }),
        ...(body.active !== undefined && { active: body.active }),
      },
    });

    return { ok: true, plan };
  }

  /**
   * GET /v1/admin/plans/subscribers — List active subscribers
   */
  @Get("subscribers")
  async subscribers(@Query("role") role?: string, @Query("planSlug") planSlug?: string) {
    const where: any = {
      status: { in: ["active", "trialing"] },
    };
    if (planSlug) {
      const plan = await prisma.platformPlan.findUnique({ where: { slug: planSlug } });
      if (plan) where.planId = plan.id;
    }

    const subs = await prisma.userPlan.findMany({
      where,
      include: {
        plan: { select: { slug: true, nameEn: true, role: true, tier: true, priceUsd: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Fetch user info
    const userIds = subs.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, kId: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const result = subs.map((s) => ({
      ...s,
      user: userMap.get(s.userId) || null,
    }));

    // Filter by role if specified
    const filtered = role ? result.filter((r) => r.plan.role === role) : result;

    return { subscribers: filtered, total: filtered.length };
  }

  /**
   * POST /v1/admin/plans/seed — Seed default plans
   *
   * Idempotent — skips plans that already exist.
   * Stripe Price IDs must be added later via PATCH.
   */
  @Post("seed")
  async seed() {
    const defaultPlans = [
      // ── Diaspora Plans ──
      {
        slug: "diaspora_free",
        role: "diaspora",
        tier: 0,
        priceUsd: 0,
        nameEn: "Diaspora Free",
        nameFr: "Diaspora Gratuit",
        nameHt: "Diaspora Gratis",
        nameEs: "Diáspora Gratis",
        descEn: "Send money home with standard rates",
        features: { sendLimit: 500, fxMarkup: 2.0, kpayIncluded: false, familyLinks: 1 },
      },
      {
        slug: "diaspora_plus",
        role: "diaspora",
        tier: 1,
        priceUsd: 4.99,
        nameEn: "Diaspora Plus",
        nameFr: "Diaspora Plus",
        nameHt: "Diaspora Plus",
        nameEs: "Diáspora Plus",
        descEn: "Lower fees, K-Pay subscriptions, priority support",
        features: { sendLimit: 2000, fxMarkup: 1.0, kpayIncluded: true, familyLinks: 3 },
      },
      {
        slug: "diaspora_premium",
        role: "diaspora",
        tier: 2,
        priceUsd: 14.99,
        nameEn: "Diaspora Premium",
        nameFr: "Diaspora Premium",
        nameHt: "Diaspora Premium",
        nameEs: "Diáspora Premium",
        descEn: "Best FX rates, unlimited family links, virtual card",
        features: { sendLimit: 10000, fxMarkup: 0.5, kpayIncluded: true, familyLinks: 10, virtualCard: true },
      },

      // ── Merchant Plans ──
      {
        slug: "merchant_starter",
        role: "merchant",
        tier: 0,
        priceUsd: 0,
        nameEn: "Merchant Starter",
        nameFr: "Marchand Débutant",
        nameHt: "Machann Kòmanse",
        nameEs: "Comerciante Inicio",
        descEn: "Accept payments with standard fees",
        features: { feeDiscount: 0, posDevices: 1, reportAccess: "basic", settlementDays: 3 },
      },
      {
        slug: "merchant_growth",
        role: "merchant",
        tier: 1,
        priceUsd: 9.99,
        nameEn: "Merchant Growth",
        nameFr: "Marchand Croissance",
        nameHt: "Machann Kwasans",
        nameEs: "Comerciante Crecimiento",
        descEn: "Reduced fees, daily settlements, analytics",
        features: { feeDiscount: 25, posDevices: 3, reportAccess: "advanced", settlementDays: 1 },
      },
      {
        slug: "merchant_pro",
        role: "merchant",
        tier: 2,
        priceUsd: 29.99,
        nameEn: "Merchant Pro",
        nameFr: "Marchand Pro",
        nameHt: "Machann Pro",
        nameEs: "Comerciante Pro",
        descEn: "Lowest fees, real-time settlement, dedicated support",
        features: { feeDiscount: 50, posDevices: 10, reportAccess: "full", settlementDays: 0, dedicatedSupport: true },
      },

      // ── Distributor Plans ──
      {
        slug: "distributor_agent",
        role: "distributor",
        tier: 0,
        priceUsd: 0,
        nameEn: "Agent Basic",
        nameFr: "Agent Basique",
        nameHt: "Ajan Baz",
        nameEs: "Agente Básico",
        descEn: "Standard commission rates, basic float",
        features: { commissionBonus: 0, floatLimit: 50000, subAgents: 0 },
      },
      {
        slug: "distributor_pro",
        role: "distributor",
        tier: 1,
        priceUsd: 19.99,
        nameEn: "Agent Pro",
        nameFr: "Agent Pro",
        nameHt: "Ajan Pro",
        nameEs: "Agente Pro",
        descEn: "Higher commissions, larger float, sub-agent network",
        features: { commissionBonus: 15, floatLimit: 200000, subAgents: 5 },
      },
      {
        slug: "distributor_master",
        role: "distributor",
        tier: 2,
        priceUsd: 49.99,
        nameEn: "Master Agent",
        nameFr: "Agent Principal",
        nameHt: "Mèt Ajan",
        nameEs: "Agente Maestro",
        descEn: "Maximum commissions, unlimited float, full sub-agent management",
        features: { commissionBonus: 30, floatLimit: 1000000, subAgents: 50, dedicatedSupport: true },
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const p of defaultPlans) {
      const exists = await prisma.platformPlan.findUnique({ where: { slug: p.slug } });
      if (exists) {
        skipped++;
        continue;
      }

      await prisma.platformPlan.create({
        data: {
          slug: p.slug,
          role: p.role,
          tier: p.tier,
          priceUsd: p.priceUsd,
          nameEn: p.nameEn,
          nameFr: p.nameFr,
          nameHt: p.nameHt,
          nameEs: p.nameEs,
          descEn: p.descEn,
          features: p.features,
        },
      });
      created++;
    }

    return { ok: true, created, skipped, total: defaultPlans.length };
  }
}
