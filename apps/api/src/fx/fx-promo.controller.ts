/**
 * FX Promotion Controller — KobKlein API
 *
 * GET    /v1/fx/promos/check     — Check if a promo applies to a transfer (user-facing)
 * GET    /v1/admin/fx/promos     — List all promotions (admin)
 * POST   /v1/admin/fx/promos     — Create a promotion (admin)
 * PATCH  /v1/admin/fx/promos/:id — Deactivate a promotion (admin)
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import {
  findBestPromo,
  listPromotions,
  createPromotion,
  deactivatePromotion,
} from "./fx-promo.service";

// ─── User-Facing ─────────────────────────────────────────────────────

@Controller("v1/fx/promos")
export class FxPromoController {
  @Get("check")
  async check(
    @Req() req: any,
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("amount") amount: string,
    @Query("code") code?: string,
  ) {
    const userId = req.user?.sub;
    if (!userId) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);

    if (!from || !to || !amount) {
      throw new HttpException("from, to, amount are required", HttpStatus.BAD_REQUEST);
    }

    const promo = await findBestPromo({
      fromCurrency: from,
      toCurrency: to,
      amount: parseFloat(amount),
      promoCode: code,
      userId,
    });

    return { promo };
  }
}

// ─── Admin ───────────────────────────────────────────────────────────

@Controller("v1/admin/fx/promos")
export class AdminFxPromoController {
  @Get()
  async list(
    @Req() req: any,
    @Query("active") active?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    if (req.user?.role !== "admin") {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    return listPromotions({
      activeOnly: active === "true",
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    if (req.user?.role !== "admin") {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    if (!body.name || !body.fromCurrency || !body.toCurrency || !body.discountBps) {
      throw new HttpException(
        "name, fromCurrency, toCurrency, discountBps are required",
        HttpStatus.BAD_REQUEST,
      );
    }

    const promo = await createPromotion({
      name: body.name,
      fromCurrency: body.fromCurrency,
      toCurrency: body.toCurrency,
      discountBps: body.discountBps,
      bonusPct: body.bonusPct,
      minAmount: body.minAmount,
      maxAmount: body.maxAmount,
      code: body.code,
      corridor: body.corridor,
      maxUses: body.maxUses,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
    });

    return { ok: true, promo };
  }

  @Patch(":id/deactivate")
  async deactivate(@Req() req: any, @Param("id") id: string) {
    if (req.user?.role !== "admin") {
      throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    const promo = await deactivatePromotion(id);
    return { ok: true, promo };
  }
}
