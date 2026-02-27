/**
 * Shared admin role type for the API layer.
 * Mirrors apps/admin/src/lib/admin-role.ts
 */
export type AdminRole =
  | "super_admin"
  | "admin"
  | "regional_manager"
  | "support_agent"
  | "compliance_officer"
  | "treasury_officer"
  | "hr_manager"
  | "investor"
  | "auditor"
  | "broadcaster";
