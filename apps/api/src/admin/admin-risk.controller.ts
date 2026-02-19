import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";
import { getUserRiskProfile } from "../risk/risk-engine.service";
import { AuditService } from "../audit/audit.service";

const VALID_FLAG_TYPES = [
  "high_risk",
  "watchlist",
  "velocity_abuse",
  "fraud_confirmed",
  "pep",
];

/**
 * Admin Risk Management
 *
 * View risk events, manage account flags, and review risk profiles.
 * Complements the existing RiskAdminController (fraud/risk.controller.ts)
 * which handles RiskFlags and signals.
 */
@Controller("v1/admin/risk")
export class AdminRiskController {
  constructor(private auditService: AuditService) {}

  /**
   * GET /v1/admin/risk/profile/:userId
   * Get full risk profile for a user.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("profile/:userId")
  async getRiskProfile(@Param("userId") userId: string) {
    const profile = await getUserRiskProfile(userId);
    return { ok: true, ...profile };
  }

  /**
   * GET /v1/admin/risk/events/recent
   * Get recent high-risk events across all users.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("events/recent")
  async recentRiskEvents() {
    const events = await prisma.riskEvent.findMany({
      where: { riskLevel: { in: ["medium", "high"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { ok: true, events };
  }

  /**
   * POST /v1/admin/risk/flags/add
   * Add an account flag to a user.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("flags/add")
  async addAccountFlag(
    @Body()
    body: {
      userId: string;
      flagType: string;
      reason?: string;
      severity?: number;
      adminUserId: string;
    },
  ) {
    if (!VALID_FLAG_TYPES.includes(body.flagType)) {
      throw new Error(
        `Invalid flag type. Must be one of: ${VALID_FLAG_TYPES.join(", ")}`,
      );
    }

    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true },
    });
    if (!user) throw new Error("User not found");

    // Check for duplicate active flag
    const existing = await prisma.accountFlag.findFirst({
      where: {
        userId: body.userId,
        flagType: body.flagType,
        resolvedAt: null,
      },
    });
    if (existing) throw new Error("User already has an active flag of this type");

    const flag = await prisma.accountFlag.create({
      data: {
        userId: body.userId,
        flagType: body.flagType,
        reason: body.reason,
        severity: body.severity || 2,
        addedBy: body.adminUserId,
      },
    });

    await this.auditService.logFinancialAction({
      actorUserId: body.adminUserId,
      eventType: "account_flag_added",
      meta: {
        targetUserId: body.userId,
        flagType: body.flagType,
        severity: body.severity || 2,
        reason: body.reason,
      },
    });

    return { ok: true, flag };
  }

  /**
   * POST /v1/admin/risk/flags/:id/resolve
   * Resolve (remove) an account flag.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("flags/:id/resolve")
  async resolveAccountFlag(
    @Param("id") id: string,
    @Body() body: { adminUserId: string; reason?: string },
  ) {
    const flag = await prisma.accountFlag.findUnique({ where: { id } });
    if (!flag) throw new Error("Account flag not found");
    if (flag.resolvedAt) throw new Error("Flag already resolved");

    await prisma.accountFlag.update({
      where: { id },
      data: {
        resolvedAt: new Date(),
        resolvedBy: body.adminUserId,
      },
    });

    await this.auditService.logFinancialAction({
      actorUserId: body.adminUserId,
      eventType: "account_flag_resolved",
      meta: {
        flagId: id,
        targetUserId: flag.userId,
        flagType: flag.flagType,
        resolveReason: body.reason,
      },
    });

    return { ok: true };
  }

  /**
   * GET /v1/admin/risk/flagged-users
   * List all users with active account flags.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("flagged-users")
  async flaggedUsers() {
    const flags = await prisma.accountFlag.findMany({
      where: { resolvedAt: null },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    // Batch-fetch user details
    const userIds = [...new Set(flags.map((f) => f.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        kId: true,
        firstName: true,
        lastName: true,
        phone: true,
        isFrozen: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      ok: true,
      flaggedUsers: flags.map((f) => ({
        ...f,
        user: userMap.get(f.userId) || null,
      })),
    };
  }
}
