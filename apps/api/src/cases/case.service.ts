import { prisma } from '../db/prisma';
import { emitEvent } from '../services/event-bus.service';

// ─── HELPER: Find recipient user ID from reference ───────────────────
export async function findRecipientUserId(referenceType: string, referenceId: string) {
  if (referenceType === 'transfer') {
    const tx = await prisma.transfer.findUnique({
      where: { id: referenceId },
    });
    if (!tx) return null;

    const toWallet = await prisma.wallet.findUnique({
      where: { id: tx.toWalletId },
    });
    return toWallet?.userId || null;
  }

  if (referenceType === 'merchant_payment') {
    const entry = await prisma.ledgerEntry.findFirst({
      where: { reference: referenceId, type: 'merchant_payment' },
    });

    if (!entry) return null;

    const wallet = await prisma.wallet.findUnique({
      where: { id: entry.walletId },
    });

    return wallet?.userId || null;
  }

  return null;
}

// ─── CREATE CASE ─────────────────────────────────────────────────────
export async function createCase(params: {
  type: string;
  userId?: string;
  relatedType?: string;
  relatedId?: string;
  description: string;
  priority?: string;
  assignedTo?: string;
  createdByAdminId?: string;
}) {
  const {
    type, userId, relatedType, relatedId,
    description, priority, assignedTo, createdByAdminId,
  } = params;

  // Map old type to new caseType
  const caseTypeMap = {
    chargeback: 'merchant_dispute',
    transaction_dispute: 'wrong_recipient',
    withdrawal_dispute: 'wrong_recipient',
    fraud_investigation: 'unauthorized',
    kyc_review: 'unauthorized',
  };

  const caseData = await prisma.case.create({
    data: {
      caseType: caseTypeMap[type] || type,
      status: 'open',
      priority: priority || 'normal',
      reporterUserId: userId,
      referenceType: relatedType as any,
      referenceId: relatedId,
      description,
    },
  });

  await emitEvent('case.created', {
    caseId: caseData.id,
    caseType: caseData.caseType,
    priority: caseData.priority,
    userId: caseData.reporterUserId,
  });

  return caseData;
}

// ─── LIST CASES ──────────────────────────────────────────────────────
export async function listCases(filters?: {
  status?: string;
  type?: string;
  priority?: string;
  userId?: string;
  limit?: number;
}) {
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.type) where.caseType = filters.type;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.userId) where.reporterUserId = filters.userId;

  const limit = Math.min(filters?.limit ?? 100, 500);

  return prisma.case.findMany({
    where,
    orderBy: [
      {
        priority: 'asc', // critical first
      },
      {
        createdAt: 'desc',
      },
    ],
    take: limit,
  });
}

// ─── GET CASE DETAIL ─────────────────────────────────────────────────
export async function getCaseDetail(caseId: string) {
  return prisma.case.findUnique({
    where: { id: caseId },
    include: {
      CaseMessage: {
        orderBy: { createdAt: 'asc' },
      },
      CaseAction: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

// ─── UPDATE CASE STATUS ──────────────────────────────────────────────
export async function updateCaseStatus(params: {
  caseId: string;
  status: string;
  adminUserId: string;
}) {
  const { caseId, status, adminUserId } = params;

  const validStatuses = ['open', 'investigating', 'pending_user', 'pending_admin', 'resolved', 'rejected'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
  }

  const caseData = await prisma.case.update({
    where: { id: caseId },
    data: {
      status,
      updatedAt: new Date(),
      closedAt: status === 'resolved' || status === 'rejected' ? new Date() : null,
    },
  });

  await emitEvent('case.status_changed', {
    caseId,
    status,
    previousStatus: caseData.status,
  });

  return caseData;
}

// ─── ASSIGN CASE ─────────────────────────────────────────────────────
export async function assignCase(params: {
  caseId: string;
  assignedTo: string;
  adminUserId: string;
}) {
  // Note: new schema doesn't have assignedTo field, so this is a no-op for now
  return { message: 'Assignment not supported in new schema' };
}

// ─── ADD NOTE ────────────────────────────────────────────────────────
export async function addCaseNote(caseId: string, authorId: string, note: string) {
  const message = await prisma.caseMessage.create({
    data: {
      caseId,
      authorRole: 'admin',
      authorUserId: authorId,
      message: note,
    },
  });

  // Update case updatedAt
  await prisma.case.update({
    where: { id: caseId },
    data: { updatedAt: new Date() },
  });

  return message;
}

// ─── AUTO-CREATE FROM EVENTS ─────────────────────────────────────────

/** Called when Stripe sends charge.dispute.created */
export async function createChargebackCase(params: {
  userId?: string;
  depositId?: string;
  stripeDisputeId: string;
  amount: number;
  currency: string;
  reason?: string;
}) {
  return createCase({
    type: 'merchant_dispute',
    userId: params.userId,
    relatedType: 'deposit',
    relatedId: params.depositId,
    priority: 'high',
    description: `Stripe chargeback dispute ${params.stripeDisputeId}: ${params.amount} ${params.currency}. Reason: ${params.reason ?? 'not specified'}`,
  });
}

/** Called when risk engine flags a user */
export async function createFraudCase(params: {
  userId: string;
  riskFlagId: string;
  severity: number;
  details?: string;
}) {
  const priority = params.severity >= 4 ? 'critical' : params.severity >= 3 ? 'high' : 'normal';
  return createCase({
    type: 'unauthorized',
    userId: params.userId,
    priority,
    description: `Auto-generated from risk flag ${params.riskFlagId}. ${params.details ?? ''}`.trim(),
  });
}
