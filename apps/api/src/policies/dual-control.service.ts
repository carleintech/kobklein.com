/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * KobKlein — Dual-Control Approval Service
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Enforces the dual-control requirement for high-risk actions.
 * All actions in DUAL_CONTROL_ACTIONS require a second approver from a
 * DIFFERENT user account in an allowed approver role.
 *
 * Flow:
 *   1. Initiator calls   POST /v1/admin/dual-control/initiate
 *                        → creates PendingApproval, returns requestId
 *   2. Approver calls    POST /v1/admin/dual-control/approve/:requestId
 *                        → validates approver ≠ initiator + role allowed
 *                        → executes the action, logs both identities
 *   3. Anyone calls      GET  /v1/admin/dual-control/pending
 *                        → list all pending approvals for dashboards
 *
 * PRODUCTION NOTE:
 *   Replace the in-memory Map with a PostgreSQL table or Redis hash.
 *   A PendingApproval table schema is provided below for Prisma migration.
 *
 *   model PendingApproval {
 *     id            String   @id @default(cuid())
 *     permission    String
 *     description   String
 *     initiatorId   String
 *     initiatorRole String
 *     payload       Json
 *     status        String   @default("pending") // pending | approved | rejected | expired
 *     approvedById  String?
 *     approvedByRole String?
 *     approvedAt    DateTime?
 *     rejectedAt    DateTime?
 *     expiresAt     DateTime
 *     createdAt     DateTime @default(now())
 *   }
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { DUAL_CONTROL_ACTIONS } from "./dual-control.registry";
import type { AdminRole } from "./types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export interface PendingApproval {
  id: string;
  permission: string;
  description: string;
  initiatorId: string;
  initiatorRole: AdminRole;
  payload: Record<string, unknown>;
  status: ApprovalStatus;
  approvedById?: string;
  approvedByRole?: AdminRole;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  expiresAt: Date;
  createdAt: Date;
}

// ── In-memory store (replace with Prisma/Redis in production) ─────────────────

const STORE = new Map<string, PendingApproval>();
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup expired entries every hour
setInterval(() => {
  const now = new Date();
  for (const [id, approval] of STORE.entries()) {
    if (approval.status === "pending" && approval.expiresAt < now) {
      STORE.set(id, { ...approval, status: "expired" });
    }
  }
}, 3600 * 1000);

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class DualControlService {
  constructor(private auditService: AuditService) {}

  /**
   * Initiate a dual-control action.
   * Creates a PendingApproval record and returns the requestId.
   * The action is NOT executed yet — it waits for a second approver.
   */
  async initiate(params: {
    permission: string;
    initiatorId: string;
    initiatorRole: AdminRole;
    payload: Record<string, unknown>;
    reason?: string;
  }): Promise<{ requestId: string; expiresAt: Date }> {
    // Validate the permission is a dual-control action
    const action = DUAL_CONTROL_ACTIONS.find((a) => a.permission === params.permission);
    if (!action) {
      throw new ForbiddenException(`${params.permission} does not require dual-control`);
    }

    // Validate initiator role is allowed
    if (!action.initiators.includes(params.initiatorRole)) {
      throw new ForbiddenException(
        `Role ${params.initiatorRole} cannot initiate ${params.permission}. ` +
        `Allowed initiators: ${action.initiators.join(", ")}`,
      );
    }

    const id        = `dc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + EXPIRY_MS);

    const approval: PendingApproval = {
      id,
      permission: params.permission,
      description: action.description,
      initiatorId: params.initiatorId,
      initiatorRole: params.initiatorRole,
      payload: { ...params.payload, reason: params.reason },
      status: "pending",
      expiresAt,
      createdAt,
    };

    STORE.set(id, approval);

    // Log the initiation
    await this.auditService.logFinancialAction({
      actorUserId: params.initiatorId,
      eventType: "dual_control_initiated",
      meta: {
        requestId: id,
        permission: params.permission,
        description: action.description,
        initiatorRole: params.initiatorRole,
        expiresAt: expiresAt.toISOString(),
      },
    });

    return { requestId: id, expiresAt };
  }

  /**
   * Approve a pending dual-control action.
   * Validates:
   *   - requestId exists and is still pending
   *   - approver ≠ initiator (no self-approval)
   *   - approver role is in the allowed approvers list
   * Executes the approval and logs both identities.
   */
  async approve(params: {
    requestId: string;
    approverId: string;
    approverRole: AdminRole;
    note?: string;
  }): Promise<PendingApproval> {
    const approval = STORE.get(params.requestId);

    if (!approval) {
      throw new NotFoundException(`No pending approval found for requestId: ${params.requestId}`);
    }

    if (approval.status !== "pending") {
      throw new ForbiddenException(`Approval ${params.requestId} is already ${approval.status}`);
    }

    if (approval.expiresAt < new Date()) {
      STORE.set(params.requestId, { ...approval, status: "expired" });
      throw new ForbiddenException(`Approval ${params.requestId} has expired`);
    }

    // Enforce: approver cannot be the same person as the initiator
    if (approval.initiatorId === params.approverId) {
      throw new ForbiddenException(
        "Self-approval is not permitted. The approver must be a different person than the initiator.",
      );
    }

    // Validate approver role
    const action = DUAL_CONTROL_ACTIONS.find((a) => a.permission === approval.permission);
    if (!action) {
      throw new ForbiddenException(`Unknown dual-control action: ${approval.permission}`);
    }

    if (!action.approvers.includes(params.approverRole)) {
      throw new ForbiddenException(
        `Role ${params.approverRole} cannot approve ${approval.permission}. ` +
        `Allowed approvers: ${action.approvers.join(", ")}`,
      );
    }

    const approved: PendingApproval = {
      ...approval,
      status: "approved",
      approvedById: params.approverId,
      approvedByRole: params.approverRole,
      approvedAt: new Date(),
    };

    STORE.set(params.requestId, approved);

    // Log the approval (both identities)
    await this.auditService.logFinancialAction({
      actorUserId: params.approverId,
      eventType: "dual_control_approved",
      meta: {
        requestId: params.requestId,
        permission: approval.permission,
        description: action.description,
        initiatorId: approval.initiatorId,
        initiatorRole: approval.initiatorRole,
        approvedById: params.approverId,
        approvedByRole: params.approverRole,
        approvedAt: approved.approvedAt!.toISOString(),
        payload: approval.payload,
        note: params.note,
      },
    });

    return approved;
  }

  /**
   * Reject a pending dual-control action.
   */
  async reject(params: {
    requestId: string;
    rejecterId: string;
    rejecterRole: AdminRole;
    reason: string;
  }): Promise<PendingApproval> {
    const approval = STORE.get(params.requestId);

    if (!approval) {
      throw new NotFoundException(`No pending approval: ${params.requestId}`);
    }

    if (approval.status !== "pending") {
      throw new ForbiddenException(`Approval ${params.requestId} is already ${approval.status}`);
    }

    const rejected: PendingApproval = {
      ...approval,
      status: "rejected",
      rejectedAt: new Date(),
      rejectionReason: params.reason,
    };

    STORE.set(params.requestId, rejected);

    await this.auditService.logFinancialAction({
      actorUserId: params.rejecterId,
      eventType: "dual_control_rejected",
      meta: {
        requestId: params.requestId,
        permission: approval.permission,
        initiatorId: approval.initiatorId,
        rejecterId: params.rejecterId,
        rejecterRole: params.rejecterRole,
        reason: params.reason,
      },
    });

    return rejected;
  }

  /**
   * List pending approvals.
   * Filters to only show approvals the requester's role can approve.
   */
  listPending(requesterRole?: AdminRole): PendingApproval[] {
    const all = Array.from(STORE.values()).filter((a) => a.status === "pending");

    if (!requesterRole) return all;

    // Filter to actions this role can approve
    return all.filter((a) => {
      const action = DUAL_CONTROL_ACTIONS.find((d) => d.permission === a.permission);
      return action?.approvers.includes(requesterRole);
    });
  }

  /**
   * Get a specific approval by ID.
   */
  getById(requestId: string): PendingApproval | undefined {
    return STORE.get(requestId);
  }

  /**
   * Get pending count — used by dashboard notification badge.
   */
  getPendingCount(approverRole: AdminRole): number {
    return this.listPending(approverRole).length;
  }
}
