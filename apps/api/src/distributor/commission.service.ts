/**
 * Distributor Commission Service — KobKlein API
 *
 * Accrues commission on every distributor cash-in/cash-out transaction
 * and provides summary + history for the distributor dashboard.
 */
import { prisma } from "../db/prisma";

// ─── Accrual ─────────────────────────────────────────────────────────

export async function accrueCommission(params: {
  distributorId: string;
  txnId: string;
  amount: number;
  currency: string;
  type: "cashin" | "cashout";
}): Promise<void> {
  const distributor = await prisma.distributor.findUnique({
    where: { id: params.distributorId },
    select: { commissionIn: true, commissionOut: true },
  });

  if (!distributor) return;

  const rate =
    params.type === "cashin"
      ? Number(distributor.commissionIn)
      : Number(distributor.commissionOut);

  const commissionAmount = Math.round(params.amount * rate * 100) / 100;
  if (commissionAmount <= 0) return;

  await prisma.distributorCommission.create({
    data: {
      distributorId: params.distributorId,
      txnId: params.txnId,
      amount: commissionAmount,
      currency: params.currency,
      status: "earned",
    },
  });
}

// ─── Summary ─────────────────────────────────────────────────────────

export async function getCommissionSummary(distributorId: string): Promise<{
  totalEarned: number;
  pendingBalance: number;
  totalPaid: number;
  currency: string;
}> {
  const rows = await prisma.distributorCommission.groupBy({
    by: ["status"],
    where: { distributorId },
    _sum: { amount: true },
  });

  const earned = rows.find((r) => r.status === "earned");
  const paid = rows.find((r) => r.status === "paid");

  return {
    totalEarned: Number(earned?._sum.amount ?? 0) + Number(paid?._sum.amount ?? 0),
    pendingBalance: Number(earned?._sum.amount ?? 0),
    totalPaid: Number(paid?._sum.amount ?? 0),
    currency: "HTG",
  };
}

// ─── History ─────────────────────────────────────────────────────────

export async function getCommissionHistory(
  distributorId: string,
  page = 1,
  limit = 20,
): Promise<{ items: unknown[]; total: number; page: number }> {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.distributorCommission.findMany({
      where: { distributorId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.distributorCommission.count({ where: { distributorId } }),
  ]);

  return { items, total, page };
}
