/**
 * PermissionsGuard
 *
 * Enforces granular permission checks defined via @RequiresPermission().
 * Must run AFTER SupabaseGuard (so req.user is populated) and RolesGuard.
 *
 * The RBAC permission matrix mirrors apps/admin/src/lib/rbac.ts — keep in sync.
 *
 * Usage:
 *   @UseGuards(SupabaseGuard, RolesGuard, PermissionsGuard)
 *   @Roles(...Permissions.ADMIN)
 *   @RequiresPermission("kyc:approve")
 *   async approveKyc() {}
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "./permissions.decorator";

// ─── Backend RBAC permission matrix ──────────────────────────────────────────
// Mirrors apps/admin/src/lib/rbac.ts — update both together.

const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  super_admin: new Set([
    "user:read", "user:write", "user:freeze", "user:delete", "user:role_assign",
    "kyc:read", "kyc:approve", "kyc:reject",
    "tx:read", "tx:approve", "tx:reverse", "tx:flag", "tx:export",
    "wallet:read", "wallet:adjust",
    "float:read", "float:adjust", "float:transfer",
    "merchant:read", "merchant:approve", "merchant:suspend",
    "agent:read", "agent:approve", "agent:suspend",
    "notif:read", "notif:send", "notif:config",
    "audit:read", "audit:export",
    "analytics:read", "analytics:export",
    "system:config", "system:admin_create", "system:admin_delete",
    "training:read", "training:manage",
    "risk:read", "risk:flag", "risk:resolve",
    "limits:read", "limits:adjust",
    // Internal channels — full access (all 4 levels + regional + read_log)
    "channel:l1_read", "channel:l1_post",
    "channel:l2_read", "channel:l2_post",
    "channel:l3_read", "channel:l3_post",
    "channel:l4_read", "channel:l4_post",
    "channel:regional_read", "channel:regional_post",
    "channel:read_log",
  ]),

  admin: new Set([
    "user:read", "user:write", "user:freeze", "user:role_assign",
    "kyc:read", "kyc:approve", "kyc:reject",
    "tx:read", "tx:approve", "tx:flag", "tx:export",
    "wallet:read", "wallet:adjust",
    "float:read", "float:adjust", "float:transfer",
    "merchant:read", "merchant:approve", "merchant:suspend",
    "agent:read", "agent:approve", "agent:suspend",
    "notif:read", "notif:send", "notif:config",
    "audit:read", "audit:export",
    "analytics:read", "analytics:export",
    "system:admin_create",
    "training:read", "training:manage",
    "risk:read", "risk:flag", "risk:resolve",
    "limits:read", "limits:adjust",
    // Internal channels — L1 + L2 + all regional
    "channel:l1_read", "channel:l1_post",
    "channel:l2_read", "channel:l2_post",
    "channel:regional_read", "channel:regional_post",
  ]),

  regional_manager: new Set([
    "user:read", "user:write", "user:freeze",
    "kyc:read", "kyc:approve", "kyc:reject",
    "tx:read", "tx:approve", "tx:flag", "tx:export",
    "wallet:read",
    "float:read",
    "merchant:read", "merchant:approve", "merchant:suspend",
    "agent:read", "agent:approve", "agent:suspend",
    "notif:read", "notif:send",
    "audit:read",
    "analytics:read",
    "training:read",
    "risk:read", "risk:flag", "risk:resolve",
    "limits:read",
    // Internal channels — L1 + L2 read; regional read/post (own region enforced by controller)
    "channel:l1_read", "channel:l1_post",
    "channel:l2_read",
    "channel:regional_read", "channel:regional_post",
  ]),

  support_agent: new Set([
    "user:read",
    "kyc:read",
    "tx:read", "tx:flag",
    "wallet:read",
    "merchant:read",
    "agent:read",
    "notif:read",
    "training:read",
    "risk:read", "risk:flag",
    // Internal channels — Global only
    "channel:l1_read", "channel:l1_post",
  ]),

  investor: new Set([
    "analytics:read",
    "analytics:export",
    "float:read",
    "training:read",
  ]),

  auditor: new Set([
    "user:read",
    "kyc:read",
    "tx:read", "tx:export",
    "wallet:read",
    "float:read",
    "merchant:read",
    "agent:read",
    "audit:read", "audit:export",
    "analytics:read", "analytics:export",
    "risk:read",
    "limits:read",
    // Internal channels — Global read-only (no post — external auditor)
    "channel:l1_read",
  ]),

  compliance_officer: new Set([
    "user:read",
    "kyc:read", "kyc:approve", "kyc:approve_high_risk", "kyc:reject", "kyc:flag",
    "tx:read", "tx:flag", "tx:export",
    "wallet:read",
    "float:read",
    "merchant:read",
    "agent:read",
    "audit:read", "audit:export",
    "analytics:read", "analytics:export",
    "compliance:read", "compliance:write", "compliance:report",
    "risk:read", "risk:flag", "risk:resolve",
    "notif:read",
    "training:read",
    // Internal channels — L1 global + L3 compliance (AML/SAR/KYC feeds)
    "channel:l1_read", "channel:l1_post",
    "channel:l3_read", "channel:l3_post",
  ]),

  treasury_officer: new Set([
    "float:read", "float:adjust", "float:transfer",
    "fx:read", "fx:configure",
    "limits:read", "limits:adjust",
    "fees:read", "fees:configure",
    "settlement:read", "settlement:approve",
    "analytics:read", "analytics:export",
    "audit:read",
    "training:read",
    // Internal channels — L1 global read + L2 ops (float/FX/settlement alerts)
    "channel:l1_read",
    "channel:l2_read", "channel:l2_post",
  ]),

  hr_manager: new Set([
    "hr:read", "hr:write", "hr:role_assign", "hr:offboard",
    "audit:read",
    "training:read", "training:manage",
    // Internal channels — Global only (HR announcements, onboarding notices)
    "channel:l1_read", "channel:l1_post",
  ]),

  broadcaster: new Set([
    "notif:read",
    "notif:send",
    "notif:config",
    "training:read",
    // Internal channels — L1 global + L2 ops (broadcast announcements)
    "channel:l1_read", "channel:l1_post",
    "channel:l2_read", "channel:l2_post",
  ]),
};

// ─── Guard ────────────────────────────────────────────────────────────────────

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // No @RequiresPermission() decorator — skip this guard
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    // Resolve the admin sub-role from Supabase JWT metadata
    const role: string =
      user?.user_metadata?.admin_role ||
      user?.user_metadata?.role ||
      req.localUser?.role ||
      user?.["https://kobklein.com/admin_role"] ||
      user?.["https://kobklein.com/role"] ||
      user?.role;

    if (!role) {
      throw new ForbiddenException("No role in token");
    }

    const rolePermissions = ROLE_PERMISSIONS[role];
    if (!rolePermissions) {
      throw new ForbiddenException(`Unknown role: ${role}`);
    }

    const missing = required.filter((p) => !rolePermissions.has(p));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Insufficient permissions. Missing: ${missing.join(", ")}`,
      );
    }

    return true;
  }
}
