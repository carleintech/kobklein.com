/**
 * Affiliate Promo Controller — KobKlein API
 *
 * Allows users to create affiliate promo codes that they share.
 * When someone uses their code, the affiliate earns a % commission
 * deposited to their KobKlein wallet.
 *
 * Routes:
 *   POST   /v1/affiliate/promo          — Create affiliate promo code (any active user)
 *   GET    /v1/affiliate/promo/my       — My promo codes + stats
 *   GET    /v1/affiliate/promo/earnings — My affiliate earnings
 *   POST   /v1/affiliate/promo/apply    — Apply a promo code to a transfer
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";
import * as crypto from "crypto";

function generateAffiliateCode(handle: string): string {
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  const base = (handle || "KK").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return `${base}${suffix}`;
}

@Controller("v1/affiliate")
@UseGuards(SupabaseGuard)
export class AffiliatePromoController {
  /**
   * POST /v1/affiliate/promo
   * Create a personal affiliate promo code. Anyone can become an affiliate.
   * Affiliate earns 0.5% of each transfer made using their code.
   */
  @Post("promo")
  async createPromo(
    @Req() req: any,
    @Body()
    body: {
      label?: string;       // e.g. "Share with my family"
      bonusPct?: number;    // extra % bonus for recipient (default 0)
      maxUses?: number;     // cap (default 500)
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { handle: true, onboardingComplete: true, isFrozen: true },
    });

    if (!user?.onboardingComplete) {
      throw new HttpException("Complete onboarding first", HttpStatus.FORBIDDEN);
    }
    if (user.isFrozen) {
      throw new HttpException("Account frozen", HttpStatus.FORBIDDEN);
    }

    // Limit: max 3 active affiliate codes per user
    const existingCount = await prisma.fxPromotion.count({
      where: { affiliateUserId: userId, active: true } as any,
    });
    if (existingCount >= 3) {
      throw new HttpException(
        "Maximum 3 active affiliate codes allowed",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Generate unique code
    let code = generateAffiliateCode(user.handle || "KK");
    let attempts = 0;
    while (await prisma.fxPromotion.findUnique({ where: { code } })) {
      code = generateAffiliateCode(user.handle || "KK");
      if (++attempts > 10) throw new HttpException("Could not generate unique code", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const promo = await prisma.fxPromotion.create({
      data: {
        name: body.label || `${user.handle || "KobKlein"} Referral`,
        fromCurrency: "USD",
        toCurrency: "HTG",
        discountBps: 100,               // 1% discount for the person who uses the code
        bonusPct: body.bonusPct ?? 0,
        minAmount: 10,
        code,
        maxUses: body.maxUses ?? 500,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        active: true,
        affiliateUserId: userId,
        affiliatePct: 0.005,            // 0.5% commission to affiliate per use
        affiliateLabel: body.label ?? null,
      } as any,
    });

    return {
      ok: true,
      code: promo.code,
      discountForUser: "1% discount on FX",
      yourCommission: "0.5% per transfer using your code",
      maxUses: promo.maxUses,
      expiresAt: promo.endsAt,
      shareText: `Use my KobKlein promo code **${promo.code}** to get 1% discount on your next money transfer to Haiti! Download KobKlein: https://kobklein.com`,
    };
  }

  /**
   * GET /v1/affiliate/promo/my
   * List the authenticated user's affiliate codes and their usage.
   */
  @Get("promo/my")
  async myPromos(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const promos = await prisma.fxPromotion.findMany({
      where: { affiliateUserId: userId } as any,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { redemptions: true } },
      },
    });

    return (promos as any[]).map((p) => ({
      id: p.id,
      code: p.code,
      label: p.affiliateLabel,
      active: p.active,
      usedCount: p.usedCount,
      maxUses: p.maxUses,
      redemptions: p._count.redemptions,
      discountBps: p.discountBps,
      affiliatePct: Number(p.affiliatePct ?? 0),
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      createdAt: p.createdAt,
    }));
  }

  /**
   * GET /v1/affiliate/promo/earnings
   * Total commissions earned by this affiliate.
   */
  @Get("promo/earnings")
  async earnings(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const redemptions = await (prisma.fxPromoRedemption.findMany as any)({
      where: { affiliateUserId: userId },
      select: {
        savedAmount: true,
        affiliatePaid: true,
        createdAt: true,
        promotionId: true,
      },
      orderBy: { createdAt: "desc" },
    }) as Array<{ savedAmount: any; affiliatePaid: boolean; createdAt: Date; promotionId: string }>;

    const totalEarned = redemptions.reduce(
      (sum, r) => sum + Number(r.savedAmount) * 0.005,
      0,
    );
    const pendingPayout = redemptions
      .filter((r) => !r.affiliatePaid)
      .reduce((sum, r) => sum + Number(r.savedAmount) * 0.005, 0);

    return {
      totalRedemptions: redemptions.length,
      totalEarned: Math.round(totalEarned * 100) / 100,
      pendingPayout: Math.round(pendingPayout * 100) / 100,
      currency: "USD",
      recent: redemptions.slice(0, 20).map((r) => ({
        date: r.createdAt,
        earned: Math.round(Number(r.savedAmount) * 0.005 * 100) / 100,
        paid: r.affiliatePaid,
      })),
    };
  }
}
