import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";
import { AuditService } from "../audit/audit.service";

const VALID_MODES = ["percent", "fixed", "hybrid", "none"];

/**
 * Admin Merchant Fee Management
 *
 * Configure per-merchant fee profiles (percent, fixed, hybrid, or none).
 * Falls back to global FeeConfig if no per-merchant profile exists.
 */
@Controller("v1/admin/merchant-fees")
export class AdminMerchantFeeController {
  constructor(private auditService: AuditService) {}

  /**
   * POST /v1/admin/merchant-fees/set
   * Create or update a merchant's fee profile.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("set")
  async setFee(
    @Body()
    body: {
      merchantId: string;
      mode: string;
      percentBps?: number;
      fixedFee?: number;
      currency?: string;
      adminUserId: string;
    },
  ) {
    if (!VALID_MODES.includes(body.mode)) {
      throw new Error(
        `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}`,
      );
    }

    // Verify merchant exists
    const Merchant = await prisma.merchant.findUnique({
      where: { id: body.merchantId },
      select: { id: true, businessName: true },
    });
    if (!Merchant) throw new Error("Merchant not found");

    const profile = await prisma.merchantFeeProfile.upsert({
      where: { merchantId: body.merchantId },
      create: {
        merchantId: body.merchantId,
        mode: body.mode,
        percentBps: body.percentBps ?? 75,
        fixedFee: body.fixedFee ?? 0,
        currency: body.currency ?? "HTG",
        active: true,
      },
      update: {
        mode: body.mode,
        percentBps: body.percentBps ?? 75,
        fixedFee: body.fixedFee ?? 0,
        currency: body.currency ?? "HTG",
        active: true,
      },
      include: {
        merchant: { select: { businessName: true, paymentCode: true } },
      },
    });

    await this.auditService.logFinancialAction({
      actorUserId: body.adminUserId,
      eventType: "merchant_fee_updated",
      meta: {
        merchantId: body.merchantId,
        merchantName: Merchant.businessName,
        mode: body.mode,
        percentBps: body.percentBps ?? 75,
        fixedFee: body.fixedFee ?? 0,
      },
    });

    return {
      ok: true,
      profile: {
        ...profile,
        fixedFee: Number(profile.fixedFee),
      },
    };
  }

  /**
   * GET /v1/admin/merchant-fees/:merchantId
   * Get a merchant's fee profile (or show global fallback).
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get(":merchantId")
  async getMerchantFee(@Param("merchantId") merchantId: string) {
    const profile = await prisma.merchantFeeProfile.findUnique({
      where: { merchantId },
    });

    if (profile) {
      return {
        ok: true,
        source: "per_merchant",
        profile: {
          ...profile,
          fixedFee: Number(profile.fixedFee),
        },
      };
    }

    // Show global fallback
    const globalConfig = await prisma.feeConfig.findFirst({
      where: { type: "merchant_payment", active: true },
    });

    return {
      ok: true,
      source: "global",
      profile: globalConfig
        ? {
            mode: "percent",
            percent: Number(globalConfig.percent),
            flat: Number(globalConfig.flat),
            currency: globalConfig.currency,
          }
        : null,
    };
  }

  /**
   * GET /v1/admin/merchant-fees?page=1
   * List all merchants with their fee profiles.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get()
  async listMerchantFees(@Query("limit") limit?: string) {
    const take = Math.min(parseInt(limit || "50", 10), 200);

    const profiles = await prisma.merchantFeeProfile.findMany({
      take,
      orderBy: { createdAt: "desc" },
      include: {
        merchant: { select: { businessName: true, paymentCode: true } },
      },
    });

    return {
      ok: true,
      count: profiles.length,
      profiles: profiles.map((p) => ({
        ...p,
        fixedFee: Number(p.fixedFee),
      })),
    };
  }
}
