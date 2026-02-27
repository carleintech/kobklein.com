/**
 * ─────────────────────────────────────────────────────────────────────────────
 * KobKlein — Role-Based Permission Matrix
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Single source of truth for which roles access which endpoint groups.
 * Usage: @Roles(...Permissions.MERCHANT)
 *        @Roles(...Permissions.ADMIN)          ← any admin sub-role
 *        @Roles(...Permissions.AUDIT_ADMIN)    ← auditor + admin + super_admin
 *
 * Admin sub-roles (all satisfy @Roles("admin") via ADMIN_FAMILY in roles.guard):
 *   super_admin · admin · regional_manager · support_agent ·
 *   investor · auditor · broadcaster
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const Role = {
  user:             "user",
  diaspora:         "diaspora",
  merchant:         "merchant",
  distributor:      "distributor",
  admin:            "admin",
  // Admin sub-roles (all satisfy "admin" in ADMIN_FAMILY guard logic)
  super_admin:      "super_admin",
  regional_manager: "regional_manager",
  support_agent:    "support_agent",
  investor:         "investor",
  auditor:          "auditor",
  broadcaster:      "broadcaster",
} as const;

export const Permissions = {
  // ── App-level role groups ──────────────────────────────────────────────

  /** Admin endpoints — any admin sub-role satisfies this via ADMIN_FAMILY */
  ADMIN: ["admin"],

  /** Merchant endpoints (merchants + admin) */
  MERCHANT: ["merchant", "admin"],

  /** Distributor/agent endpoints (distributors + admin) */
  DISTRIBUTOR: ["distributor", "admin"],

  /** Diaspora endpoints (diaspora + admin) */
  DIASPORA: ["diaspora", "admin"],

  /** Regular user endpoints (users + admin) */
  USER: ["user", "admin"],

  /** Shared: any authenticated user with wallet (users + diaspora + admin) */
  WALLET_USER: ["user", "diaspora", "admin"],

  /** Shared: any role can access (no role restriction) */
  ANY: [] as string[],

  // ── Admin sub-role specific groups ────────────────────────────────────

  /**
   * Endpoints that ONLY super_admin or admin can reach.
   * Regional managers, support agents, etc. are excluded.
   */
  SENIOR_ADMIN: ["super_admin", "admin"],

  /**
   * Endpoints requiring super_admin exclusively (system config, user delete).
   */
  SUPER_ADMIN_ONLY: ["super_admin"],

  /**
   * Audit trail endpoints — auditors + all admin levels.
   */
  AUDIT_ADMIN: ["auditor", "super_admin", "admin", "regional_manager"],

  /**
   * Compliance endpoints — regional managers + senior admins + auditors.
   */
  COMPLIANCE: ["super_admin", "admin", "regional_manager", "auditor"],

  /**
   * Notification management — broadcasters + senior admins.
   */
  BROADCAST: ["broadcaster", "super_admin", "admin", "regional_manager"],

  /**
   * Analytics / reporting — investors + auditors + admin levels.
   */
  ANALYTICS: ["investor", "auditor", "super_admin", "admin", "regional_manager"],

  /**
   * KYC approval — regional managers + senior admins (NOT support agents).
   */
  KYC_APPROVERS: ["super_admin", "admin", "regional_manager"],

  /**
   * Float management — senior admins only (dual-control enforced in service layer).
   */
  FLOAT_MANAGERS: ["super_admin", "admin"],

  /**
   * Training portal — all roles can read training content.
   */
  TRAINING: [
    "super_admin", "admin", "regional_manager", "support_agent",
    "investor", "auditor", "broadcaster",
    "user", "merchant", "distributor", "diaspora",
  ],
} as const;
