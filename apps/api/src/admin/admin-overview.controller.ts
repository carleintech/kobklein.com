import { Controller, Get, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * Helper: aggregate absolute sum of ledger entries by type + time range.
 * Uses Prisma aggregate (same pattern as analytics.controller.ts).
 */
async function sumLedger(type: string, since?: Date): Promise<number> {
  const result = await prisma.ledgerEntry.aggregate({
    where: {
      type,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    _sum: { amount: true },
  });
  return Math.abs(Number(result._sum.amount ?? 0));
}

async function countLedger(type: string, since?: Date): Promise<number> {
  return prisma.ledgerEntry.count({
    where: {
      type,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
  });
}

/**
 * Admin Financial Dashboard — GET /v1/admin/overview
 *
 * Powers the admin command center with real-time system metrics.
 * All numbers computed from ledger (single source of truth).
 */
@Controller("v1/admin")
export class AdminOverviewController {
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Get("overview")
  async overview() {
    const now = new Date();
    const today = daysAgo(1);
    const week = daysAgo(7);
    const month = daysAgo(30);

    // ── VOLUME ─────────────────────────────────────────────
    const [
      merchantToday,
      merchant7d,
      merchant30d,
      merchantAll,
      merchantCountToday,
      merchantCount30d,
    ] = await Promise.all([
      sumLedger("merchant_payment", today),
      sumLedger("merchant_payment", week),
      sumLedger("merchant_payment", month),
      sumLedger("merchant_payment"),
      countLedger("merchant_payment", today),
      countLedger("merchant_payment", month),
    ]);

    const [cashIn30d, cashOut30d] = await Promise.all([
      sumLedger("cash_in_credit", month),
      sumLedger("cash_out_debit", month),
    ]);

    const [subsToday, subs7d, subs30d, subsAll] = await Promise.all([
      sumLedger("subscription_charge", today),
      sumLedger("subscription_charge", week),
      sumLedger("subscription_charge", month),
      sumLedger("subscription_charge"),
    ]);

    // Transfer volume (P2P)
    const transfers = await prisma.transfer.aggregate({
      where: { createdAt: { gte: month } },
      _sum: { amount: true },
      _count: true,
    });

    // ── REVENUE ────────────────────────────────────────────
    const [
      merchantFeeToday,
      merchantFee7d,
      merchantFee30d,
      merchantFeeAll,
    ] = await Promise.all([
      sumLedger("merchant_fee", today),
      sumLedger("merchant_fee", week),
      sumLedger("merchant_fee", month),
      sumLedger("merchant_fee"),
    ]);

    const [cashOutFee30d, commission30d] = await Promise.all([
      sumLedger("cash_out_fee", month),
      sumLedger("commission", month),
    ]);

    // ── GROWTH ─────────────────────────────────────────────
    const [usersToday, users7d, users30d, totalUsers] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: week } } }),
      prisma.user.count({ where: { createdAt: { gte: month } } }),
      prisma.user.count(),
    ]);

    // Active wallets (distinct wallets with any ledger activity in 30 days)
    const activeWallets = await prisma.ledgerEntry.groupBy({
      by: ["walletId"],
      where: { createdAt: { gte: month } },
    });
    const activeWalletCount = activeWallets.length;

    // ── OPS ────────────────────────────────────────────────
    const [pendingKyc, delinquentSubs, activeMerchants, activeDistributors] =
      await Promise.all([
        prisma.user.count({ where: { kycTier: 0 } }),
        prisma.subscriptionProxy.count({
          where: { status: "delinquent" },
        }),
        prisma.merchant.count({ where: { status: "active" } }),
        prisma.distributor.count({ where: { status: "active" } }),
      ]);

    return {
      ok: true,
      generatedAt: now,

      volume: {
        merchantPayments: {
          today: merchantToday,
          last7d: merchant7d,
          last30d: merchant30d,
          allTime: merchantAll,
          countToday: merchantCountToday,
          count30d: merchantCount30d,
        },
        cashIn: { last30d: cashIn30d },
        cashOut: { last30d: cashOut30d },
        subscriptions: {
          today: subsToday,
          last7d: subs7d,
          last30d: subs30d,
          allTime: subsAll,
        },
        transfers: {
          last30d: Number(transfers._sum.amount ?? 0),
          count30d: transfers._count,
        },
      },

      revenue: {
        merchantFees: {
          today: merchantFeeToday,
          last7d: merchantFee7d,
          last30d: merchantFee30d,
          allTime: merchantFeeAll,
        },
        cashOutFees: { last30d: cashOutFee30d },
        agentCommissions: { last30d: commission30d },
      },

      growth: {
        newUsers: {
          today: usersToday,
          last7d: users7d,
          last30d: users30d,
        },
        totalUsers,
        activeWalletsLast30d: activeWalletCount,
      },

      ops: {
        pendingKyc,
        delinquentSubs,
        activeMerchants,
        activeDistributors,
      },
    };
  }
}
