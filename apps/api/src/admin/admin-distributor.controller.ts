import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { RolesGuard } from "../policies/roles.guard";
import { Roles } from "../policies/roles.decorator";
import { computeWalletBalance, invalidateBalance } from "../wallets/balance.service";
import { AuditService } from "../audit/audit.service";
import { createNotification } from "../notifications/notification.service";

/**
 * Admin Distributor Management (Phase 47)
 *
 * Approve, suspend, reactivate distributors.
 * Configure commission rates per agent.
 * View network stats and process commission payouts.
 */
@Controller("v1/admin/distributors")
export class AdminDistributorController {
  constructor(private auditService: AuditService) {}

  /**
   * GET /v1/admin/distributors
   * List all distributors with optional status filter.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get()
  async list(
    @Query("status") status?: string,
    @Query("limit") limit?: string,
  ) {
    const take = Math.min(parseInt(limit || "50", 10), 200);
    const where: any = {};
    if (status) where.status = status;

    const distributors = await prisma.distributor.findMany({
      where,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: { id: true, phone: true, firstName: true, lastName: true, kycTier: true },
        },
      },
    });

    // Get float balances for active distributors
    const results: any[] = [];
    for (const d of distributors) {
      let floatBalance = 0;
      if (d.status === "active") {
        const wallet = await prisma.wallet.findFirst({
          where: { userId: d.userId, type: "DISTRIBUTOR" },
        });
        if (wallet) {
          const bal = await computeWalletBalance(wallet.id);
          floatBalance = bal.availableBalance;
        }
      }

      results.push({
        id: d.id,
        userId: d.userId,
        displayName: d.displayName,
        businessName: d.businessName,
        locationText: d.locationText,
        status: d.status,
        tier: d.tier,
        commissionIn: Number(d.commissionIn),
        commissionOut: Number(d.commissionOut),
        floatBalance,
        User: d.User,
        createdAt: d.createdAt,
      });
    }

    return { ok: true, count: results.length, distributors: results };
  }

  /**
   * GET /v1/admin/distributors/:id
   * Get single distributor detail with stats.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get(":id")
  async detail(@Param("id") id: string) {
    const distributor = await prisma.distributor.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, phone: true, firstName: true, lastName: true, email: true, kycTier: true },
        },
      },
    });

    if (!distributor) throw new Error("Distributor not found");

    // Float balance
    let floatBalance = 0;
    const wallet = await prisma.wallet.findFirst({
      where: { userId: distributor.userId, type: "DISTRIBUTOR" },
    });
    if (wallet) {
      const bal = await computeWalletBalance(wallet.id);
      floatBalance = bal.availableBalance;
    }

    // Stats: last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [cashInAgg, cashOutAgg, commissionAgg] = await Promise.all([
      prisma.distributorSettlement.aggregate({
        where: { distributorId: id, type: "cash_in", createdAt: { gte: since } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.distributorSettlement.aggregate({
        where: { distributorId: id, type: "cash_out", createdAt: { gte: since } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.distributorCommission.aggregate({
        where: { distributorId: id, createdAt: { gte: since } },
        _sum: { amount: true },
      }),
    ]);

    return {
      ok: true,
      distributor: {
        id: distributor.id,
        userId: distributor.userId,
        displayName: distributor.displayName,
        businessName: distributor.businessName,
        locationText: distributor.locationText,
        status: distributor.status,
        tier: distributor.tier,
        commissionIn: Number(distributor.commissionIn),
        commissionOut: Number(distributor.commissionOut),
        floatBalance,
        User: distributor.User,
        createdAt: distributor.createdAt,
      },
      stats30d: {
        cashIn: { total: Number(cashInAgg._sum.amount ?? 0), count: cashInAgg._count },
        cashOut: { total: Number(cashOutAgg._sum.amount ?? 0), count: cashOutAgg._count },
        commissions: Number(commissionAgg._sum.amount ?? 0),
      },
    };
  }

  /**
   * POST /v1/admin/distributors/:id/approve
   * Approve a pending distributor application.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/approve")
  async approve(
    @Param("id") id: string,
    @Body() body: { adminUserId?: string },
  ) {
    const distributor = await prisma.distributor.findUnique({
      where: { id },
    });

    if (!distributor) throw new Error("Distributor not found");

    if (distributor.status !== "pending") {
      throw new Error("Invalid distributor state — must be pending");
    }

    // Activate distributor
    await prisma.distributor.update({
      where: { id },
      data: { status: "active" },
    });

    // Create float wallet (HTG)
    await prisma.wallet.create({
      data: {
        userId: distributor.userId,
        currency: "HTG",
        type: "DISTRIBUTOR",
      },
    });

    await createNotification(
      distributor.userId,
      "Distributor Approved",
      "Your distributor application has been approved. You can now process cash-in/cash-out operations.",
      "system",
    );

    if (body.adminUserId) {
      await this.auditService.logFinancialAction({
        actorUserId: body.adminUserId,
        eventType: "distributor_approved",
        meta: { distributorId: id, businessName: distributor.businessName },
      });
    }

    return { ok: true };
  }

  /**
   * POST /v1/admin/distributors/:id/suspend
   * Suspend an active distributor.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/suspend")
  async suspend(
    @Param("id") id: string,
    @Body() body: { reason?: string; adminUserId?: string },
  ) {
    const distributor = await prisma.distributor.findUnique({
      where: { id },
    });

    if (!distributor) throw new Error("Distributor not found");
    if (distributor.status !== "active") {
      throw new Error("Distributor is not active");
    }

    await prisma.distributor.update({
      where: { id },
      data: { status: "suspended" },
    });

    await createNotification(
      distributor.userId,
      "Account Suspended",
      `Your distributor account has been suspended.${body.reason ? ` Reason: ${body.reason}` : ""}`,
      "system",
    );

    if (body.adminUserId) {
      await this.auditService.logFinancialAction({
        actorUserId: body.adminUserId,
        eventType: "distributor_suspended",
        meta: { distributorId: id, reason: body.reason },
      });
    }

    return { ok: true };
  }

  /**
   * POST /v1/admin/distributors/:id/reactivate
   * Reactivate a suspended distributor.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/reactivate")
  async reactivate(
    @Param("id") id: string,
    @Body() body: { adminUserId?: string },
  ) {
    const distributor = await prisma.distributor.findUnique({
      where: { id },
    });

    if (!distributor) throw new Error("Distributor not found");
    if (distributor.status !== "suspended") {
      throw new Error("Distributor is not suspended");
    }

    await prisma.distributor.update({
      where: { id },
      data: { status: "active" },
    });

    await createNotification(
      distributor.userId,
      "Account Reactivated",
      "Your distributor account has been reactivated. You can resume operations.",
      "system",
    );

    if (body.adminUserId) {
      await this.auditService.logFinancialAction({
        actorUserId: body.adminUserId,
        eventType: "distributor_reactivated",
        meta: { distributorId: id },
      });
    }

    return { ok: true };
  }

  /**
   * POST /v1/admin/distributors/:id/commission
   * Update per-distributor commission rates.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/commission")
  async setCommission(
    @Param("id") id: string,
    @Body()
    body: {
      commissionIn?: number;
      commissionOut?: number;
      adminUserId: string;
    },
  ) {
    const distributor = await prisma.distributor.findUnique({
      where: { id },
    });

    if (!distributor) throw new Error("Distributor not found");

    // Validate ranges (0% to 10%)
    if (body.commissionIn !== undefined && (body.commissionIn < 0 || body.commissionIn > 0.10)) {
      throw new Error("commissionIn must be between 0 and 0.10 (0% to 10%)");
    }
    if (body.commissionOut !== undefined && (body.commissionOut < 0 || body.commissionOut > 0.10)) {
      throw new Error("commissionOut must be between 0 and 0.10 (0% to 10%)");
    }

    const updateData: any = {};
    if (body.commissionIn !== undefined) updateData.commissionIn = body.commissionIn;
    if (body.commissionOut !== undefined) updateData.commissionOut = body.commissionOut;

    const updated = await prisma.distributor.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.logFinancialAction({
      actorUserId: body.adminUserId,
      eventType: "distributor_commission_updated",
      meta: {
        distributorId: id,
        businessName: distributor.businessName,
        oldCommissionIn: Number(distributor.commissionIn),
        oldCommissionOut: Number(distributor.commissionOut),
        newCommissionIn: body.commissionIn ?? Number(distributor.commissionIn),
        newCommissionOut: body.commissionOut ?? Number(distributor.commissionOut),
      },
    });

    return {
      ok: true,
      commissionIn: Number(updated.commissionIn),
      commissionOut: Number(updated.commissionOut),
    };
  }

  /**
   * GET /v1/admin/distributors/network/stats
   * Network-wide distributor statistics.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get("network/stats")
  async networkStats() {
    const [totalDist, activeDist, pendingDist, suspendedDist] = await Promise.all([
      prisma.distributor.count(),
      prisma.distributor.count({ where: { status: "active" } }),
      prisma.distributor.count({ where: { status: "pending" } }),
      prisma.distributor.count({ where: { status: "suspended" } }),
    ]);

    // Last 30 days volume
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [cashInTotal, cashOutTotal, commTotal] = await Promise.all([
      prisma.distributorSettlement.aggregate({
        where: { type: "cash_in", createdAt: { gte: since } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.distributorSettlement.aggregate({
        where: { type: "cash_out", createdAt: { gte: since } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.distributorCommission.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { amount: true },
      }),
    ]);

    return {
      ok: true,
      network: {
        total: totalDist,
        active: activeDist,
        pending: pendingDist,
        suspended: suspendedDist,
      },
      volume30d: {
        cashIn: { total: Number(cashInTotal._sum.amount ?? 0), count: cashInTotal._count },
        cashOut: { total: Number(cashOutTotal._sum.amount ?? 0), count: cashOutTotal._count },
        totalCommissions: Number(commTotal._sum.amount ?? 0),
      },
    };
  }

  /**
   * POST /v1/admin/distributors/:id/payout
   * Process earned commission payout — credits distributor float wallet.
   */
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/payout")
  async commissionPayout(
    @Param("id") id: string,
    @Body() body: { adminUserId: string },
  ) {
    const distributor = await prisma.distributor.findUnique({
      where: { id },
    });

    if (!distributor) throw new Error("Distributor not found");

    // Find all earned (unpaid) commissions
    const earnedCommissions = await prisma.distributorCommission.findMany({
      where: { distributorId: id, status: "earned" },
    });

    if (earnedCommissions.length === 0) {
      return { ok: true, message: "No earned commissions to pay out", amount: 0 };
    }

    const totalPayout = earnedCommissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0,
    );

    const agentWallet = await prisma.wallet.findFirst({
      where: { userId: distributor.userId, type: "DISTRIBUTOR" },
    });

    if (!agentWallet) throw new Error("Agent float wallet not found");

    await prisma.$transaction(async (db) => {
      // Credit agent wallet with commission payout
      await db.ledgerEntry.create({
        data: {
          walletId: agentWallet.id,
          amount: totalPayout,
          type: "commission_payout",
          reference: `comm_payout_${id}_${Date.now()}`,
        },
      });

      // Mark all as paid
      await db.distributorCommission.updateMany({
        where: { distributorId: id, status: "earned" },
        data: { status: "paid_out" },
      });
    });

    await invalidateBalance(agentWallet.id);

    await createNotification(
      distributor.userId,
      "Commission Payout",
      `Your earned commissions of ${totalPayout.toLocaleString()} HTG have been credited to your float wallet.`,
      "payment",
    );

    await this.auditService.logFinancialAction({
      actorUserId: body.adminUserId,
      eventType: "commission_payout",
      amount: totalPayout,
      currency: "HTG",
      toWalletId: agentWallet.id,
      meta: {
        distributorId: id,
        commissionCount: earnedCommissions.length,
      },
    });

    return {
      ok: true,
      amount: totalPayout,
      commissionsCount: earnedCommissions.length,
    };
  }
}
