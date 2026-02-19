import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { computeWalletBalance, invalidateBalance } from "../wallets/balance.service";
import { AuditService } from "../audit/audit.service";
import { withIdempotency } from "../idempotency/idempotency.service";
import { createNotification } from "../notifications/notification.service";

@Controller("v1/distributor")
export class CashOperationsController {
  constructor(private auditService: AuditService) {}

  /**
   * CASH-IN: Customer gives cash to agent, agent credits their KobKlein wallet.
   * Distributor's float is debited, customer's wallet is credited.
   */
  @UseGuards(SupabaseGuard, FreezeGuard)
  @Post("cash-in")
  async cashIn(
    @Req() req: any,
    @Body()
    body: {
      customerPhone: string;
      amount: number;
      currency: string;
      idempotencyKey: string;
    },
  ) {
    const agentUserId = req.localUser?.id || req.user?.sub;

    // Verify agent is an active distributor
    const distributor = await prisma.distributor.findFirst({
      where: { userId: agentUserId, status: "active" },
    });
    if (!distributor) throw new Error("Not an active distributor");

    // Find customer by phone
    const customer = await prisma.user.findFirst({
      where: { phone: body.customerPhone },
    });
    if (!customer) throw new Error("Customer not found");

    if (customer.isFrozen) throw new Error("Customer account is frozen");

    // Find wallets
    const agentWallet = await prisma.wallet.findFirst({
      where: { userId: agentUserId, type: "DISTRIBUTOR" },
    });
    if (!agentWallet) throw new Error("Agent wallet not found");

    const customerWallet = await prisma.wallet.findFirst({
      where: { userId: customer.id, currency: body.currency },
    });
    if (!customerWallet) throw new Error("Customer wallet not found");

    // Check agent has enough float
    const agentBalance = await computeWalletBalance(agentWallet.id);
    if (agentBalance.availableBalance < body.amount) {
      throw new Error("Insufficient float");
    }

    // Calculate commission
    const commissionRate = Number(distributor.commissionIn);
    const commission = Math.round(body.amount * commissionRate * 100) / 100;

    const result = await withIdempotency({
      userId: agentUserId,
      route: "POST:/v1/distributor/cash-in",
      key: body.idempotencyKey,
      body,
      run: async () => {
        return prisma.$transaction(async (db) => {
          // Debit agent float
          await db.ledgerEntry.create({
            data: {
              walletId: agentWallet.id,
              amount: -body.amount,
              type: "cash_in_debit",
            },
          });

          // Credit customer wallet
          await db.ledgerEntry.create({
            data: {
              walletId: customerWallet.id,
              amount: body.amount,
              type: "cash_in_credit",
            },
          });

          // Record commission as separate ledger entry for agent
          if (commission > 0) {
            await db.ledgerEntry.create({
              data: {
                walletId: agentWallet.id,
                amount: commission,
                type: "commission",
              },
            });
          }

          // Record settlement
          await db.distributorSettlement.create({
            data: {
              distributorId: distributor.id,
              amount: body.amount,
              currency: body.currency,
              type: "cash_in",
            },
          });

          return {
            ok: true,
            type: "cash_in",
            amount: body.amount,
            commission,
            customerPhone: body.customerPhone,
          };
        });
      },
    });

    // Invalidate cached balances
    await invalidateBalance(agentWallet.id);
    await invalidateBalance(customerWallet.id);

    // Notifications
    await createNotification(
      customer.id,
      "Cash-In Received",
      `${body.amount.toLocaleString()} ${body.currency} has been added to your wallet via a K-Agent.`,
      "deposit",
    );

    // Audit
    await this.auditService.logFinancialAction({
      actorUserId: agentUserId,
      eventType: "cash_in",
      amount: body.amount,
      currency: body.currency,
      fromWalletId: agentWallet.id,
      toWalletId: customerWallet.id,
      meta: {
        customerUserId: customer.id,
        distributorId: distributor.id,
        commission,
      },
    });

    return result;
  }

  /**
   * CASH-OUT: Customer requests cash, agent pays them and debits their wallet.
   * Customer's wallet is debited, agent's float is credited.
   */
  @UseGuards(SupabaseGuard, FreezeGuard)
  @Post("cash-out")
  async cashOut(
    @Req() req: any,
    @Body()
    body: {
      customerPhone: string;
      amount: number;
      currency: string;
      idempotencyKey: string;
    },
  ) {
    const agentUserId = req.localUser?.id || req.user?.sub;

    const distributor = await prisma.distributor.findFirst({
      where: { userId: agentUserId, status: "active" },
    });
    if (!distributor) throw new Error("Not an active distributor");

    const customer = await prisma.user.findFirst({
      where: { phone: body.customerPhone },
    });
    if (!customer) throw new Error("Customer not found");

    if (customer.isFrozen) throw new Error("Customer account is frozen");

    const customerWallet = await prisma.wallet.findFirst({
      where: { userId: customer.id, currency: body.currency },
    });
    if (!customerWallet) throw new Error("Customer wallet not found");

    const agentWallet = await prisma.wallet.findFirst({
      where: { userId: agentUserId, type: "DISTRIBUTOR" },
    });
    if (!agentWallet) throw new Error("Agent wallet not found");

    // Check customer has enough balance
    const customerBalance = await computeWalletBalance(customerWallet.id);
    if (customerBalance.availableBalance < body.amount) {
      throw new Error("Insufficient customer balance");
    }

    // Fee: 1% cash-out fee from customer
    const fee = Math.round(body.amount * 1) / 100;
    const commissionRate = Number(distributor.commissionOut);
    const commission = Math.round(body.amount * commissionRate * 100) / 100;

    const result = await withIdempotency({
      userId: agentUserId,
      route: "POST:/v1/distributor/cash-out",
      key: body.idempotencyKey,
      body,
      run: async () => {
        return prisma.$transaction(async (db) => {
          // Debit customer wallet (amount + fee)
          await db.ledgerEntry.create({
            data: {
              walletId: customerWallet.id,
              amount: -(body.amount + fee),
              type: "cash_out_debit",
            },
          });

          // Credit agent float
          await db.ledgerEntry.create({
            data: {
              walletId: agentWallet.id,
              amount: body.amount,
              type: "cash_out_credit",
            },
          });

          // Agent commission
          if (commission > 0) {
            await db.ledgerEntry.create({
              data: {
                walletId: agentWallet.id,
                amount: commission,
                type: "commission",
              },
            });
          }

          // Platform revenue (fee - commission goes to system)
          const platformFee = fee - commission;
          if (platformFee > 0) {
            const systemWallet = await db.wallet.findFirst({
              where: { type: "TREASURY" },
            });
            if (systemWallet) {
              await db.ledgerEntry.create({
                data: {
                  walletId: systemWallet.id,
                  amount: platformFee,
                  type: "cash_out_fee",
                },
              });
            }
          }

          await db.distributorSettlement.create({
            data: {
              distributorId: distributor.id,
              amount: body.amount,
              currency: body.currency,
              type: "cash_out",
            },
          });

          return {
            ok: true,
            type: "cash_out",
            amount: body.amount,
            fee,
            commission,
            customerPhone: body.customerPhone,
          };
        });
      },
    });

    // Invalidate cached balances
    await invalidateBalance(customerWallet.id);
    await invalidateBalance(agentWallet.id);

    await createNotification(
      customer.id,
      "Cash-Out Processed",
      `${body.amount.toLocaleString()} ${body.currency} has been withdrawn from your wallet. Fee: ${fee} ${body.currency}.`,
      "withdrawal",
    );

    await this.auditService.logFinancialAction({
      actorUserId: agentUserId,
      eventType: "cash_out",
      amount: body.amount,
      currency: body.currency,
      fromWalletId: customerWallet.id,
      toWalletId: agentWallet.id,
      meta: {
        customerUserId: customer.id,
        distributorId: distributor.id,
        fee,
        commission,
      },
    });

    return result;
  }

  /**
   * Agent dashboard stats: float balance, today's transactions, commissions.
   */
  @UseGuards(SupabaseGuard)
  @Get("dashboard")
  async dashboard(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const distributor = await prisma.distributor.findFirst({
      where: { userId },
    });
    if (!distributor) {
      // User has distributor role but hasn't been onboarded yet.
      // Return a safe empty state so the dashboard renders a "pending setup" UI.
      return {
        distributorId: null,
        businessName: null,
        status: "pending",
        floatBalance: 0,
        totalFloat: 0,
        todayTransactions: 0,
        todayCommissions: 0,
        commissionRate: 0,
        settlements: [],
      };
    }

    const agentWallet = await prisma.wallet.findFirst({
      where: { userId, type: "DISTRIBUTOR" },
    });
    if (!agentWallet) return { floatBalance: 0, todayTransactions: 0, todayCommissions: 0, settlements: [] };

    const balance = await computeWalletBalance(agentWallet.id);

    // Today's activity
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEntries = await prisma.ledgerEntry.findMany({
      where: {
        walletId: agentWallet.id,
        createdAt: { gte: todayStart },
        type: { in: ["cash_in_debit", "cash_out_credit", "commission"] },
      },
      select: { amount: true, type: true },
    });

    const todayTransactions = todayEntries.filter(
      (e) => e.type === "cash_in_debit" || e.type === "cash_out_credit",
    ).length;

    const todayCommissions = todayEntries
      .filter((e) => e.type === "commission")
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

    // Recent settlements
    const settlements = await prisma.distributorSettlement.findMany({
      where: { distributorId: distributor.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return {
      distributorId: distributor.id,
      businessName: distributor.businessName,
      status: distributor.status,
      floatBalance: balance.availableBalance,
      totalFloat: balance.totalBalance,
      todayTransactions,
      todayCommissions,
      commissionRate: Number(distributor.commissionOut),
      settlements,
    };
  }

  /**
   * Agent transaction history.
   */
  @UseGuards(SupabaseGuard)
  @Get("transactions")
  async transactions(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    const agentWallet = await prisma.wallet.findFirst({
      where: { userId, type: "DISTRIBUTOR" },
    });
    if (!agentWallet) return [];

    return prisma.ledgerEntry.findMany({
      where: {
        walletId: agentWallet.id,
        type: {
          in: [
            "cash_in_debit",
            "cash_out_credit",
            "commission",
            "float_transfer",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        amount: true,
        type: true,
        createdAt: true,
      },
    });
  }
}
