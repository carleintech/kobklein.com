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
import { enqueueNotification } from "../notifications/notification.queue.js";

const VALID_ROLES = ["client", "diaspora", "merchant", "distributor", "admin"];
const VALID_CHANNELS = ["push", "email", "sms"];

/**
 * Admin User Management
 * GET    /v1/admin/users/stats          — platform user-count stats
 * GET    /v1/admin/users/list           — paginated all-users with filters
 * POST   /v1/admin/users/set-role      — change role
 * POST   /v1/admin/users/freeze        — freeze / unfreeze
 * GET    /v1/admin/users/search        — search
 * GET    /v1/admin/users/by-role       — list by role (legacy)
 * GET    /v1/admin/users/:id/wallets   — list wallets + balances
 * POST   /v1/admin/users/:id/notify    — direct message to one user
 * DELETE /v1/admin/users/:id           — admin-side account deletion
 */
@Controller("v1/admin/users")
@UseGuards(SupabaseGuard, RolesGuard)
@Roles("admin")
export class AdminUsersController {
  constructor(private auditService: AuditService) {}

  // ── Stats ──────────────────────────────────────────────────────────────────

  /** GET /v1/admin/users/stats — platform-level user counts */
  @Get("stats")
  async getStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [total, frozen, pendingKyc, newToday, byRole] = await Promise.all([
      prisma.user.count({
        where: { email: { not: { endsWith: "@kobklein.deleted" } } },
      }),
      prisma.user.count({
        where: {
          isFrozen: true,
          email: { not: { endsWith: "@kobklein.deleted" } },
        },
      }),
      prisma.user.count({ where: { kycStatus: "pending" } }),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
    ]);

    return {
      total,
      active: total - frozen,
      frozen,
      pendingKyc,
      newToday,
      byRole: byRole.reduce(
        (acc, r) => ({ ...acc, [r.role]: r._count.id }),
        {} as Record<string, number>,
      ),
    };
  }

  // ── Unified list (all roles, all filters) ──────────────────────────────────

  /**
   * GET /v1/admin/users/list
   * Query params:
   *   role=all|client|diaspora|merchant|distributor|admin
   *   status=all|active|frozen
   *   kycTier=all|0|1|2|3|pending
   *   q=<search string>
   *   page=1
   *   limit=25  (max 100)
   *   sort=newest|oldest|name
   */
  @Get("list")
  async listUsers(
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("kycTier") kycTier?: string,
    @Query("q") q?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "25",
    @Query("sort") sort = "newest",
  ) {
    const take = Math.min(parseInt(limit, 10) || 25, 100);
    const skip = (parseInt(page, 10) - 1) * take;

    // Build Prisma where clause
    const where: Record<string, any> = {
      email: { not: { endsWith: "@kobklein.deleted" } },
    };

    if (role && role !== "all" && VALID_ROLES.includes(role)) {
      where.role = role;
    }
    if (status === "frozen") where.isFrozen = true;
    if (status === "active") where.isFrozen = false;
    if (kycTier === "pending") {
      where.kycStatus = "pending";
    } else if (kycTier && kycTier !== "all") {
      where.kycTier = parseInt(kycTier, 10);
    }

    if (q && q.length >= 2) {
      where.OR = [
        { kId: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { handle: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sort === "oldest"
        ? { createdAt: "asc" as const }
        : sort === "name"
          ? { firstName: "asc" as const }
          : { createdAt: "desc" as const };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take,
        skip,
        orderBy,
        select: {
          id: true,
          kId: true,
          phone: true,
          handle: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          kycTier: true,
          kycStatus: true,
          isFrozen: true,
          freezeReason: true,
          createdAt: true,
          profilePhotoUrl: true,
          country: true,
          onboardingComplete: true,
          _count: { select: { deviceSessions: true, amlFlags: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      ok: true,
      users: users.map((u) => ({
        ...u,
        deviceCount: u._count.deviceSessions,
        flagCount: u._count.amlFlags,
        _count: undefined,
      })),
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / take),
      limit: take,
    };
  }

  // ── Role & Freeze ──────────────────────────────────────────────────────────

  /** POST /v1/admin/users/set-role */
  @Post("set-role")
  async setRole(
    @Req() req: any,
    @Body() body: { userId: string; role: string },
  ) {
    if (!VALID_ROLES.includes(body.role)) {
      throw new BadRequestException(
        `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
      );
    }
    const user = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) throw new NotFoundException("User not found");

    const previousRole = user.role;
    const updated = await prisma.user.update({
      where: { id: body.userId },
      data: { role: body.role },
      select: {
        id: true,
        role: true,
        kId: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
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

  // ── Search (legacy) ────────────────────────────────────────────────────────

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
        id: true,
        kId: true,
        phone: true,
        handle: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        kycTier: true,
        kycStatus: true,
        isFrozen: true,
        freezeReason: true,
        createdAt: true,
        profilePhotoUrl: true,
        country: true,
        onboardingComplete: true,
      },
    });

    return { ok: true, users };
  }

  // ── By-role (legacy) ───────────────────────────────────────────────────────

  /**
   * GET /v1/admin/users/by-role?role=client&page=1
   * Legacy endpoint — use /list for new code
   */
  @Get("by-role")
  async getUsersByRole(
    @Query("role") role?: string,
    @Query("page") page = "1",
  ) {
    const LISTABLE = ["client", "diaspora", "merchant", "distributor"];
    if (!role || !LISTABLE.includes(role)) {
      throw new BadRequestException(
        `role must be one of: ${LISTABLE.join(", ")}`,
      );
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
          id: true,
          kId: true,
          phone: true,
          handle: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          kycTier: true,
          isFrozen: true,
          onboardingComplete: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: { role } }),
    ]);

    return {
      ok: true,
      users,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / take),
    };
  }

  // ── Wallets ────────────────────────────────────────────────────────────────

  /** GET /v1/admin/users/:id/wallets */
  @Get(":id/wallets")
  async getUserWallets(@Param("id") id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        kId: true,
        firstName: true,
        lastName: true,
        wallets: true,
      },
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

    return {
      ok: true,
      user: {
        id: user.id,
        kId: user.kId,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      wallets: walletsWithBalance,
    };
  }

  // ── Direct message ─────────────────────────────────────────────────────────

  /**
   * POST /v1/admin/users/:id/notify
   * Send a direct push/email/SMS message to a single user.
   */
  @Post(":id/notify")
  async notifyUser(
    @Req() req: any,
    @Param("id") id: string,
    @Body()
    body: {
      subject: string;
      message: string;
      channel: "push" | "email" | "sms";
    },
  ) {
    const { subject, message, channel } = body;

    if (!subject || !message || !channel) {
      throw new BadRequestException(
        "subject, message and channel are required",
      );
    }
    if (!VALID_CHANNELS.includes(channel)) {
      throw new BadRequestException(
        `channel must be one of: ${VALID_CHANNELS.join(", ")}`,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, phone: true },
    });
    if (!user) throw new NotFoundException("User not found");

    const to =
      channel === "email"
        ? user.email
        : channel === "sms"
          ? user.phone
          : user.id; // push uses userId

    if (!to) {
      throw new BadRequestException(
        `No ${channel} contact on file for this user`,
      );
    }

    await enqueueNotification({
      channel,
      to,
      body: message,
      subject,
      type: "admin_direct",
      data: { adminId: req.localUser?.id },
      attempt: 0,
      userId: user.id,
    });

    await this.auditService.logFinancialAction({
      actorUserId: req.localUser?.id,
      eventType: "admin_direct_message",
      meta: { targetUserId: id, channel, subject },
    });

    return { ok: true, channel, to };
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  /** DELETE /v1/admin/users/:id — admin-side soft delete */
  @Delete(":id")
  async deleteUser(@Req() req: any, @Param("id") id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

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
