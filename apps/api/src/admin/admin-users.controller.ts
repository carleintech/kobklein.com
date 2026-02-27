import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { prisma } from "../db/prisma";
import { AuditService } from "../audit/audit.service";

const VALID_ROLES = ["client", "diaspora", "merchant", "distributor", "admin"];

/**
 * Admin User Management
 * POST   /v1/admin/users/set-role        — change role
 * POST   /v1/admin/users/freeze          — freeze / unfreeze
 * GET    /v1/admin/users/search          — search
 * GET    /v1/admin/users/:id/wallets     — list wallets + balances
 * DELETE /v1/admin/users/:id             — admin-side account deletion
 */
@Controller("v1/admin/users")
@UseGuards(SupabaseGuard, RolesGuard)
@Roles("admin")
export class AdminUsersController {
  constructor(private auditService: AuditService) {}

  /** POST /v1/admin/users/set-role */
  @Post("set-role")
  async setRole(
    @Req() req: any,
    @Body() body: { userId: string; role: string },
  ) {
    if (!VALID_ROLES.includes(body.role)) {
      throw new BadRequestException(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);
    }
    const user = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) throw new NotFoundException("User not found");

    const previousRole = user.role;
    const updated = await prisma.user.update({
      where: { id: body.userId },
      data: { role: body.role },
      select: { id: true, role: true, kId: true, firstName: true, lastName: true, phone: true },
    });

    await this.auditService.logFinancialAction({
      actorUserId: req.localUser?.id,
      eventType: "role_change",
      meta: { targetUserId: body.userId, previousRole, newRole: body.role },
    });

    return { ok: true, user: updated };
  }

  /** POST /v1/admin/users/freeze */
  @Post("freeze")
  async freeze(
    @Req() req: any,
    @Body() body: { userId: string; frozen: boolean; reason?: string },
  ) {
    const user = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) throw new NotFoundException("User not found");

    await prisma.user.update({
      where: { id: body.userId },
      data: {
        isFrozen: body.frozen,
        freezeReason: body.frozen ? (body.reason ?? "Admin action") : null,
      },
    });

    await this.auditService.logFinancialAction({
      actorUserId: req.localUser?.id,
      eventType: body.frozen ? "account_frozen" : "account_unfrozen",
      meta: { targetUserId: body.userId, reason: body.reason },
    });

    return { ok: true, frozen: body.frozen };
  }

  /**
   * GET /v1/admin/users/by-role?role=client&page=1
   *
   * Returns a paginated list of users filtered by role.
   * Valid roles: client, diaspora, merchant, distributor
   */
  @Get("by-role")
  async getUsersByRole(
    @Query("role") role?: string,
    @Query("page") page = "1",
  ) {
    const LISTABLE = ["client", "diaspora", "merchant", "distributor"];
    if (!role || !LISTABLE.includes(role)) {
      throw new BadRequestException(`role must be one of: ${LISTABLE.join(", ")}`);
    }

    const take = 50;
    const skip = (parseInt(page, 10) - 1) * take;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role },
        take,
        skip,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, kId: true, phone: true, handle: true,
          firstName: true, lastName: true, email: true,
          role: true, kycTier: true, isFrozen: true,
          onboardingComplete: true, createdAt: true,
        },
      }),
      prisma.user.count({ where: { role } }),
    ]);

    return { ok: true, users, total, page: parseInt(page, 10), pages: Math.ceil(total / take) };
  }

  /** GET /v1/admin/users/search?q= */
  @Get("search")
  async searchUsers(@Query("q") q?: string) {
    if (!q || q.length < 2) throw new BadRequestException("Query too short");

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { kId: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { handle: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
      select: {
        id: true, kId: true, phone: true, handle: true,
        firstName: true, lastName: true, email: true,
        role: true, kycTier: true, isFrozen: true, createdAt: true,
      },
    });

    return { ok: true, users };
  }

  /** GET /v1/admin/users/:id/wallets */
  @Get(":id/wallets")
  async getUserWallets(@Param("id") id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, kId: true, firstName: true, lastName: true, wallets: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const walletsWithBalance = await Promise.all(
      user.wallets.map(async (w) => {
        const agg = await prisma.ledgerEntry.aggregate({
          where: { walletId: w.id },
          _sum: { amount: true },
        });
        return { ...w, balance: Number(agg._sum.amount ?? 0) };
      }),
    );

    return { ok: true, user: { id: user.id, kId: user.kId, firstName: user.firstName, lastName: user.lastName }, wallets: walletsWithBalance };
  }

  /** DELETE /v1/admin/users/:id — admin-side soft delete */
  @Delete(":id")
  async deleteUser(@Req() req: any, @Param("id") id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    // Prevent self-deletion
    if (req.localUser?.id === id) {
      throw new BadRequestException("Cannot delete your own account");
    }

    const deletedEmail = `deleted_${id}@kobklein.deleted`;

    await prisma.user.update({
      where: { id },
      data: {
        email: deletedEmail,
        firstName: "Deleted",
        lastName: "User",
        phone: null,
        handle: null,
        isFrozen: true,
        freezeReason: "Account deleted by admin",
      },
    });

    await this.auditService.logFinancialAction({
      actorUserId: req.localUser?.id,
      eventType: "account_deleted_by_admin",
      meta: { targetUserId: id, originalEmail: user.email },
    });

    return { ok: true, message: "Account deleted" };
  }
}
