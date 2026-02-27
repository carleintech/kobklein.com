import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { RolesGuard } from "../policies/roles.guard";
import { Roles } from "../policies/roles.decorator";
import { AuditService } from "../audit/audit.service";

/**
 * Emergency Controls Controller (Phase 49)
 *
 * System-wide kill switches for incident response.
 * ALL actions are permanently audit-logged — cannot be deleted.
 *
 * Accessible to: super_admin ONLY
 *
 * Routes:
 *   GET  /v1/admin/emergency/status         — current state of all controls
 *   POST /v1/admin/emergency/activate       — activate a control
 *   POST /v1/admin/emergency/reverse        — reverse (deactivate) a control
 *   POST /v1/admin/emergency/region-freeze  — region-specific freeze
 *   GET  /v1/admin/emergency/log            — emergency action log
 *
 * Production note:
 *   Store EMERGENCY_STATE in Redis or a dedicated EmergencyControl DB table
 *   so state persists across API restarts and is shared across all instances.
 *   Use Redis pub/sub to broadcast freeze events to other services.
 */

// In-memory state for development — replace with Redis/DB in production
const EMERGENCY_STATE: Record<string, boolean> = {
  global_freeze:  false,
  fx_halt:        false,
  payout_freeze:  false,
  kyc_lockout:    false,
  notif_blackout: false,
  api_readonly:   false,
};

const VALID_CONTROLS = Object.keys(EMERGENCY_STATE);

@Controller("v1/admin/emergency")
@UseGuards(SupabaseGuard, RolesGuard)
@Roles("super_admin")
export class EmergencyController {
  constructor(private auditService: AuditService) {}

  /**
   * GET /v1/admin/emergency/status
   * Returns current state of all emergency controls.
   */
  @Get("status")
  async getStatus() {
    return {
      ok: true,
      controls: EMERGENCY_STATE,
      anyActive: Object.values(EMERGENCY_STATE).some(Boolean),
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * POST /v1/admin/emergency/activate
   * Activate an emergency control.
   * Requires: controlId + reason.
   */
  @Post("activate")
  async activate(
    @Req() req: any,
    @Body() body: { controlId: string; reason: string; regionCode?: string },
  ) {
    if (!VALID_CONTROLS.includes(body.controlId)) {
      throw new Error(`Unknown control: ${body.controlId}. Valid: ${VALID_CONTROLS.join(", ")}`);
    }
    if (!body.reason?.trim()) {
      throw new Error("reason is required for emergency activation");
    }
    if (EMERGENCY_STATE[body.controlId]) {
      throw new Error(`Control ${body.controlId} is already active`);
    }

    const actorId    = req.localUser?.id;
    const actorEmail = req.user?.user_metadata?.email ?? req.user?.email ?? actorId ?? "unknown";
    const activatedAt = new Date().toISOString();

    EMERGENCY_STATE[body.controlId] = true;

    await this.auditService.logFinancialAction({
      actorUserId: actorId,
      eventType: "emergency_control_activated",
      meta: {
        controlId:   body.controlId,
        actor:       actorEmail,
        reason:      body.reason,
        regionCode:  body.regionCode,
        activatedAt,
        // Production: await redis.publish("emergency:activate", JSON.stringify({ controlId }))
      },
    });

    return {
      ok: true,
      controlId:   body.controlId,
      status:      "activated",
      activatedAt,
      activatedBy: actorEmail,
    };
  }

  /**
   * POST /v1/admin/emergency/reverse
   * Reverse (deactivate) an emergency control.
   * Requires: controlId + reason.
   */
  @Post("reverse")
  async reverse(
    @Req() req: any,
    @Body() body: { controlId: string; reason: string },
  ) {
    if (!VALID_CONTROLS.includes(body.controlId)) {
      throw new Error(`Unknown control: ${body.controlId}`);
    }
    if (!body.reason?.trim()) {
      throw new Error("reason is required for emergency reversal");
    }
    if (!EMERGENCY_STATE[body.controlId]) {
      throw new Error(`Control ${body.controlId} is not currently active`);
    }

    const actorId    = req.localUser?.id;
    const actorEmail = req.user?.user_metadata?.email ?? req.user?.email ?? actorId ?? "unknown";
    const reversedAt  = new Date().toISOString();

    EMERGENCY_STATE[body.controlId] = false;

    await this.auditService.logFinancialAction({
      actorUserId: actorId,
      eventType: "emergency_control_reversed",
      meta: {
        controlId:  body.controlId,
        actor:      actorEmail,
        reason:     body.reason,
        reversedAt,
      },
    });

    return {
      ok: true,
      controlId:  body.controlId,
      status:     "reversed",
      reversedAt,
      reversedBy: actorEmail,
    };
  }

  /**
   * POST /v1/admin/emergency/region-freeze
   * Freeze transactions for a specific region.
   * Less disruptive than a global freeze — surgical scope.
   */
  @Post("region-freeze")
  async regionFreeze(
    @Req() req: any,
    @Body() body: { regionCode: string; reason: string; reverse?: boolean },
  ) {
    if (!body.regionCode?.trim()) throw new Error("regionCode is required");
    if (!body.reason?.trim())     throw new Error("reason is required");

    const actorId    = req.localUser?.id;
    const actorEmail = req.user?.user_metadata?.email ?? req.user?.email ?? actorId ?? "unknown";
    const timestamp  = new Date().toISOString();

    await this.auditService.logFinancialAction({
      actorUserId: actorId,
      eventType: body.reverse ? "region_freeze_reversed" : "region_freeze_activated",
      meta: {
        regionCode: body.regionCode,
        actor:      actorEmail,
        reason:     body.reason,
        timestamp,
      },
    });

    return {
      ok:         true,
      regionCode: body.regionCode,
      status:     body.reverse ? "unfrozen" : "frozen",
      timestamp,
      actor:      actorEmail,
    };
  }

  /**
   * GET /v1/admin/emergency/log
   * Returns recent emergency action log entries.
   * Production: filter AuditLog where eventType LIKE 'emergency_%' or 'region_freeze_%'.
   */
  @Get("log")
  async getLog() {
    return {
      ok: true,
      note: "Production query: AuditLog WHERE eventType IN ('emergency_control_activated','emergency_control_reversed','region_freeze_activated','region_freeze_reversed') ORDER BY createdAt DESC LIMIT 100",
    };
  }
}
