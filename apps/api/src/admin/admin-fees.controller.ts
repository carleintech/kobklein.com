import {
  Body, Controller, Get, Param, Patch, Post,
  Req, UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";
import { seedFeeConfigs } from "../fees/fee-engine.service";

/**
 * Admin Fee Configuration API
 *
 * GET  /v1/admin/fees          — list all corridor fee configs
 * PATCH /v1/admin/fees/:id     — update a fee config (flat, percent, active)
 * POST /v1/admin/fees/seed     — seed default corridor configs (idempotent)
 */
@Controller("v1/admin/fees")
export class AdminFeesController {
  // ── List all ───────────────────────────────────────────────────
  @UseGuards(SupabaseGuard)
  @Get()
  async list() {
    const fees = await prisma.feeConfig.findMany({
      orderBy: [{ type: "asc" }, { currency: "asc" }],
    });
    return fees.map((f) => ({
      id: f.id,
      type: f.type,
      label: f.label ?? f.type,
      flat: Number(f.flat),
      percent: Number(f.percent),
      currency: f.currency,
      active: f.active,
      updatedAt: f.updatedAt,
    }));
  }

  // ── Update one ─────────────────────────────────────────────────
  @UseGuards(SupabaseGuard)
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Req() req: any,
    @Body()
    body: {
      flat?: number;
      percent?: number;
      active?: boolean;
      label?: string;
    },
  ) {
    const updated = await prisma.feeConfig.update({
      where: { id },
      data: {
        ...(body.flat    !== undefined && { flat:    body.flat }),
        ...(body.percent !== undefined && { percent: body.percent }),
        ...(body.active  !== undefined && { active:  body.active }),
        ...(body.label   !== undefined && { label:   body.label }),
      },
    });

    return {
      id: updated.id,
      type: updated.type,
      label: updated.label ?? updated.type,
      flat: Number(updated.flat),
      percent: Number(updated.percent),
      currency: updated.currency,
      active: updated.active,
      updatedAt: updated.updatedAt,
    };
  }

  // ── Seed defaults (idempotent) ─────────────────────────────────
  @UseGuards(SupabaseGuard)
  @Post("seed")
  async seed() {
    await seedFeeConfigs();
    const count = await prisma.feeConfig.count();
    return { ok: true, totalConfigs: count };
  }
}
