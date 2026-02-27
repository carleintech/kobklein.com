import { AlertTriangle, ArrowRight, CheckCircle2, Clock, FileText, Search } from "lucide-react";
import Link from "next/link";
import { apiGet } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Case = {
  id: string;
  caseType: string;
  status: string;
  priority: string;
  description: string;
  reporterUserId?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_LABELS: Record<string, string> = {
  wrong_recipient: "Wrong Recipient",
  unauthorized: "Unauthorized",
  merchant_dispute: "Merchant Dispute",
};

type PriorityStyle = { dot: string; text: string; border: string; bg: string };

function priorityStyle(p: string): PriorityStyle {
  if (p === "critical" || p === "high") return {
    dot: "bg-red-500",
    text: "text-red-400",
    border: "border-l-red-500/60",
    bg: "bg-red-500/3",
  };
  if (p === "normal") return {
    dot: "bg-kob-gold",
    text: "text-kob-gold",
    border: "border-l-kob-gold/40",
    bg: "",
  };
  return {
    dot: "bg-sky-500",
    text: "text-sky-400",
    border: "border-l-sky-500/35",
    bg: "",
  };
}

type StatusStyle = { dot: string; text: string; bg: string; border: string; label: string };

function statusStyle(s: string): StatusStyle {
  const map: Record<string, StatusStyle> = {
    open:          { dot: "bg-kob-gold",   text: "text-kob-gold",   bg: "bg-kob-gold/10",   border: "border-kob-gold/20",   label: "Open" },
    investigating: { dot: "bg-sky-400",    text: "text-sky-400",    bg: "bg-sky-500/10",    border: "border-sky-500/20",    label: "Investigating" },
    pending_user:  { dot: "bg-yellow-400", text: "text-yellow-300", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Pending User" },
    pending_admin: { dot: "bg-yellow-400", text: "text-yellow-300", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Pending Admin" },
    resolved:      { dot: "bg-emerald-400",text: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20",label: "Resolved" },
    rejected:      { dot: "bg-kob-muted",  text: "text-kob-muted",  bg: "bg-white/5",       border: "border-white/10",      label: "Rejected" },
  };
  return map[s] ?? { dot: "bg-kob-muted", text: "text-kob-muted", bg: "bg-white/5", border: "border-white/10", label: s };
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-4 ${value > 0 ? "" : ""}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-kob-text leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CasesPage() {
  const cases = await apiGet<Case[]>("admin/cases", []);

  const open         = cases.filter((c) => c.status === "open").length;
  const investigating = cases.filter((c) => c.status === "investigating").length;
  const resolved     = cases.filter((c) => c.status === "resolved").length;
  const critical     = cases.filter((c) => c.priority === "critical" || c.priority === "high").length;

  // Sort: critical/high first, then by createdAt desc
  const sorted = [...cases].sort((a, b) => {
    const po = { critical: 0, high: 1, normal: 2, low: 3 };
    const ap = po[a.priority as keyof typeof po] ?? 4;
    const bp = po[b.priority as keyof typeof po] ?? 4;
    if (ap !== bp) return ap - bp;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">Case Management</h1>
          <p className="text-xs text-kob-muted mt-0.5">Disputes, chargebacks &amp; investigations</p>
        </div>
        {critical > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <span className="text-xs font-semibold text-red-400">{critical} critical</span>
          </div>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Open Cases"
          value={open}
          icon={<Clock className="h-5 w-5 text-kob-gold" />}
          accent="bg-kob-gold/10 border-kob-gold/20"
        />
        <StatCard
          label="Investigating"
          value={investigating}
          icon={<Search className="h-5 w-5 text-sky-400" />}
          accent="bg-sky-500/10 border-sky-500/20"
        />
        <StatCard
          label="Resolved"
          value={resolved}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          accent="bg-emerald-500/10 border-emerald-500/20"
        />
        <StatCard
          label="Total Cases"
          value={cases.length}
          icon={<FileText className="h-5 w-5 text-kob-muted" />}
          accent="bg-white/5 border-white/10"
        />
      </div>

      {/* ── Cases List ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/6">
          <span className="text-sm font-semibold text-kob-text">
            All Cases
            {cases.length > 0 && (
              <span className="ml-2 text-xs font-normal text-kob-muted">({cases.length})</span>
            )}
          </span>
          <span className="text-[10px] text-kob-muted">Sorted by priority</span>
        </div>

        {/* Column headers */}
        {sorted.length > 0 && (
          <div className="grid grid-cols-[80px_120px_140px_1fr_110px_70px_48px] gap-x-4 px-5 py-2 border-b border-white/4">
            {["Priority", "Type", "Status", "Description", "Reporter", "Created", ""].map((h, i) => (
              <span key={"col-" + i} className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">{h}</span>
            ))}
          </div>
        )}

        {/* Rows */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-kob-text">No cases — all clear</p>
            <p className="text-xs text-kob-muted">No disputes or investigations pending</p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {sorted.map((c) => {
              const pri = priorityStyle(c.priority);
              const sta = statusStyle(c.status);
              return (
                <div
                  key={c.id}
                  className={`grid grid-cols-[80px_120px_140px_1fr_110px_70px_48px] gap-x-4 items-center px-5 py-3.5 border-l-2 hover:bg-white/2 transition-colors ${pri.border} ${pri.bg}`}
                >
                  {/* Priority */}
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${pri.dot}`} />
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${pri.text}`}>
                      {c.priority}
                    </span>
                  </div>

                  {/* Type */}
                  <span className="text-xs text-kob-body truncate">
                    {TYPE_LABELS[c.caseType] ?? c.caseType}
                  </span>

                  {/* Status */}
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold w-fit ${sta.text} ${sta.bg} ${sta.border}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sta.dot}`} />
                    {sta.label}
                  </span>

                  {/* Description */}
                  <span className="text-xs text-kob-muted truncate">{c.description || "—"}</span>

                  {/* Reporter */}
                  <span className="text-[10px] font-mono text-kob-muted truncate">
                    {c.reporterUserId ? `${c.reporterUserId.slice(0, 8)}…` : "System"}
                  </span>

                  {/* Created */}
                  <span className="text-[10px] text-kob-muted">{timeAgo(c.createdAt)}</span>

                  {/* Action */}
                  <Link
                    href={`/cases/${c.id}`}
                    className="flex items-center justify-center h-7 w-7 rounded-lg bg-white/5 border border-white/10 hover:bg-kob-gold/10 hover:border-kob-gold/25 transition-all group"
                    aria-label="Open case"
                  >
                    <ArrowRight className="h-3 w-3 text-kob-muted group-hover:text-kob-gold transition-colors" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
