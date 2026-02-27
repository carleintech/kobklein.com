// ─── KobKlein Admin Sub-Role System — Institutional Grade ────────────────────
// 10 roles, strict separation of duties, page-level ACL per role.
// Backend enforcement: apps/api/src/policies/permissions.guard.ts
// Full RBAC matrix: apps/admin/src/lib/rbac.ts

export type AdminRole =
  | "super_admin"          // Governance authority — full control + emergency
  | "admin"                // Operations supervisor — restricted (no FX/fees/system)
  | "regional_manager"     // Region-scoped network operations
  | "support_agent"        // L1/L2 case handling — view + freeze + escalate only
  | "compliance_officer"   // AML/KYC authority — independent from operations
  | "treasury_officer"     // Float, FX, settlements, fee management
  | "hr_manager"           // Staff governance — people lifecycle only
  | "investor"             // Read-only aggregated metrics (no PII)
  | "auditor"              // External read-only audit + export
  | "broadcaster";         // Notification hub — controlled messaging only

// ─── Display labels ───────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin:        "Super Admin",
  admin:              "Operations Admin",
  regional_manager:   "Regional Manager",
  support_agent:      "Support Agent",
  compliance_officer: "Compliance Officer",
  treasury_officer:   "Treasury Officer",
  hr_manager:         "HR Manager",
  investor:           "Partner / Investor",
  auditor:            "Auditor",
  broadcaster:        "Notifications Manager",
};

// ─── Badge color tokens per role ──────────────────────────────────────────────
export const ROLE_COLORS: Record<AdminRole, { bg: string; text: string; border: string }> = {
  super_admin:        { bg: "rgba(201,168,76,0.15)",  text: "#C9A84C", border: "rgba(201,168,76,0.30)"  },
  admin:              { bg: "rgba(201,168,76,0.10)",  text: "#C9A84C", border: "rgba(201,168,76,0.20)"  },
  regional_manager:   { bg: "rgba(59,130,246,0.12)",  text: "#60A5FA", border: "rgba(59,130,246,0.25)"  },
  support_agent:      { bg: "rgba(139,92,246,0.12)",  text: "#A78BFA", border: "rgba(139,92,246,0.25)"  },
  compliance_officer: { bg: "rgba(239,68,68,0.12)",   text: "#F87171", border: "rgba(239,68,68,0.25)"   },
  treasury_officer:   { bg: "rgba(34,197,94,0.12)",   text: "#4ADE80", border: "rgba(34,197,94,0.25)"   },
  hr_manager:         { bg: "rgba(251,191,36,0.12)",  text: "#FBB724", border: "rgba(251,191,36,0.25)"  },
  investor:           { bg: "rgba(52,211,153,0.12)",  text: "#34D399", border: "rgba(52,211,153,0.25)"  },
  auditor:            { bg: "rgba(249,115,22,0.12)",  text: "#FB923C", border: "rgba(249,115,22,0.25)"  },
  broadcaster:        { bg: "rgba(168,85,247,0.12)",  text: "#C084FC", border: "rgba(168,85,247,0.25)"  },
};

// ─── Page ACL sets per role ───────────────────────────────────────────────────
// super_admin: wildcard — all pages including /emergency, /system, /hr

const ADMIN_PAGES = new Set([
  // Operations supervisor — NO: /fx /treasury /limits /merchant-fees /system /emergency /hr
  "/", "/risk", "/review", "/cases",
  "/compliance", "/compliance/kyc",
  "/users", "/clients", "/diaspora", "/merchants", "/agents", "/distributors",
  "/pos", "/notifications", "/audit", "/analytics", "/analytics/revenue",
  "/analytics/volume", "/settlements", "/operations", "/investor", "/training",
]);

const REGIONAL_MANAGER_PAGES = new Set([
  // Region-scoped ops — backend enforces region_id filter
  "/", "/risk", "/review", "/cases",
  "/compliance", "/compliance/kyc",
  "/users", "/clients", "/diaspora", "/merchants", "/agents", "/distributors",
  "/pos", "/notifications", "/audit", "/analytics", "/analytics/revenue",
  "/analytics/volume", "/settlements", "/operations", "/investor", "/training",
]);

const SUPPORT_AGENT_PAGES = new Set([
  // View + freeze + escalate only — NO financial or admin pages
  "/", "/risk", "/review", "/cases",
  "/compliance", "/compliance/kyc",
  "/users", "/clients", "/diaspora",
  "/notifications", "/support", "/training",
]);

const COMPLIANCE_OFFICER_PAGES = new Set([
  // AML authority — independent from operations
  "/", "/risk", "/review", "/cases",
  "/compliance", "/compliance/kyc",
  "/users", "/clients", "/diaspora", "/merchants", "/agents", "/distributors",
  "/audit", "/analytics", "/analytics/revenue", "/analytics/volume",
  "/notifications", "/training",
]);

const TREASURY_OFFICER_PAGES = new Set([
  // Finance only — NO user management, NO compliance override
  "/", "/treasury", "/fx", "/limits", "/merchant-fees",
  "/settlements", "/analytics", "/analytics/revenue",
  "/float", "/float/refill", "/audit", "/training", "/pos",
]);

const HR_MANAGER_PAGES = new Set([
  // Staff governance only — NO operational access
  "/", "/hr", "/training", "/audit",
]);

const INVESTOR_PAGES = new Set([
  // Aggregated metrics only — NO PII, NO operations
  "/", "/investor", "/training", "/analytics",
]);

const AUDITOR_PAGES = new Set([
  // External read-only — NO modifications
  "/", "/audit", "/compliance", "/compliance/kyc",
  "/risk", "/cases", "/analytics", "/analytics/revenue", "/analytics/volume",
  "/users", "/clients", "/training",
]);

const BROADCASTER_PAGES = new Set([
  // Controlled messaging only
  "/", "/notifications", "/training",
]);

// ─── ACL resolver ─────────────────────────────────────────────────────────────
export function canAccess(role: AdminRole, href: string): boolean {
  if (role === "super_admin") return true;

  const pageSet = ((): Set<string> | null => {
    switch (role) {
      case "admin":               return ADMIN_PAGES;
      case "regional_manager":    return REGIONAL_MANAGER_PAGES;
      case "support_agent":       return SUPPORT_AGENT_PAGES;
      case "compliance_officer":  return COMPLIANCE_OFFICER_PAGES;
      case "treasury_officer":    return TREASURY_OFFICER_PAGES;
      case "hr_manager":          return HR_MANAGER_PAGES;
      case "investor":            return INVESTOR_PAGES;
      case "auditor":             return AUDITOR_PAGES;
      case "broadcaster":         return BROADCASTER_PAGES;
      default:                    return null;
    }
  })();

  if (!pageSet) return false;
  return (
    pageSet.has(href) ||
    Array.from(pageSet).some((p) => p !== "/" && href.startsWith(p))
  );
}

// ─── Role resolver from Supabase JWT ─────────────────────────────────────────
export function resolveAdminRole(
  user: Record<string, unknown> | null | undefined,
): AdminRole {
  const meta = user?.["user_metadata"] as Record<string, unknown> | undefined;
  const raw =
    (meta?.["admin_role"] as string | undefined) ??
    (meta?.["role"] as string | undefined) ??
    (user?.["https://kobklein.com/admin_role"] as string | undefined) ??
    (user?.["https://kobklein.com/role"] as string | undefined) ??
    (user?.["role"] as string | undefined) ??
    "admin";

  const VALID: AdminRole[] = [
    "super_admin", "admin", "regional_manager", "support_agent",
    "compliance_officer", "treasury_officer", "hr_manager",
    "investor", "auditor", "broadcaster",
  ];
  return VALID.includes(raw as AdminRole) ? (raw as AdminRole) : "admin";
}
