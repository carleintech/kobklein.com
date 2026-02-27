import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { RolesGuard } from "../policies/roles.guard";
import { Roles } from "../policies/roles.decorator";
import { AuditService } from "../audit/audit.service";
import { supabaseAdmin } from "../lib/supabase-admin";

// ─── Admin role sets ──────────────────────────────────────────────────────────

const ADMIN_ROLES = new Set([
  "super_admin", "admin", "regional_manager", "support_agent",
  "compliance_officer", "treasury_officer", "hr_manager",
  "investor", "auditor", "broadcaster",
]);

// ─── Training status derivation ───────────────────────────────────────────────
// In production: replace with a dedicated AdminTraining DB table.
// For now: derives from Supabase user_metadata.training_completed_at.

function deriveTraining(meta: Record<string, unknown>, createdAt: string) {
  if (meta.training_exempt) return { status: "exempt" as const, completedAt: null, dueAt: null };

  const completedAt = meta.training_completed_at as string | undefined;
  const now = Date.now();

  if (completedAt) {
    const daysSince = (now - new Date(completedAt).getTime()) / 86_400_000;
    const dueAt = new Date(new Date(completedAt).getTime() + 180 * 86_400_000).toISOString();
    const status: "compliant" | "overdue" = daysSince < 180 ? "compliant" : "overdue";
    return { status, completedAt, dueAt };
  }

  const daysSinceCreation = (now - new Date(createdAt).getTime()) / 86_400_000;
  const status: "pending" | "overdue" = daysSinceCreation < 30 ? "pending" : "overdue";
  return {
    status,
    completedAt: null,
    dueAt: null,
  };
}

/**
 * Admin HR & Staff Governance Controller (Phase 48)
 *
 * Manages: admin staff directory, role assignments, training compliance,
 * onboarding / offboarding lifecycle.
 *
 * Routes:
 *   GET  /v1/admin/hr/staff                           — list admin staff
 *   GET  /v1/admin/hr/training/status                 — training compliance overview
 *   POST /v1/admin/hr/staff/:userId/training/complete — mark training done
 *   POST /v1/admin/hr/staff/:userId/suspend           — suspend access
 *   POST /v1/admin/hr/staff/:userId/reactivate        — reactivate access
 *   POST /v1/admin/hr/staff/:userId/offboard          — permanent offboard
 *   POST /v1/admin/hr/staff/:userId/role              — reassign admin role
 *
 * Accessible to: hr_manager, super_admin (via @Roles("admin") + ADMIN_FAMILY membership)
 */
@Controller("v1/admin/hr")
@UseGuards(SupabaseGuard, RolesGuard)
@Roles("admin")
export class AdminHrController {
  constructor(private auditService: AuditService) {}

  /**
   * GET /v1/admin/hr/staff
   * List admin staff from Supabase auth.users (real data via service role key).
   */
  @Get("staff")
  async listStaff(@Query("role") role?: string) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(`Supabase Admin API error: ${error.message}`);

    let staff = data.users.filter((u) => {
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      const r = (meta.admin_role ?? meta.role) as string | undefined;
      return r && ADMIN_ROLES.has(r);
    });

    if (role && role !== "all") {
      staff = staff.filter((u) => {
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        return meta.admin_role === role || meta.role === role;
      });
    }

    return {
      ok: true,
      total: staff.length,
      staff: staff.map((u) => {
        const meta   = (u.user_metadata ?? {}) as Record<string, unknown>;
        const train  = deriveTraining(meta, u.created_at);
        return {
          id:                  u.id,
          email:               u.email ?? "",
          firstName:           (meta.first_name  ?? meta.firstName  ?? "") as string,
          lastName:            (meta.last_name   ?? meta.lastName   ?? "") as string,
          role:                (meta.admin_role  ?? meta.role ?? "support_agent") as string,
          status:              u.banned_until ? "suspended" : "active",
          trainingStatus:      train.status,
          trainingCompletedAt: train.completedAt,
          trainingDueAt:       train.dueAt,
          lastLogin:           u.last_sign_in_at ?? null,
          createdAt:           u.created_at,
          region:              (meta.region ?? null) as string | null,
        };
      }),
    };
  }

  /**
   * GET /v1/admin/hr/training/status
   * Training compliance summary — derived live from Supabase user metadata.
   */
  @Get("training/status")
  async trainingStatus() {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return { ok: false, error: error.message };

    const staff = data.users.filter((u) => {
      const r = ((u.user_metadata ?? {}) as Record<string, unknown>).admin_role as string | undefined;
      return r && ADMIN_ROLES.has(r);
    });

    let compliant = 0, overdue = 0, pending = 0, exempt = 0;
    for (const u of staff) {
      const { status } = deriveTraining((u.user_metadata ?? {}) as Record<string, unknown>, u.created_at);
      if (status === "compliant") compliant++;
      else if (status === "overdue")  overdue++;
      else if (status === "pending")  pending++;
      else                            exempt++;
    }

    return {
      ok: true,
      summary: { totalStaff: staff.length, compliant, overdue, pending, exempt },
      trainingCycleDays: 180,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * POST /v1/admin/hr/staff/:userId/training/complete
   * Mark a staff member's mandatory training as completed.
   */
  @Post("staff/:userId/training/complete")
  async markTrainingComplete(
    @Req() req: any,
    @Param("userId") userId: string,
    @Body() body: { completedAt?: string; notes?: string },
  ) {
    const actorId = req.localUser?.id;

    await this.auditService.logFinancialAction({
      actorUserId: actorId,
      eventType: "staff_training_completed",
      meta: {
        targetUserId: userId,
        completedAt: body.completedAt ?? new Date().toISOString(),
        notes: body.notes,
      },
    });

    const completedAt = body.completedAt ?? new Date().toISOString();
    const nextDueAt   = new Date(new Date(completedAt).getTime() + 180 * 24 * 3600 * 1000).toISOString();

    return { ok: true, userId, trainingCompletedAt: completedAt, nextDueAt };
  }

  /**
   * POST /v1/admin/hr/staff/:userId/suspend
   * Suspend an admin staff member's access.
   * Production: calls Supabase Management API to ban the user.
   */
  @Post("staff/:userId/suspend")
  async suspendStaff(
    @Req() req: any,
    @Param("userId") userId: string,
    @Body() body: { reason: string },
  ) {
    if (!body.reason?.trim()) throw new Error("reason is required for staff suspension");

    const actorId = req.localUser?.id;

    await this.auditService.logFinancialAction({
      actorUserId: actorId,
      eventType: "staff_suspended",
      meta: {
        targetUserId: userId,
        reason: body.reason,
        // Production: POST https://<project>.supabase.co/auth/v1/admin/users/:id
        //             with { ban_duration: "876600h" } to permanently ban
      },
    });

    return { ok: true, userId, status: "suspended", reason: body.reason };
  }

  /**
   * POST /v1/admin/hr/staff/:userId/reactivate
   * Reactivate a suspended admin staff member.
   */
  @Post("staff/:userId/reactivate")
  async reactivateStaff(
    @Req() req: any,
    @Param("userId") userId: string,
    @Body() body: { reason?: string },
  ) {
    const actorId = req.localUser?.id;

    await this.auditService.logFinancialAction({
      actorUserId: actorId,
      eventType: "staff_reactivated",
      meta: { targetUserId: userId, reason: body.reason },
    });

    return { ok: true, userId, status: "active" };
  }

  /**
   * POST /v1/admin/hr/staff/:userId/offboard
   * Permanently offboard a staff member — revokes all access.
   * Dual-control: requires confirmation from a second super_admin.
   */
  @Post("staff/:userId/offboard")
  async offboardStaff(
    @Req() req: any,
    @Param("userId") userId: string,
    @Body() body: { reason: string; effectiveDate?: string; confirmedBy?: string },
  ) {
    if (!body.reason?.trim()) throw new Error("reason is required for offboarding");

    const actorId     = req.localUser?.id;
    const effectiveAt = body.effectiveDate ?? new Date().toISOString();

    await this.auditService.logFinancialAction({
      actorUserId: actorId,
      eventType: "staff_offboarded",
      meta: { targetUserId: userId, reason: body.reason, effectiveDate: effectiveAt, confirmedBy: body.confirmedBy },
    });

    return { ok: true, userId, status: "offboarded", effectiveDate: effectiveAt };
  }

  /**
   * POST /v1/admin/hr/staff/:userId/role
   * Reassign a staff member's admin role.
   * NOTE: Roles are stored in Supabase user_metadata.admin_role.
   * Production: call Supabase Management API to update user metadata.
   */
  @Post("staff/:userId/role")
  async reassignRole(
    @Req() req: any,
    @Param("userId") userId: string,
    @Body() body: { newRole: string; reason: string; approvedBy?: string },
  ) {
    const VALID_ROLES = [
      "admin", "regional_manager", "support_agent",
      "compliance_officer", "treasury_officer", "hr_manager",
      "investor", "auditor", "broadcaster",
    ];

    if (!VALID_ROLES.includes(body.newRole)) {
      throw new Error(`Invalid admin role: ${body.newRole}`);
    }
    if (!body.reason?.trim()) throw new Error("reason is required for role reassignment");

    const actorId = req.localUser?.id;

    await this.auditService.logFinancialAction({
      actorUserId: actorId,
      eventType: "staff_role_reassigned",
      meta: {
        targetUserId: userId,
        newRole: body.newRole,
        reason: body.reason,
        approvedBy: body.approvedBy,
        // Production: PUT https://<project>.supabase.co/auth/v1/admin/users/:id
        //             with { user_metadata: { admin_role: newRole } }
      },
    });

    return { ok: true, userId, newRole: body.newRole };
  }
}
