"use client";

// ─── HR & Staff Governance Dashboard ─────────────────────────────────────────
// Route: /hr  |  Roles: hr_manager, super_admin
// Manages: staff directory, role assignments, training compliance, access log,
//          onboarding / offboarding workflow.

import { useEffect, useState } from "react";
import { kkGet } from "@/lib/kobklein-api";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Clock,
  LogOut,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AdminRole =
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

type StaffStatus = "active" | "on_leave" | "suspended" | "offboarded";
type TrainingStatus = "compliant" | "overdue" | "pending" | "exempt";

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  status: StaffStatus;
  trainingStatus: TrainingStatus;
  trainingCompletedAt: string | null;
  trainingDueAt: string | null;
  lastLogin: string | null;
  createdAt: string;
  region?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<AdminRole, string> = {
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

const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin:        "text-[#C9A84C] bg-[rgba(201,168,76,0.12)] border-[rgba(201,168,76,0.25)]",
  admin:              "text-[#C9A84C] bg-[rgba(201,168,76,0.08)] border-[rgba(201,168,76,0.18)]",
  regional_manager:   "text-[#60A5FA] bg-[rgba(59,130,246,0.12)] border-[rgba(59,130,246,0.25)]",
  support_agent:      "text-[#A78BFA] bg-[rgba(139,92,246,0.12)] border-[rgba(139,92,246,0.25)]",
  compliance_officer: "text-[#F87171] bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.25)]",
  treasury_officer:   "text-[#4ADE80] bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.25)]",
  hr_manager:         "text-[#FBB724] bg-[rgba(251,191,36,0.12)] border-[rgba(251,191,36,0.25)]",
  investor:           "text-[#34D399] bg-[rgba(52,211,153,0.12)] border-[rgba(52,211,153,0.25)]",
  auditor:            "text-[#FB923C] bg-[rgba(249,115,22,0.12)] border-[rgba(249,115,22,0.25)]",
  broadcaster:        "text-[#C084FC] bg-[rgba(168,85,247,0.12)] border-[rgba(168,85,247,0.25)]",
};

// Mock data — replaced by real API data in production (GET /v1/admin/hr/staff)
const MOCK_STAFF: StaffMember[] = [
  {
    id: "s1", email: "superadmin@kobklein.com",
    firstName: "Super", lastName: "Admin",
    role: "super_admin", status: "active",
    trainingStatus: "compliant", trainingCompletedAt: "2026-01-15", trainingDueAt: "2026-07-15",
    lastLogin: "2026-02-26T08:30:00Z", createdAt: "2025-06-01",
  },
  {
    id: "s2", email: "admin@kobklein.com",
    firstName: "Platform", lastName: "Admin",
    role: "admin", status: "active",
    trainingStatus: "compliant", trainingCompletedAt: "2026-01-20", trainingDueAt: "2026-07-20",
    lastLogin: "2026-02-25T14:22:00Z", createdAt: "2025-06-01",
  },
  {
    id: "s3", email: "compliance@kobklein.com",
    firstName: "Compliance", lastName: "Officer",
    role: "compliance_officer", status: "active",
    trainingStatus: "compliant", trainingCompletedAt: "2026-02-01", trainingDueAt: "2026-08-01",
    lastLogin: "2026-02-26T07:45:00Z", createdAt: "2025-09-10",
  },
  {
    id: "s4", email: "treasury@kobklein.com",
    firstName: "Treasury", lastName: "Officer",
    role: "treasury_officer", status: "active",
    trainingStatus: "overdue", trainingCompletedAt: "2025-08-10", trainingDueAt: "2026-02-10",
    lastLogin: "2026-02-20T11:00:00Z", createdAt: "2025-09-10",
  },
  {
    id: "s5", email: "regional@kobklein.com",
    firstName: "Regional", lastName: "Manager",
    role: "regional_manager", status: "active",
    trainingStatus: "pending", trainingCompletedAt: null, trainingDueAt: "2026-03-01",
    lastLogin: "2026-02-24T09:15:00Z", createdAt: "2025-11-01", region: "Port-au-Prince",
  },
  {
    id: "s6", email: "support@kobklein.com",
    firstName: "Support", lastName: "Agent",
    role: "support_agent", status: "active",
    trainingStatus: "compliant", trainingCompletedAt: "2026-01-30", trainingDueAt: "2026-07-30",
    lastLogin: "2026-02-26T08:00:00Z", createdAt: "2025-11-01",
  },
  {
    id: "s7", email: "auditor@kobklein.com",
    firstName: "Compliance", lastName: "Auditor",
    role: "auditor", status: "active",
    trainingStatus: "exempt", trainingCompletedAt: null, trainingDueAt: null,
    lastLogin: "2026-02-22T10:30:00Z", createdAt: "2025-12-15",
  },
  {
    id: "s8", email: "broadcast@kobklein.com",
    firstName: "Notifications", lastName: "Manager",
    role: "broadcaster", status: "active",
    trainingStatus: "compliant", trainingCompletedAt: "2026-02-05", trainingDueAt: "2026-08-05",
    lastLogin: "2026-02-25T16:00:00Z", createdAt: "2025-12-15",
  },
  {
    id: "s9", email: "investor@kobklein.com",
    firstName: "Partner", lastName: "Investor",
    role: "investor", status: "active",
    trainingStatus: "exempt", trainingCompletedAt: null, trainingDueAt: null,
    lastLogin: "2026-02-10T09:00:00Z", createdAt: "2026-01-01",
  },
  {
    id: "s10", email: "hr@kobklein.com",
    firstName: "HR", lastName: "Manager",
    role: "hr_manager", status: "active",
    trainingStatus: "compliant", trainingCompletedAt: "2026-02-10", trainingDueAt: "2026-08-10",
    lastLogin: "2026-02-26T08:15:00Z", createdAt: "2026-01-01",
  },
  {
    id: "s11", email: "training@kobklein.com",
    firstName: "Training", lastName: "Manager",
    role: "support_agent", status: "active",
    trainingStatus: "compliant", trainingCompletedAt: "2026-02-12", trainingDueAt: "2026-08-12",
    lastLogin: "2026-02-26T07:00:00Z", createdAt: "2026-01-15",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: StaffStatus) {
  const map: Record<StaffStatus, { label: string; cls: string }> = {
    active:     { label: "Active",     cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25" },
    on_leave:   { label: "On Leave",   cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/25" },
    suspended:  { label: "Suspended",  cls: "text-red-400 bg-red-400/10 border-red-400/25" },
    offboarded: { label: "Offboarded", cls: "text-white/30 bg-white/5 border-white/10" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

function trainingBadge(ts: TrainingStatus) {
  const map: Record<TrainingStatus, { label: string; icon: React.ReactNode; cls: string }> = {
    compliant: { label: "Compliant", icon: <CheckCircle className="h-3 w-3" />, cls: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25" },
    overdue:   { label: "OVERDUE",   icon: <XCircle className="h-3 w-3" />,     cls: "text-red-400 bg-red-400/10 border-red-400/25" },
    pending:   { label: "Pending",   icon: <Clock className="h-3 w-3" />,        cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/25" },
    exempt:    { label: "Exempt",    icon: <Shield className="h-3 w-3" />,       cls: "text-white/40 bg-white/5 border-white/10" },
  };
  const { label, icon, cls } = map[ts];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${cls}`}>
      {icon}{label}
    </span>
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtRelative(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HRPage() {
  const [search, setSearch]               = useState("");
  const [roleFilter, setRoleFilter]       = useState<string>("all");
  const [statusFilter, setStatusFilter]   = useState<string>("all");
  const [trainingFilter, setTrainingFilter] = useState<string>("all");
  const [refreshing, setRefreshing]       = useState(false);
  const [staff, setStaff]                 = useState<StaffMember[]>(MOCK_STAFF);
  const [loading, setLoading]             = useState(true);
  const [apiError, setApiError]           = useState<string | null>(null);

  // Fetch real staff from Supabase via the API
  const loadStaff = async () => {
    try {
      setRefreshing(true);
      const res = await kkGet<{ ok: boolean; staff: StaffMember[]; total: number }>("admin/hr/staff");
      if (res.ok && res.staff.length > 0) {
        setStaff(res.staff);
        setApiError(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load staff";
      setApiError(msg);
      // Keep existing data (mock fallback on first load, real data on refresh)
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void loadStaff(); }, []);

  const total           = staff.length;
  const active          = staff.filter((s) => s.status === "active").length;
  const overdueTraining = staff.filter((s) => s.trainingStatus === "overdue").length;
  const pendingTraining = staff.filter((s) => s.trainingStatus === "pending").length;

  const filtered = staff.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.email.toLowerCase().includes(q) ||
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q);
    const matchRole     = roleFilter     === "all" || m.role     === roleFilter;
    const matchStatus   = statusFilter   === "all" || m.status   === statusFilter;
    const matchTraining = trainingFilter === "all" || m.trainingStatus === trainingFilter;
    return matchSearch && matchRole && matchStatus && matchTraining;
  });

  function handleRefresh() { void loadStaff(); }

  return (
    <div className="space-y-6 pb-8">
      {/* ── API error banner ── */}
      {apiError && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] text-yellow-400 border border-yellow-400/20 bg-yellow-400/5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Could not reach API — showing cached data. {apiError}</span>
        </div>
      )}
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-[#FBB724]" />
            <h1 className="text-xl font-bold text-white tracking-tight">HR & Staff Governance</h1>
          </div>
          <p className="text-sm text-white/40">
            Staff directory · Role assignments · Training compliance · Access lifecycle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white transition-colors border border-white/8 hover:border-white/15"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#060912] bg-[#C9A84C] hover:bg-[#E1C97A] transition-colors">
            <UserPlus className="h-3.5 w-3.5" />
            Invite Staff
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Staff",      value: total,           icon: Users,         color: "text-white/70" },
          { label: "Active",           value: active,          icon: UserCheck,     color: "text-emerald-400" },
          { label: "Training Overdue", value: overdueTraining, icon: AlertTriangle, color: "text-red-400" },
          { label: "Training Pending", value: pendingTraining, icon: Clock,         color: "text-yellow-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl p-4 border border-white/6"
              style={{ background: "rgba(255,255,255,0.025)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <p className="text-xs text-white/40">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── Training Compliance Alert ── */}
      {overdueTraining > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25"
          style={{ background: "rgba(239,68,68,0.06)" }}
        >
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">
              {overdueTraining} staff member{overdueTraining > 1 ? "s" : ""} with overdue mandatory training
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              Access to sensitive pages is blocked until training is completed. Notify affected staff immediately.
            </p>
          </div>
          <button className="text-xs text-red-400 hover:text-red-300 font-semibold border border-red-400/25 px-3 py-1 rounded-lg transition-colors whitespace-nowrap">
            Send Reminder
          </button>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm text-white placeholder:text-white/25 outline-none border border-white/8 focus:border-[#C9A84C]/40 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
        </div>

        {[
          {
            value: roleFilter, onChange: setRoleFilter,
            options: [
              { value: "all", label: "All Roles" },
              ...Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l })),
            ],
          },
          {
            value: statusFilter, onChange: setStatusFilter,
            options: [
              { value: "all",        label: "All Status" },
              { value: "active",     label: "Active" },
              { value: "on_leave",   label: "On Leave" },
              { value: "suspended",  label: "Suspended" },
              { value: "offboarded", label: "Offboarded" },
            ],
          },
          {
            value: trainingFilter, onChange: setTrainingFilter,
            options: [
              { value: "all",       label: "All Training" },
              { value: "compliant", label: "Compliant" },
              { value: "overdue",   label: "Overdue" },
              { value: "pending",   label: "Pending" },
              { value: "exempt",    label: "Exempt" },
            ],
          },
        ].map((sel, i) => (
          <select
            key={"hr-sel-" + i}
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            className="h-9 px-3 rounded-lg text-sm text-white/70 outline-none border border-white/8 focus:border-[#C9A84C]/40 transition-colors cursor-pointer"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            {sel.options.map((o) => (
              <option key={o.value} value={o.value} style={{ background: "#0F1626" }}>
                {o.label}
              </option>
            ))}
          </select>
        ))}

        <p className="text-xs text-white/30 ml-auto whitespace-nowrap">
          {filtered.length} of {total} staff
        </p>
      </div>

      {/* ── Staff Table ── */}
      <div className="rounded-xl border border-white/6 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/6">
                {["Staff Member", "Role", "Status", "Training", "Last Login", "Since", "Actions"].map((h, i) => (
                  <th
                    key={"hr-th-" + i}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-white/30">
                    No staff members match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((m, i) => (
                  <tr
                    key={m.id}
                    className={`border-b border-white/4 hover:bg-white/[0.025] transition-colors ${
                      i === filtered.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    {/* Staff Member */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-[#060912] shrink-0"
                          style={{ background: "linear-gradient(135deg, #C9A84C, #E1C97A)" }}
                        >
                          {m.firstName[0]}{m.lastName[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm leading-tight">
                            {m.firstName} {m.lastName}
                          </p>
                          <p className="text-white/40 text-xs">{m.email}</p>
                          {m.region && (
                            <p className="text-blue-400/60 text-[10px]">📍 {m.region}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${ROLE_COLORS[m.role]}`}>
                        {ROLE_LABELS[m.role]}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">{statusBadge(m.status)}</td>

                    {/* Training */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {trainingBadge(m.trainingStatus)}
                        {m.trainingDueAt && m.trainingStatus !== "exempt" && (
                          <p className="text-[10px] text-white/30">
                            Due: {fmtDate(m.trainingDueAt)}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Last Login */}
                    <td className="px-4 py-3">
                      <p className="text-white/70 text-xs">{fmtRelative(m.lastLogin)}</p>
                    </td>

                    {/* Since */}
                    <td className="px-4 py-3">
                      <p className="text-white/40 text-xs">{fmtDate(m.createdAt)}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          title="Mark Training Complete"
                          className="p-1.5 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                        </button>
                        {m.status === "active" ? (
                          <button
                            title="Suspend Account"
                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            title="Reactivate Account"
                            className="p-1.5 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          title="Offboard"
                          className="p-1.5 rounded-lg text-white/30 hover:text-orange-400 hover:bg-orange-400/10 transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="More Actions"
                          className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Governance Policies ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "No Shared Accounts",
            icon: Shield,
            color: "text-[#C9A84C]",
            body: "Every staff member must have a unique personal account. Shared credentials are prohibited under KobKlein security policy.",
          },
          {
            title: "Mandatory Training",
            icon: BookOpen,
            color: "text-blue-400",
            body: "All staff with access to sensitive pages must complete role-specific training every 6 months. Overdue staff lose access automatically.",
          },
          {
            title: "Separation of Duties",
            icon: UserCheck,
            color: "text-emerald-400",
            body: "No single operator can initiate and approve the same action. High-risk operations require dual-control sign-off.",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-xl p-4 border border-white/6"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${card.color}`} />
                <p className="text-sm font-semibold text-white">{card.title}</p>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">{card.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
