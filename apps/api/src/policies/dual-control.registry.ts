/**
 * Dual-Control Action Registry
 *
 * Defines which permissions require a second approver.
 * Mirrors DUAL_CONTROL_ACTIONS in apps/admin/src/lib/rbac.ts — keep in sync.
 *
 * Rules:
 *  - initiators: roles that can START this action
 *  - approvers:  roles that can APPROVE this action (must be different person)
 *  - threshold:  monetary threshold if applicable
 */

import type { AdminRole } from "./types";

export interface DualControlAction {
  permission: string;
  description: string;
  initiators: AdminRole[];
  approvers:  AdminRole[];
  threshold?: string;
}

export const DUAL_CONTROL_ACTIONS: DualControlAction[] = [
  {
    permission:  "user:freeze",
    description: "Temporary account freeze",
    initiators:  ["admin", "regional_manager", "compliance_officer"],
    approvers:   ["super_admin", "admin", "compliance_officer"],
  },
  {
    permission:  "user:freeze_permanent",
    description: "Permanent account freeze",
    initiators:  ["compliance_officer"],
    approvers:   ["super_admin"],
  },
  {
    permission:  "user:delete",
    description: "Permanent user deletion — requires auditor counter-sign",
    initiators:  ["super_admin"],
    approvers:   ["auditor"],
  },
  {
    permission:  "kyc:approve_high_risk",
    description: "Approve high-risk / PEP / flagged KYC identity",
    initiators:  ["compliance_officer"],
    approvers:   ["super_admin"],
  },
  {
    permission:  "tx:reverse",
    description: "Reverse completed transaction",
    initiators:  ["super_admin"],
    approvers:   ["compliance_officer"],
  },
  {
    permission:  "wallet:adjust",
    description: "Manual wallet balance adjustment",
    initiators:  ["treasury_officer"],
    approvers:   ["super_admin"],
  },
  {
    permission:  "float:adjust",
    description: "Manual float balance adjustment",
    initiators:  ["treasury_officer"],
    approvers:   ["super_admin"],
  },
  {
    permission:  "float:transfer",
    description: "Float pool transfer",
    threshold:   "≥ 100,000 HTG",
    initiators:  ["treasury_officer"],
    approvers:   ["super_admin"],
  },
  {
    permission:  "fx:adjust",
    description: "FX rate modification",
    initiators:  ["treasury_officer"],
    approvers:   ["super_admin"],
  },
  {
    permission:  "fees:adjust",
    description: "Merchant fee schedule change",
    initiators:  ["treasury_officer"],
    approvers:   ["super_admin"],
  },
  {
    permission:  "limits:adjust",
    description: "Transaction limit modification",
    initiators:  ["treasury_officer"],
    approvers:   ["super_admin"],
  },
  {
    permission:  "settlement:release",
    description: "Release held settlement funds",
    initiators:  ["treasury_officer"],
    approvers:   ["super_admin"],
  },
  {
    permission:  "notif:send_global",
    description: "Platform-wide broadcast notification",
    initiators:  ["broadcaster", "admin"],
    approvers:   ["super_admin", "admin"],
  },
  {
    permission:  "emergency:global_freeze",
    description: "Global platform transaction freeze — break-glass scenario",
    initiators:  ["super_admin"],
    approvers:   ["super_admin"],  // requires 2 super_admin accounts
  },
  {
    permission:  "system:config",
    description: "System configuration change — requires MFA re-auth",
    initiators:  ["super_admin"],
    approvers:   ["super_admin"],
  },
  {
    permission:  "hr:offboard",
    description: "Permanent staff offboarding",
    initiators:  ["hr_manager"],
    approvers:   ["super_admin"],
  },
];
