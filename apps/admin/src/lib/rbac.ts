/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * KobKlein — Institutional RBAC Permission Matrix
 * 10 Roles × 35 Granular Permissions
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Governance principles enforced here:
 *  1. Least Privilege — every role has the minimum permissions required
 *  2. Separation of Duties — no single role can initiate + approve + execute
 *  3. Dual-Control — high-risk actions require two different roles to complete
 *  4. Immutable Audit — no role can delete or modify audit logs
 *  5. No Self-Approval — a user cannot approve their own initiated action
 *
 * Files that reference this matrix:
 *  - apps/admin/src/lib/admin-role.ts     (page-level ACL)
 *  - apps/api/src/policies/permissions.guard.ts  (backend enforcement)
 *  - apps/admin/docs/COMPLIANCE_RBAC.md   (regulatory documentation)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { AdminRole } from "./admin-role";

// ─── Permission Registry ──────────────────────────────────────────────────────

export const Permission = {
  // ── USER MANAGEMENT ──────────────────────────────────────────────────────
  USER_READ:              "user:read",
  USER_WRITE:             "user:write",           // edit profile fields
  USER_FREEZE:            "user:freeze",           // temporary account freeze (DUAL-CONTROL)
  USER_FREEZE_PERMANENT:  "user:freeze_permanent", // compliance-only permanent freeze
  USER_DELETE:            "user:delete",           // super_admin only (DUAL-CONTROL w/ compliance)
  USER_ROLE_ASSIGN:       "user:role_assign",      // assign app roles (merchant, distributor...)
  USER_CREATE_STAFF:      "user:create_staff",     // create admin/staff accounts

  // ── KYC / IDENTITY ───────────────────────────────────────────────────────
  KYC_READ:               "kyc:read",
  KYC_APPROVE_BASIC:      "kyc:approve_basic",     // low-risk KYC
  KYC_APPROVE_HIGH_RISK:  "kyc:approve_high_risk", // compliance_officer + super_admin only
  KYC_REJECT:             "kyc:reject",
  KYC_OVERRIDE:           "kyc:override",          // override previous decision (compliance only)

  // ── TRANSACTIONS ─────────────────────────────────────────────────────────
  TX_READ:                "tx:read",
  TX_APPROVE:             "tx:approve",            // approve pending transactions (DUAL-CONTROL for large)
  TX_REVERSE:             "tx:reverse",            // reverse completed transaction (super_admin only, DUAL-CONTROL)
  TX_FLAG:                "tx:flag",               // flag as suspicious
  TX_EXPORT:              "tx:export",

  // ── WALLET ───────────────────────────────────────────────────────────────
  WALLET_READ:            "wallet:read",
  WALLET_ADJUST:          "wallet:adjust",         // manual balance adjustment (DUAL-CONTROL)

  // ── FLOAT / TREASURY ─────────────────────────────────────────────────────
  FLOAT_READ:             "float:read",
  FLOAT_ADJUST:           "float:adjust",          // DUAL-CONTROL required
  FLOAT_TRANSFER:         "float:transfer",        // DUAL-CONTROL required (≥100k HTG)

  // ── FX CONTROL ───────────────────────────────────────────────────────────
  FX_READ:                "fx:read",
  FX_ADJUST:              "fx:adjust",             // treasury_officer + super_admin, DUAL-CONTROL

  // ── MERCHANT / AGENT ─────────────────────────────────────────────────────
  MERCHANT_READ:          "merchant:read",
  MERCHANT_APPROVE:       "merchant:approve",
  MERCHANT_SUSPEND:       "merchant:suspend",
  AGENT_READ:             "agent:read",
  AGENT_APPROVE:          "agent:approve",
  AGENT_SUSPEND:          "agent:suspend",

  // ── FEES & LIMITS ────────────────────────────────────────────────────────
  FEES_READ:              "fees:read",
  FEES_ADJUST:            "fees:adjust",           // treasury_officer + super_admin, DUAL-CONTROL
  LIMITS_READ:            "limits:read",
  LIMITS_ADJUST:          "limits:adjust",         // DUAL-CONTROL: treasury_officer + super_admin
  LIMITS_PROPOSE:         "limits:propose",        // admin can propose but not execute

  // ── SETTLEMENTS ──────────────────────────────────────────────────────────
  SETTLEMENT_READ:        "settlement:read",
  SETTLEMENT_RELEASE:     "settlement:release",    // treasury_officer + super_admin, DUAL-CONTROL
  SETTLEMENT_DELAY:       "settlement:delay",

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────
  NOTIF_READ:             "notif:read",
  NOTIF_SEND_DIRECT:      "notif:send_direct",     // 1:1 message to user
  NOTIF_SEND_SEGMENT:     "notif:send_segment",    // segmented campaign (region or role)
  NOTIF_SEND_GLOBAL:      "notif:send_global",     // DUAL-CONTROL: broadcaster + admin approval
  NOTIF_APPROVE:          "notif:approve",         // approve global broadcast request
  NOTIF_CONFIG:           "notif:config",          // template management

  // ── AUDIT ────────────────────────────────────────────────────────────────
  AUDIT_READ:             "audit:read",
  AUDIT_EXPORT:           "audit:export",
  // NOTE: audit:delete is NEVER granted to any role — logs are immutable

  // ── ANALYTICS ────────────────────────────────────────────────────────────
  ANALYTICS_READ:         "analytics:read",
  ANALYTICS_EXPORT:       "analytics:export",

  // ── COMPLIANCE / AML ─────────────────────────────────────────────────────
  COMPLIANCE_READ:        "compliance:read",
  COMPLIANCE_CONFIGURE:   "compliance:configure",  // compliance_officer + super_admin only
  COMPLIANCE_FILE_SAR:    "compliance:file_sar",   // file Suspicious Activity Report
  COMPLIANCE_VIEW_PEP:    "compliance:view_pep",   // view Politically Exposed Persons
  COMPLIANCE_SET_THRESH:  "compliance:set_thresholds", // SAR/AML thresholds

  // ── RISK ─────────────────────────────────────────────────────────────────
  RISK_READ:              "risk:read",
  RISK_FLAG:              "risk:flag",
  RISK_RESOLVE:           "risk:resolve",
  RISK_SET_THRESHOLDS:    "risk:set_thresholds",   // super_admin only
  RISK_TUNE_MODEL:        "risk:tune_model",       // super_admin only

  // ── SYSTEM ───────────────────────────────────────────────────────────────
  SYSTEM_CONFIG:          "system:config",         // super_admin only
  SYSTEM_RATE_LIMIT:      "system:rate_limit",
  SYSTEM_KEY_ROTATION:    "system:key_rotation",
  SYSTEM_IP_WHITELIST:    "system:ip_whitelist",
  SYSTEM_FEATURE_FLAGS:   "system:feature_flags",
  SYSTEM_ADMIN_CREATE:    "system:admin_create",
  SYSTEM_ADMIN_DELETE:    "system:admin_delete",   // super_admin only

  // ── EMERGENCY CONTROLS ───────────────────────────────────────────────────
  EMERGENCY_GLOBAL_FREEZE:   "emergency:global_freeze",   // super_admin only
  EMERGENCY_REGION_FREEZE:   "emergency:region_freeze",
  EMERGENCY_NETWORK_FREEZE:  "emergency:network_freeze",
  EMERGENCY_FX_HALT:         "emergency:fx_halt",
  EMERGENCY_PAYOUT_FREEZE:   "emergency:payout_freeze",
  EMERGENCY_BROADCAST_LOCK:  "emergency:broadcast_lock",

  // ── TRAINING ─────────────────────────────────────────────────────────────
  TRAINING_READ:          "training:read",
  TRAINING_COMPLETE:      "training:complete",
  TRAINING_ASSIGN:        "training:assign",
  TRAINING_CREATE:        "training:create",       // super_admin only
  TRAINING_SET_MANDATORY: "training:set_mandatory",
  TRAINING_VIEW_REPORTS:  "training:view_reports",

  // ── HR / STAFF GOVERNANCE ────────────────────────────────────────────────
  HR_VIEW_DIRECTORY:      "hr:view_directory",
  HR_CREATE_STAFF:        "hr:create_staff",
  HR_ASSIGN_ROLE:         "hr:assign_role",
  HR_DEACTIVATE:          "hr:deactivate",
  HR_OFFBOARD:            "hr:offboard",
  HR_ACCESS_REVIEW:       "hr:access_review",      // quarterly review of privileged access

  // ── REGIONAL GOVERNANCE ──────────────────────────────────────────────────
  REGION_CREATE:          "region:create",         // super_admin only
  REGION_ASSIGN_MANAGER:  "region:assign_manager",
  REGION_SET_LIMITS:      "region:set_limits",
  REGION_SET_FX_SPREAD:   "region:set_fx_spread",

  // ── INTERNAL CHANNELS (clearance-gated message feed) ──────────────────────
  // Clearance model mirrors: apps/admin/src/components/notifications/notification-hub.tsx
  //   L1 GLOBAL  — all staff                       → l1_read / l1_post
  //   L2 OPS     — admin, regional, treasury, bc    → l2_read / l2_post
  //   L3 SECURE  — compliance_officer + super_admin → l3_read / l3_post
  //   L4 EXEC    — super_admin only                 → l4_read / l4_post
  //   REGIONAL   — super_admin, admin, own-region   → regional_read / regional_post
  CHANNEL_L1_READ:        "channel:l1_read",
  CHANNEL_L1_POST:        "channel:l1_post",
  CHANNEL_L2_READ:        "channel:l2_read",
  CHANNEL_L2_POST:        "channel:l2_post",
  CHANNEL_L3_READ:        "channel:l3_read",
  CHANNEL_L3_POST:        "channel:l3_post",
  CHANNEL_L4_READ:        "channel:l4_read",
  CHANNEL_L4_POST:        "channel:l4_post",
  CHANNEL_REGIONAL_READ:  "channel:regional_read",
  CHANNEL_REGIONAL_POST:  "channel:regional_post",
  CHANNEL_READ_LOG:       "channel:read_log",       // super_admin only
} as const;

export type PermissionKey = typeof Permission[keyof typeof Permission];

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE → PERMISSIONS MAP
// ═══════════════════════════════════════════════════════════════════════════════

export const ROLE_PERMISSIONS: Record<AdminRole, Set<PermissionKey>> = {

  // ─── SUPER ADMIN ──────────────────────────────────────────────────────────
  // Governance authority. Initiates OR approves dual-control actions.
  // Cannot: delete audit logs, approve own actions.
  super_admin: new Set(Object.values(Permission) as PermissionKey[]),

  // ─── OPERATIONS ADMIN ─────────────────────────────────────────────────────
  // Platform operations supervisor. Restricted to operational scope only.
  // Removed: FX, fees, limits, system config, emergency, HR governance.
  admin: new Set([
    Permission.USER_READ, Permission.USER_WRITE, Permission.USER_FREEZE,
    Permission.USER_ROLE_ASSIGN,
    Permission.KYC_READ, Permission.KYC_APPROVE_BASIC, Permission.KYC_REJECT,
    Permission.TX_READ, Permission.TX_APPROVE, Permission.TX_FLAG, Permission.TX_EXPORT,
    Permission.WALLET_READ,
    Permission.FLOAT_READ,
    Permission.FX_READ,
    Permission.MERCHANT_READ, Permission.MERCHANT_APPROVE, Permission.MERCHANT_SUSPEND,
    Permission.AGENT_READ, Permission.AGENT_APPROVE, Permission.AGENT_SUSPEND,
    Permission.FEES_READ,
    Permission.LIMITS_READ, Permission.LIMITS_PROPOSE,
    Permission.SETTLEMENT_READ,
    Permission.NOTIF_READ, Permission.NOTIF_SEND_SEGMENT, Permission.NOTIF_APPROVE,
    Permission.AUDIT_READ,
    Permission.ANALYTICS_READ, Permission.ANALYTICS_EXPORT,
    Permission.COMPLIANCE_READ,
    Permission.RISK_READ, Permission.RISK_FLAG,
    Permission.TRAINING_READ, Permission.TRAINING_ASSIGN,
    Permission.HR_VIEW_DIRECTORY,
    Permission.SYSTEM_ADMIN_CREATE,
    // Internal channels — L1 + L2 + regional read/post
    Permission.CHANNEL_L1_READ, Permission.CHANNEL_L1_POST,
    Permission.CHANNEL_L2_READ, Permission.CHANNEL_L2_POST,
    Permission.CHANNEL_REGIONAL_READ, Permission.CHANNEL_REGIONAL_POST,
  ]),

  // ─── REGIONAL MANAGER ─────────────────────────────────────────────────────
  // Region-scoped operations. Backend MUST filter all queries by region_id.
  // Cannot: modify global config, FX, fees, system, treasury.
  regional_manager: new Set([
    Permission.USER_READ, Permission.USER_WRITE, Permission.USER_FREEZE,
    Permission.KYC_READ, Permission.KYC_APPROVE_BASIC, Permission.KYC_REJECT,
    Permission.TX_READ, Permission.TX_APPROVE, Permission.TX_FLAG, Permission.TX_EXPORT,
    Permission.WALLET_READ,
    Permission.FLOAT_READ,
    Permission.FX_READ,
    Permission.MERCHANT_READ, Permission.MERCHANT_APPROVE, Permission.MERCHANT_SUSPEND,
    Permission.AGENT_READ, Permission.AGENT_APPROVE, Permission.AGENT_SUSPEND,
    Permission.FEES_READ,
    Permission.LIMITS_READ,
    Permission.SETTLEMENT_READ,
    Permission.NOTIF_READ, Permission.NOTIF_SEND_DIRECT, Permission.NOTIF_SEND_SEGMENT,
    Permission.AUDIT_READ,
    Permission.ANALYTICS_READ,
    Permission.COMPLIANCE_READ,
    Permission.RISK_READ, Permission.RISK_FLAG, Permission.RISK_RESOLVE,
    Permission.TRAINING_READ,
    // Internal channels — L1 + L2 read; regional read/post (own region only)
    Permission.CHANNEL_L1_READ, Permission.CHANNEL_L1_POST,
    Permission.CHANNEL_L2_READ,
    Permission.CHANNEL_REGIONAL_READ, Permission.CHANNEL_REGIONAL_POST,
  ]),

  // ─── SUPPORT AGENT ────────────────────────────────────────────────────────
  // VIEW + FREEZE + ESCALATE only.
  // No: approvals, financial modifications, compliance override, broadcast.
  support_agent: new Set([
    Permission.USER_READ,
    Permission.KYC_READ, Permission.KYC_APPROVE_BASIC, Permission.KYC_REJECT,
    Permission.TX_READ, Permission.TX_FLAG,
    Permission.WALLET_READ,
    Permission.MERCHANT_READ,
    Permission.AGENT_READ,
    Permission.FEES_READ,
    Permission.LIMITS_READ,
    Permission.NOTIF_READ, Permission.NOTIF_SEND_DIRECT,
    Permission.COMPLIANCE_READ,
    Permission.RISK_READ, Permission.RISK_FLAG,
    Permission.TRAINING_READ, Permission.TRAINING_COMPLETE,
    // Internal channels — Global only (read + post for customer-facing alerts)
    Permission.CHANNEL_L1_READ, Permission.CHANNEL_L1_POST,
  ]),

  // ─── COMPLIANCE OFFICER ───────────────────────────────────────────────────
  // Independent AML/KYC authority. Higher than admin for compliance actions.
  // Cannot: modify financial config, FX, fees, treasury, emergency controls.
  compliance_officer: new Set([
    Permission.USER_READ, Permission.USER_FREEZE, Permission.USER_FREEZE_PERMANENT,
    Permission.KYC_READ, Permission.KYC_APPROVE_BASIC, Permission.KYC_APPROVE_HIGH_RISK,
    Permission.KYC_REJECT, Permission.KYC_OVERRIDE,
    Permission.TX_READ, Permission.TX_FLAG, Permission.TX_EXPORT,
    Permission.WALLET_READ,
    Permission.FLOAT_READ,
    Permission.FX_READ,
    Permission.MERCHANT_READ, Permission.MERCHANT_SUSPEND,
    Permission.AGENT_READ, Permission.AGENT_SUSPEND,
    Permission.FEES_READ,
    Permission.LIMITS_READ,
    Permission.SETTLEMENT_READ,
    Permission.NOTIF_READ, Permission.NOTIF_SEND_DIRECT,
    Permission.AUDIT_READ, Permission.AUDIT_EXPORT,
    Permission.ANALYTICS_READ, Permission.ANALYTICS_EXPORT,
    Permission.COMPLIANCE_READ, Permission.COMPLIANCE_CONFIGURE,
    Permission.COMPLIANCE_FILE_SAR, Permission.COMPLIANCE_VIEW_PEP,
    Permission.COMPLIANCE_SET_THRESH,
    Permission.RISK_READ, Permission.RISK_FLAG, Permission.RISK_RESOLVE,
    Permission.TRAINING_READ, Permission.TRAINING_ASSIGN, Permission.TRAINING_SET_MANDATORY,
    Permission.TRAINING_VIEW_REPORTS,
    Permission.HR_VIEW_DIRECTORY,
    // Internal channels — L1 global + L3 compliance (read + post)
    Permission.CHANNEL_L1_READ, Permission.CHANNEL_L1_POST,
    Permission.CHANNEL_L3_READ, Permission.CHANNEL_L3_POST,
  ]),

  // ─── TREASURY OFFICER ─────────────────────────────────────────────────────
  // Finance-only scope. Float, FX, settlements, fees, limits.
  // Cannot: user management, compliance override, system config, HR.
  treasury_officer: new Set([
    Permission.USER_READ,
    Permission.KYC_READ,
    Permission.TX_READ, Permission.TX_APPROVE, Permission.TX_EXPORT,
    Permission.WALLET_READ, Permission.WALLET_ADJUST,
    Permission.FLOAT_READ, Permission.FLOAT_ADJUST, Permission.FLOAT_TRANSFER,
    Permission.FX_READ, Permission.FX_ADJUST,
    Permission.MERCHANT_READ,
    Permission.AGENT_READ,
    Permission.FEES_READ, Permission.FEES_ADJUST,
    Permission.LIMITS_READ, Permission.LIMITS_ADJUST,
    Permission.SETTLEMENT_READ, Permission.SETTLEMENT_RELEASE, Permission.SETTLEMENT_DELAY,
    Permission.NOTIF_READ,
    Permission.AUDIT_READ,
    Permission.ANALYTICS_READ, Permission.ANALYTICS_EXPORT,
    Permission.COMPLIANCE_READ,
    Permission.RISK_READ,
    Permission.TRAINING_READ, Permission.TRAINING_COMPLETE,
    Permission.HR_VIEW_DIRECTORY,
    // Internal channels — L1 global read + L2 ops read (treasury alerts)
    Permission.CHANNEL_L1_READ,
    Permission.CHANNEL_L2_READ, Permission.CHANNEL_L2_POST,
  ]),

  // ─── HR MANAGER ───────────────────────────────────────────────────────────
  // Staff governance only. People lifecycle: create, assign, deactivate, offboard.
  // Cannot: operational access, financial data, compliance override.
  hr_manager: new Set([
    Permission.NOTIF_READ, Permission.NOTIF_SEND_DIRECT,
    Permission.AUDIT_READ,
    Permission.TRAINING_READ, Permission.TRAINING_ASSIGN,
    Permission.TRAINING_VIEW_REPORTS,
    Permission.HR_VIEW_DIRECTORY, Permission.HR_CREATE_STAFF,
    Permission.HR_ASSIGN_ROLE, Permission.HR_DEACTIVATE,
    Permission.HR_OFFBOARD, Permission.HR_ACCESS_REVIEW,
    // Internal channels — Global only (HR announcements)
    Permission.CHANNEL_L1_READ, Permission.CHANNEL_L1_POST,
  ]),

  // ─── INVESTOR / PARTNER ───────────────────────────────────────────────────
  // Aggregated metrics only. No PII, no operations, no modifications.
  // Data must be anonymized at the API layer.
  // No channel access — investor portal is separate from staff messaging.
  investor: new Set([
    Permission.ANALYTICS_READ, Permission.ANALYTICS_EXPORT,
    Permission.FLOAT_READ,
    Permission.FX_READ,
    Permission.TRAINING_READ,
  ]),

  // ─── AUDITOR ──────────────────────────────────────────────────────────────
  // External independent read-only. Full audit trail access + export.
  // Cannot: approve, modify, send, or execute any state change.
  auditor: new Set([
    Permission.USER_READ,
    Permission.KYC_READ,
    Permission.TX_READ, Permission.TX_EXPORT,
    Permission.WALLET_READ,
    Permission.FLOAT_READ,
    Permission.FX_READ,
    Permission.MERCHANT_READ,
    Permission.AGENT_READ,
    Permission.FEES_READ,
    Permission.LIMITS_READ,
    Permission.SETTLEMENT_READ,
    Permission.AUDIT_READ, Permission.AUDIT_EXPORT,
    Permission.ANALYTICS_READ, Permission.ANALYTICS_EXPORT,
    Permission.COMPLIANCE_READ, Permission.COMPLIANCE_VIEW_PEP,
    Permission.RISK_READ,
    Permission.TRAINING_READ,
    Permission.HR_VIEW_DIRECTORY,
    // Internal channels — Global read only (external auditor; no posting, no ops)
    Permission.CHANNEL_L1_READ,
  ]),

  // ─── BROADCASTER ──────────────────────────────────────────────────────────
  // Notification hub only. Cannot see financial data or user PII.
  // Global broadcasts require dual-control approval from admin.
  broadcaster: new Set([
    Permission.NOTIF_READ,
    Permission.NOTIF_SEND_DIRECT,
    Permission.NOTIF_SEND_SEGMENT,
    Permission.NOTIF_SEND_GLOBAL,     // triggers approval workflow — not auto-execute
    Permission.NOTIF_CONFIG,
    Permission.TRAINING_READ, Permission.TRAINING_COMPLETE,
    // Internal channels — L1 global + L2 ops (broadcaster posts announcements)
    Permission.CHANNEL_L1_READ, Permission.CHANNEL_L1_POST,
    Permission.CHANNEL_L2_READ, Permission.CHANNEL_L2_POST,
  ]),
};

// ═══════════════════════════════════════════════════════════════════════════════
// DUAL-CONTROL ACTION REGISTRY
// Actions that require a SECOND approver from a DIFFERENT role.
// ═══════════════════════════════════════════════════════════════════════════════

export const DUAL_CONTROL_ACTIONS: {
  permission: PermissionKey;
  description: string;
  initiators: AdminRole[];
  approvers: AdminRole[];    // must be different person from a different role
  threshold?: string;        // monetary threshold if applicable
}[] = [
  {
    permission: Permission.USER_FREEZE,
    description: "Temporary account freeze",
    initiators: ["admin", "regional_manager", "compliance_officer"],
    approvers:  ["super_admin", "admin", "compliance_officer"],
  },
  {
    permission: Permission.USER_FREEZE_PERMANENT,
    description: "Permanent account freeze",
    initiators: ["compliance_officer"],
    approvers:  ["super_admin"],
  },
  {
    permission: Permission.USER_DELETE,
    description: "Permanent user deletion — requires auditor counter-sign",
    initiators: ["super_admin"],
    approvers:  ["auditor"],
  },
  {
    permission: Permission.KYC_APPROVE_HIGH_RISK,
    description: "Approve high-risk / PEP / flagged KYC identity",
    initiators: ["compliance_officer"],
    approvers:  ["super_admin"],
  },
  {
    permission: Permission.TX_REVERSE,
    description: "Reverse completed transaction",
    initiators: ["super_admin"],
    approvers:  ["compliance_officer"],
  },
  {
    permission: Permission.WALLET_ADJUST,
    description: "Manual wallet balance adjustment",
    initiators: ["treasury_officer"],
    approvers:  ["super_admin"],
  },
  {
    permission: Permission.FLOAT_ADJUST,
    description: "Manual float balance adjustment",
    initiators: ["treasury_officer"],
    approvers:  ["super_admin"],
  },
  {
    permission: Permission.FLOAT_TRANSFER,
    description: "Float pool transfer",
    threshold:  "≥ 100,000 HTG",
    initiators: ["treasury_officer"],
    approvers:  ["super_admin"],
  },
  {
    permission: Permission.FX_ADJUST,
    description: "FX rate modification",
    initiators: ["treasury_officer"],
    approvers:  ["super_admin"],
  },
  {
    permission: Permission.FEES_ADJUST,
    description: "Merchant fee schedule change",
    initiators: ["treasury_officer"],
    approvers:  ["super_admin"],
  },
  {
    permission: Permission.LIMITS_ADJUST,
    description: "Transaction limit modification",
    initiators: ["treasury_officer"],
    approvers:  ["super_admin"],
  },
  {
    permission: Permission.SETTLEMENT_RELEASE,
    description: "Release held settlement funds",
    initiators: ["treasury_officer"],
    approvers:  ["super_admin"],
  },
  {
    permission: Permission.NOTIF_SEND_GLOBAL,
    description: "Platform-wide broadcast notification",
    initiators: ["broadcaster", "admin"],
    approvers:  ["super_admin", "admin"],
  },
  {
    permission: Permission.EMERGENCY_GLOBAL_FREEZE,
    description: "Global platform transaction freeze",
    initiators: ["super_admin"],
    approvers:  ["super_admin"],   // requires 2 super admins (break-glass scenario)
  },
  {
    permission: Permission.SYSTEM_CONFIG,
    description: "System configuration change",
    initiators: ["super_admin"],
    approvers:  ["super_admin"],   // + MFA re-authentication required
  },
];

// ─── GOVERNANCE RULES (documented constraints) ────────────────────────────────

export const GOVERNANCE_RULES = {
  AUDIT_LOG_IMMUTABLE: "No role may delete or modify audit log entries",
  NO_SELF_APPROVAL:    "A user cannot approve their own initiated dual-control action",
  ADMIN_NOT_POLICY:    "Admin is operations supervisor, not governance authority. Cannot modify FX, fees, limits, or system config",
  REGIONAL_SCOPED:     "All regional_manager queries must be filtered by region_id in the backend",
  INVESTOR_ANONYMIZED: "All investor dashboard data must be aggregated and stripped of PII",
  TRAINING_MANDATORY:  "Staff cannot access sensitive pages until mandatory training is complete",
  BREAK_GLASS:         "Emergency account (root@kobklein.com) offline only, dual-approval to activate",
  NO_SHARED_ACCOUNTS:  "Every human must have a unique personal account. Shared logins are prohibited",
  SESSION_TIMEOUT:     "All admin sessions expire after 30 minutes of inactivity",
  MFA_REQUIRED:        "MFA mandatory for all roles with write permissions",
  CHANNEL_COMPARTMENTALIZED:
    "Internal channels are clearance-gated. Restricted channels are VISIBLE to all staff but " +
    "show an 'Access Restricted' notice. EVERY access attempt (allowed or denied) is permanently " +
    "audit-logged with actor identity, timestamp, and IP.",
} as const;

// ─── Utility helpers ──────────────────────────────────────────────────────────

export function hasPermission(role: AdminRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function getPermissions(role: AdminRole): PermissionKey[] {
  return Array.from(ROLE_PERMISSIONS[role] ?? []);
}

export function isDualControl(permission: PermissionKey): boolean {
  return DUAL_CONTROL_ACTIONS.some((a) => a.permission === permission);
}

export function canInitiate(role: AdminRole, permission: PermissionKey): boolean {
  const action = DUAL_CONTROL_ACTIONS.find((a) => a.permission === permission);
  if (!action) return hasPermission(role, permission);
  return action.initiators.includes(role);
}

export function canApprove(role: AdminRole, permission: PermissionKey): boolean {
  const action = DUAL_CONTROL_ACTIONS.find((a) => a.permission === permission);
  if (!action) return false;
  return action.approvers.includes(role);
}
