import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";
import { AuditService } from "../audit/audit.service";

const VALID_ROLES = ["user", "diaspora", "merchant", "distributor", "admin"];

/**
 * Admin User Management
 *
 * Allows admins to change user roles and view user details.
 */
@Controller("v1/admin/users")
export class AdminUsersController {
  constructor(private auditService: AuditService) {}

  /**
   * POST /v1/admin/users/set-role
   * Change a user's role (admin-only).
   */
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Post("set-role")
  async setRole(
    @Body() body: { userId: string; role: string },
  ) {
    if (!VALID_ROLES.includes(body.role)) {
      throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);
    }

    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    });
    if (!user) throw new Error("User not found");

    const previousRole = user.role;

    const updated = await prisma.user.update({
      where: { id: body.userId },
      data: { role: body.role },
      select: { id: true, role: true, kId: true, firstName: true, lastName: true, phone: true },
    });

    // Audit the role change
    await this.auditService.logFinancialAction({
      actorUserId: body.userId,
      eventType: "role_change",
      meta: { previousRole, newRole: body.role },
    });

    return { ok: true, user: updated };
  }

  /**
   * GET /v1/admin/users/search?q=KP-XXXXX
   * Search users by K-ID, phone, handle, or name.
   */
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get("search")
  async searchUsers(@Query("q") q?: string) {
    if (!q || q.length < 2) throw new Error("Query too short");

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { kId: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { handle: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
      select: {
        id: true,
        kId: true,
        phone: true,
        handle: true,
        firstName: true,
        lastName: true,
        role: true,
        kycTier: true,
        isFrozen: true,
        createdAt: true,
      },
    });

    return { ok: true, users };
  }
}
