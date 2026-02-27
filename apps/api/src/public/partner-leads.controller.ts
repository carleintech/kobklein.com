import { BadRequestException, Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";

const VALID_TYPES = ["partner", "investor", "enterprise", "distributor", "api"];

/**
 * Partner & Investor Lead Capture — public endpoint
 * POST /v1/public/partner-leads
 * GET  /v1/public/partner-leads (admin only)
 */
@Controller("v1/public/partner-leads")
export class PartnerLeadsController {
  /** Public: submit a partner / investor interest form */
  @Post()
  async submit(
    @Body()
    body: {
      name: string;
      email: string;
      company?: string;
      type?: string;
      message?: string;
    },
  ) {
    if (!body.name?.trim() || !body.email?.trim()) {
      throw new BadRequestException("name and email are required");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw new BadRequestException("Invalid email address");
    }

    const type = VALID_TYPES.includes(body.type ?? "") ? body.type! : "partner";

    const lead = await prisma.partnerLead.create({
      data: {
        name: body.name.trim().slice(0, 200),
        email: body.email.trim().toLowerCase().slice(0, 254),
        company: body.company?.trim().slice(0, 200),
        type,
        message: body.message?.trim().slice(0, 2000),
      },
      select: { id: true, createdAt: true },
    });

    return { ok: true, id: lead.id };
  }

  /** Admin: list all partner leads */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get()
  async list() {
    const leads = await prisma.partnerLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { ok: true, leads };
  }
}
