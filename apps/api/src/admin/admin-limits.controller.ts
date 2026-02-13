import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";
import { getUserLimitStatus } from "../limits/role-limit.service";
import { AuditService } from "../audit/audit.service";

/**
 * Admin Limit Management
 *
 * View and configure role-based transaction limits.
 * Profiles are per role+currency. Usage is per user+currency.
 */
@Controller("v1/admin/limits")
export class AdminLimitsController {
  constructor(private auditService: AuditService) {}

  /**
   * GET /v1/admin/limits/profiles
   * List all role-based limit profiles.
   */
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get("profiles")
  async listProfiles() {
    const profiles = await prisma.roleLimitProfile.findMany({
      orderBy: [{ role: "asc" }, { currency: "asc" }],
    });

    return {
      ok: true,
      profiles: profiles.map((p) => ({
        ...p,
        dailyLimit: Number(p.dailyLimit),
        monthlyLimit: Number(p.monthlyLimit),
      })),
    };
  }

  /**
   * POST /v1/admin/limits/profiles/set
   * Create or update a role-based limit profile.
   */
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Post("profiles/set")
  async setProfile(
    @Body()
    body: {
      role: string;
      currency: string;
      dailyLimit: number;
      monthlyLimit: number;
      adminUserId: string;
    },
  ) {
    const profile = await prisma.roleLimitProfile.upsert({
      where: { role_currency: { role: body.role, currency: body.currency } },
      create: {
        role: body.role,
        currency: body.currency,
        dailyLimit: body.dailyLimit,
        monthlyLimit: body.monthlyLimit,
      },
      update: {
        dailyLimit: body.dailyLimit,
        monthlyLimit: body.monthlyLimit,
      },
    });

    await this.auditService.logFinancialAction({
      actorUserId: body.adminUserId,
      eventType: "limit_profile_updated",
      meta: {
        role: body.role,
        currency: body.currency,
        dailyLimit: body.dailyLimit,
        monthlyLimit: body.monthlyLimit,
      },
    });

    return {
      ok: true,
      profile: {
        ...profile,
        dailyLimit: Number(profile.dailyLimit),
        monthlyLimit: Number(profile.monthlyLimit),
      },
    };
  }

  /**
   * GET /v1/admin/limits/user/:userId
   * Get a specific user's current limit status.
   */
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get("user/:userId")
  async getUserLimits(@Param("userId") userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, kId: true, firstName: true },
    });

    if (!user) throw new Error("User not found");

    const limits = await getUserLimitStatus(userId, user.role);

    return { ok: true, user, limits };
  }
}
