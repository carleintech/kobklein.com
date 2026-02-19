/**
 * Distributor Recharge Service — KobKlein API
 *
 * Handles the recharge workflow:
 * 1. Distributor submits recharge request (bank_transfer, mobile_money, cash_deposit)
 * 2. Admin reviews and approves/rejects
 * 3. On approval, credits distributor's float wallet
 */
import { prisma } from "../db/prisma";
import { notifyUser } from "../push/push.service";

// ─── Distributor Actions ─────────────────────────────────────────────

/**
 * Submit a recharge request.
 */
export async function requestRecharge(params: {
  distributorId: string;
  amount: number;
  currency: string;
  method: string;
  reference?: string;
  proofUrl?: string;
}) {
  return prisma.distributorRecharge.create({
    data: {
      distributorId: params.distributorId,
      amount: params.amount,
      currency: params.currency,
      method: params.method,
      reference: params.reference,
      proofUrl: params.proofUrl,
    },
  });
}

/**
 * List recharges for a distributor.
 */
export async function listRecharges(
  distributorId: string,
  options?: { status?: string; limit?: number; offset?: number },
) {
  const where: any = { distributorId };
  if (options?.status) where.status = options.status;

  const [recharges, total] = await Promise.all([
    prisma.distributorRecharge.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
    }),
    prisma.distributorRecharge.count({ where }),
  ]);

  return { recharges, total };
}

// ─── Admin Actions ───────────────────────────────────────────────────

/**
 * List all pending recharges for admin review.
 */
export async function listPendingRecharges(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (options?.status) where.status = options.status;
  else where.status = "pending";

  const [recharges, total] = await Promise.all([
    prisma.distributorRecharge.findMany({
      where,
      orderBy: { createdAt: "asc" }, // FIFO
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      include: {
        Distributor: {
          select: { displayName: true, businessName: true, userId: true },
        },
      },
    }),
    prisma.distributorRecharge.count({ where }),
  ]);

  return { recharges, total };
}

/**
 * Approve a recharge: credits the distributor's float wallet.
 */
export async function approveRecharge(
  rechargeId: string,
  adminUserId: string,
  note?: string,
) {
  const recharge = await prisma.distributorRecharge.findUnique({
    where: { id: rechargeId },
    include: { Distributor: true },
  });

  if (!recharge) throw new Error("Recharge not found");
  if (recharge.status !== "pending") throw new Error("Recharge already processed");

  return prisma.$transaction(async (tx) => {
    // Update recharge status
    const updated = await tx.distributorRecharge.update({
      where: { id: rechargeId },
      data: {
        status: "approved",
        reviewedBy: adminUserId,
        reviewNote: note,
        reviewedAt: new Date(),
      },
    });

    // Find distributor's float wallet
    const floatWallet = await tx.wallet.findFirst({
      where: {
        userId: recharge.Distributor.userId,
        type: "DISTRIBUTOR",
        currency: recharge.currency,
      },
    });

    if (!floatWallet) {
      throw new Error(`Distributor float wallet not found for ${recharge.currency}`);
    }

    // Credit float wallet
    await tx.ledgerEntry.create({
      data: {
        walletId: floatWallet.id,
        amount: Number(recharge.amount),
        type: "recharge",
        reference: `recharge:${rechargeId}`,
      },
    });

    // Notify distributor
    notifyUser(recharge.Distributor.userId, {
      title: "Recharge Approved ✅",
      body: `Your ${recharge.currency} ${Number(recharge.amount).toLocaleString()} recharge has been approved.`,
      data: { type: "recharge_approved", rechargeId },
    }).catch(() => {}); // fire-and-forget

    return updated;
  });
}

/**
 * Reject a recharge.
 */
export async function rejectRecharge(
  rechargeId: string,
  adminUserId: string,
  note?: string,
) {
  const recharge = await prisma.distributorRecharge.findUnique({
    where: { id: rechargeId },
    include: { Distributor: true },
  });

  if (!recharge) throw new Error("Recharge not found");
  if (recharge.status !== "pending") throw new Error("Recharge already processed");

  const updated = await prisma.distributorRecharge.update({
    where: { id: rechargeId },
    data: {
      status: "rejected",
      reviewedBy: adminUserId,
      reviewNote: note,
      reviewedAt: new Date(),
    },
  });

  // Notify distributor
  notifyUser(recharge.Distributor.userId, {
    title: "Recharge Rejected",
    body: note
      ? `Your recharge was rejected: ${note}`
      : "Your recharge request was rejected. Please contact support.",
    data: { type: "recharge_rejected", rechargeId },
  }).catch(() => {});

  return updated;
}
