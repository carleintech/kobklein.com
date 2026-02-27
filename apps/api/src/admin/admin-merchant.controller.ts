import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";
import { AuditService } from "../audit/audit.service";

/**
 * Admin Merchant Validation
 * GET  /v1/admin/merchants              — list all merchants
 * POST /v1/admin/merchants/:id/approve  — approve
 * POST /v1/admin/merchants/:id/suspend  — suspend
 */
@Controller("v1/admin/merchants")
@UseGuards(SupabaseGuard, RolesGuard)
@Roles("admin")
export class AdminMerchantController {
  constructor(private auditService: AuditService) {}

  @Get()
  async list() {
    // Query from User table — shows merchant-role users even if they haven't
    // completed the Merchant profile onboarding in the web app yet.
    const users = await prisma.user.findMany({
      where: { role: "merchant" },
      orderBy: { createdAt: "desc" },
      include: { merchant: true },
    });

    const merchants = users.map((u) => ({
      id: u.merchant?.id ?? `usr_${u.id}`,
      userId: u.id,
      businessName: u.merchant?.businessName ?? null,
      displayName: null,
      locationText: null,
      status: (u.merchant?.status ?? "pending") as
        | "active" | "suspended" | "pending" | "onboarding",
      businessType: u.merchant?.category ?? null,
      hasProfile: !!u.merchant,
      user: {
        id: u.id,
        phone: u.phone,
        firstName: u.firstName,
        lastName: u.lastName,
        kycTier: u.kycTier,
      },
      createdAt: (u.merchant?.createdAt ?? u.createdAt).toISOString(),
    }));

    return { ok: true, merchants };
  }

  @Post(":id/approve")
  async approve(@Req() req: any, @Param("id") id: string) {
    const merchant = await prisma.merchant.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundException("Merchant not found");

    await prisma.merchant.update({ where: { id }, data: { status: "active" } });

    await this.auditService.logFinancialAction({
      actorUserId: req.localUser?.id,
      eventType: "merchant_approved",
      meta: { merchantId: id, userId: merchant.userId },
    });

    return { ok: true };
  }

  @Post(":id/suspend")
  async suspend(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: { reason?: string },
  ) {
    const merchant = await prisma.merchant.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundException("Merchant not found");

    await prisma.merchant.update({ where: { id }, data: { status: "suspended" } });

    await this.auditService.logFinancialAction({
      actorUserId: req.localUser?.id,
      eventType: "merchant_suspended",
      meta: { merchantId: id, userId: merchant.userId, reason: body.reason },
    });

    return { ok: true };
  }
}
