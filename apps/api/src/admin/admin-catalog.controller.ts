import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { RolesGuard } from "../policies/roles.guard";
import { Roles } from "../policies/roles.decorator";

/**
 * Admin K-Pay Catalog CRUD (Phase 49)
 *
 * Create/update SubscriptionCatalogItem and SubscriptionPlan records.
 * Multilingual fields: nameEn/Fr/Ht/Es, descEn/Fr/Ht/Es, labelEn/Fr/Ht/Es.
 */
@Controller("v1/admin/catalog")
export class AdminCatalogController {
  /**
   * GET /v1/admin/catalog
   * List all catalog items with plans (including inactive).
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get()
  async list() {
    const items = await prisma.subscriptionCatalogItem.findMany({
      include: { SubscriptionPlan: true },
      orderBy: { createdAt: "asc" },
    });

    return {
      ok: true,
      count: items.length,
      items: items.map((item) => ({
        ...item,
        plans: item.SubscriptionPlan.map((p) => ({
          ...p,
          amountUsd: Number(p.amountUsd),
        })),
      })),
    };
  }

  /**
   * POST /v1/admin/catalog/item
   * Create or update a catalog item (upsert by merchantKey).
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("item")
  async upsertItem(
    @Body()
    body: {
      merchantKey: string;
      category: string;
      nameEn: string;
      nameFr: string;
      nameHt: string;
      nameEs: string;
      descEn?: string;
      descFr?: string;
      descHt?: string;
      descEs?: string;
      active?: boolean;
    },
  ) {
    if (!body.merchantKey || !body.nameEn) {
      throw new Error("merchantKey and nameEn are required");
    }

    const item = await prisma.subscriptionCatalogItem.upsert({
      where: { merchantKey: body.merchantKey },
      create: {
        merchantKey: body.merchantKey,
        category: body.category || "other",
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
      update: {
        category: body.category,
        nameEn: body.nameEn,
        nameFr: body.nameFr || body.nameEn,
        nameHt: body.nameHt || body.nameEn,
        nameEs: body.nameEs || body.nameEn,
        descEn: body.descEn,
        descFr: body.descFr,
        descHt: body.descHt,
        descEs: body.descEs,
        active: body.active ?? true,
      },
    });

    return { ok: true, item };
  }

  /**
   * POST /v1/admin/catalog/plan
   * Create or update a subscription plan (upsert by planKey).
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("plan")
  async upsertPlan(
    @Body()
    body: {
      planKey: string;
      merchantKey: string;
      amountUsd: number;
      interval?: string;
      labelEn: string;
      labelFr: string;
      labelHt: string;
      labelEs: string;
      active?: boolean;
    },
  ) {
    if (!body.planKey || !body.merchantKey || !body.labelEn) {
      throw new Error("planKey, merchantKey, and labelEn are required");
    }

    // Resolve parent item
    const item = await prisma.subscriptionCatalogItem.findUnique({
      where: { merchantKey: body.merchantKey },
    });
    if (!item) throw new Error(`Catalog item not found for merchantKey: ${body.merchantKey}`);

    const plan = await prisma.subscriptionPlan.upsert({
      where: { planKey: body.planKey },
      create: {
        planKey: body.planKey,
        itemId: item.id,
        amountUsd: body.amountUsd,
        interval: body.interval || "monthly",
        labelEn: body.labelEn,
        labelFr: body.labelFr || body.labelEn,
        labelHt: body.labelHt || body.labelEn,
        labelEs: body.labelEs || body.labelEn,
        active: body.active ?? true,
      },
      update: {
        amountUsd: body.amountUsd,
        interval: body.interval || "monthly",
        labelEn: body.labelEn,
        labelFr: body.labelFr || body.labelEn,
        labelHt: body.labelHt || body.labelEn,
        labelEs: body.labelEs || body.labelEn,
        active: body.active ?? true,
      },
    });

    return {
      ok: true,
      plan: { ...plan, amountUsd: Number(plan.amountUsd) },
    };
  }

  /**
   * POST /v1/admin/catalog/item/:id/toggle
   * Toggle active status of a catalog item.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("item/:id/toggle")
  async toggleItem(@Param("id") id: string) {
    const item = await prisma.subscriptionCatalogItem.findUnique({
      where: { id },
    });
    if (!item) throw new Error("Catalog item not found");

    const updated = await prisma.subscriptionCatalogItem.update({
      where: { id },
      data: { active: !item.active },
    });

    return { ok: true, active: updated.active };
  }

  /**
   * POST /v1/admin/catalog/plan/:id/toggle
   * Toggle active status of a plan.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("plan/:id/toggle")
  async togglePlan(@Param("id") id: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) throw new Error("Plan not found");

    const updated = await prisma.subscriptionPlan.update({
      where: { id },
      data: { active: !plan.active },
    });

    return { ok: true, active: updated.active };
  }
}
