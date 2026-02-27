import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { RolesGuard } from "./roles.guard";
import { Roles } from "./roles.decorator";
import { DualControlService } from "./dual-control.service";
import { DUAL_CONTROL_ACTIONS } from "./dual-control.registry";

/**
 * Dual-Control Approval Controller
 *
 * Routes:
 *   POST /v1/admin/dual-control/initiate          — create pending approval
 *   POST /v1/admin/dual-control/approve/:id       — second person approves
 *   POST /v1/admin/dual-control/reject/:id        — second person rejects
 *   GET  /v1/admin/dual-control/pending           — list pending (filterable)
 *   GET  /v1/admin/dual-control/actions           — list all dual-control actions
 *   GET  /v1/admin/dual-control/pending/count     — count for notification badge
 *   GET  /v1/admin/dual-control/:id               — get single approval
 */
@Controller("v1/admin/dual-control")
@UseGuards(SupabaseGuard, RolesGuard)
@Roles("admin")
export class DualControlController {
  constructor(private dualControlService: DualControlService) {}

  /**
   * POST /v1/admin/dual-control/initiate
   * Initiate a dual-control action. Returns a requestId for the approver.
   *
   * Body: { permission, payload, reason }
   */
  @Post("initiate")
  async initiate(
    @Req() req: any,
    @Body()
    body: {
      permission: string;
      payload: Record<string, unknown>;
      reason?: string;
    },
  ) {
    const initiatorId   = req.localUser?.id ?? req.user?.sub;
    const initiatorRole =
      req.user?.user_metadata?.admin_role ??
      req.user?.user_metadata?.role ??
      req.localUser?.role;

    if (!initiatorId || !initiatorRole) {
      return { ok: false, error: "Could not resolve initiator identity" };
    }

    const result = await this.dualControlService.initiate({
      permission:    body.permission,
      initiatorId,
      initiatorRole,
      payload:       body.payload ?? {},
      reason:        body.reason,
    });

    return {
      ok: true,
      requestId:  result.requestId,
      expiresAt:  result.expiresAt,
      message:    "Pending approval created. A second approver must confirm this action.",
    };
  }

  /**
   * POST /v1/admin/dual-control/approve/:requestId
   * Second person approves the pending action.
   * Requires: different person than initiator, correct approver role.
   *
   * Body: { note? }
   */
  @Post("approve/:requestId")
  async approve(
    @Req() req: any,
    @Param("requestId") requestId: string,
    @Body() body: { note?: string },
  ) {
    const approverId   = req.localUser?.id ?? req.user?.sub;
    const approverRole =
      req.user?.user_metadata?.admin_role ??
      req.user?.user_metadata?.role ??
      req.localUser?.role;

    const approved = await this.dualControlService.approve({
      requestId,
      approverId,
      approverRole,
      note: body.note,
    });

    return {
      ok:         true,
      approval:   approved,
      message:    "Action approved. Execution confirmed and logged.",
    };
  }

  /**
   * POST /v1/admin/dual-control/reject/:requestId
   * Reject a pending action with a reason.
   *
   * Body: { reason }
   */
  @Post("reject/:requestId")
  async reject(
    @Req() req: any,
    @Param("requestId") requestId: string,
    @Body() body: { reason: string },
  ) {
    const rejecterId   = req.localUser?.id ?? req.user?.sub;
    const rejecterRole =
      req.user?.user_metadata?.admin_role ??
      req.user?.user_metadata?.role ??
      req.localUser?.role;

    const rejected = await this.dualControlService.reject({
      requestId,
      rejecterId,
      rejecterRole,
      reason: body.reason,
    });

    return { ok: true, approval: rejected };
  }

  /**
   * GET /v1/admin/dual-control/pending
   * List pending approvals the current user's role can approve.
   * ?all=true to show all pending regardless of role (super_admin only).
   */
  @Get("pending")
  async listPending(@Req() req: any, @Query("all") all?: string) {
    const approverRole =
      req.user?.user_metadata?.admin_role ??
      req.user?.user_metadata?.role ??
      req.localUser?.role;

    const showAll = all === "true" && approverRole === "super_admin";
    const pending = this.dualControlService.listPending(showAll ? undefined : approverRole);

    return {
      ok: true,
      count: pending.length,
      approvals: pending,
    };
  }

  /**
   * GET /v1/admin/dual-control/pending/count
   * Returns the count of pending approvals for the notification badge.
   */
  @Get("pending/count")
  async pendingCount(@Req() req: any) {
    const approverRole =
      req.user?.user_metadata?.admin_role ??
      req.user?.user_metadata?.role ??
      req.localUser?.role;

    const count = this.dualControlService.getPendingCount(approverRole);

    return { ok: true, count };
  }

  /**
   * GET /v1/admin/dual-control/actions
   * List all dual-control actions (for documentation / transparency).
   */
  @Get("actions")
  async listActions() {
    return {
      ok:      true,
      count:   DUAL_CONTROL_ACTIONS.length,
      actions: DUAL_CONTROL_ACTIONS.map((a) => ({
        permission:  a.permission,
        description: a.description,
        initiators:  a.initiators,
        approvers:   a.approvers,
        threshold:   a.threshold,
      })),
    };
  }

  /**
   * GET /v1/admin/dual-control/:requestId
   * Get details of a specific pending approval.
   */
  @Get(":requestId")
  async getById(@Param("requestId") requestId: string) {
    const approval = this.dualControlService.getById(requestId);
    if (!approval) {
      return { ok: false, error: "Approval not found" };
    }
    return { ok: true, approval };
  }
}
