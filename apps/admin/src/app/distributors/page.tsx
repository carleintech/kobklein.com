"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError, kkGet, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type DistributorUser = {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  kycTier: number;
};

type Distributor = {
  id: string;
  userId: string;
  displayName: string | null;
  businessName: string | null;
  locationText: string | null;
  status: "active" | "suspended" | "pending" | "onboarding";
  tier: number;
  commissionIn: number;
  commissionOut: number;
  floatBalance: number;
  user: DistributorUser;
  createdAt: string;
};

type NetworkStats = {
  network: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHTG(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "HTG",
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function displayName(d: Distributor): string {
  return (
    d.displayName ||
    d.businessName ||
    `${d.user.firstName} ${d.user.lastName}`.trim() ||
    d.user.phone
  );
}

// ── Style maps ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { text: string; bg: string; dot: string }> =
  {
    active: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/25",
      dot: "bg-emerald-400",
    },
    pending: {
      text: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/25",
      dot: "bg-orange-400",
    },
    suspended: {
      text: "text-red-400",
      bg: "bg-red-500/10 border-red-500/25",
      dot: "bg-red-400",
    },
    onboarding: {
      text: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/25",
      dot: "bg-sky-400",
    },
  };

function statusStyle(s: string) {
  return (
    STATUS_STYLE[s] ?? {
      text: "text-kob-muted",
      bg: "bg-white/5 border-white/10",
      dot: "bg-kob-muted",
    }
  );
}

// ── Activation Confirm Modal ──────────────────────────────────────────────────

function ActivateModal({
  dist,
  onConfirm,
  onClose,
  submitting,
}: {
  dist: Distributor;
  onConfirm: () => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const name = displayName(dist);
  const kycLabel = ["None", "Tier 1", "Tier 2", "Tier 3"][dist.user.kycTier] ?? "Unknown";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "#080E20", border: "1px solid rgba(212,175,55,0.20)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold top bar */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent 0%, #C9A84C 50%, transparent 100%)" }} />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-kob-gold/10 border border-kob-gold/25">
                <Zap className="h-4.5 w-4.5 text-kob-gold" />
              </div>
              <div>
                <h3 className="text-sm font-black text-kob-text">Activate Account</h3>
                <p className="text-[11px] text-kob-muted mt-0.5">Review before activation</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-kob-muted" />
            </button>
          </div>

          {/* Agent details */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-kob-muted uppercase tracking-widest">Agent Name</span>
              <span className="text-xs font-bold text-kob-text">{name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-kob-muted uppercase tracking-widest">Phone</span>
              <span className="text-[11px] font-mono text-kob-text">{dist.user.phone}</span>
            </div>
            {dist.locationText && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-kob-muted uppercase tracking-widest">Location</span>
                <span className="text-[11px] text-kob-text">{dist.locationText}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-kob-muted uppercase tracking-widest">KYC Level</span>
              <span className={`text-[11px] font-semibold ${dist.user.kycTier >= 1 ? "text-emerald-400" : "text-orange-400"}`}>
                {kycLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-kob-muted uppercase tracking-widest">Commission</span>
              <span className="text-[11px] font-mono text-kob-text">
                In {fmtPct(dist.commissionIn)} · Out {fmtPct(dist.commissionOut)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-kob-muted uppercase tracking-widest">Applied</span>
              <span className="text-[11px] text-kob-muted">{fmtDate(dist.createdAt)}</span>
            </div>
          </div>

          {/* KYC warning if tier 0 */}
          {dist.user.kycTier === 0 && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-orange-500/25 bg-orange-500/6">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-orange-400 leading-relaxed">
                This agent has not completed KYC. Consider verifying identity before activation.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-kob-muted border border-white/10 bg-white/4 hover:bg-white/7 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #D4AF37 0%, #9F7F2C 100%)",
                color: "#060912",
                boxShadow: "0 4px 20px -4px rgba(212,175,55,0.40)",
              }}
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              {submitting ? "Activating…" : "Activate Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Distributor Card ──────────────────────────────────────────────────────────

function DistributorCard({
  dist,
  onAction,
}: {
  dist: Distributor;
  onAction: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showActivateModal, setShowActivateModal] = useState(false);

  const ss = statusStyle(dist.status);
  const name = displayName(dist);

  async function handleAction(endpoint: string, successMsg: string) {
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await kkPost(`v1/admin/distributors/${endpoint}`, {});
      setSuccess(successMsg);
      onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleActivate() {
    await handleAction(`${dist.id}/approve`, `✓ ${name} activated successfully`);
    setShowActivateModal(false);
  }

  return (
    <>
      {/* Activation confirm modal */}
      {showActivateModal && (
        <ActivateModal
          dist={dist}
          onConfirm={handleActivate}
          onClose={() => setShowActivateModal(false)}
          submitting={submitting}
        />
      )}

      <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
        {/* Pending highlight top bar */}
        {dist.status === "pending" && (
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.6) 50%, transparent 100%)" }} />
        )}

        <div className="flex items-center gap-4 px-5 py-4">
          {/* Status dot */}
          <span className={`h-2 w-2 rounded-full shrink-0 ${ss.dot}`} />

          {/* Details */}
          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_120px_130px_110px_80px] gap-x-4 gap-y-1 items-center">
            {/* Name + location */}
            <div className="min-w-0">
              <p className="text-xs font-bold text-kob-text truncate">{name}</p>
              <p className="text-[10px] font-mono text-kob-muted truncate">
                {dist.user.phone}
                {dist.locationText ? (
                  <span className="ml-2 text-kob-muted/60">
                    · {dist.locationText}
                  </span>
                ) : null}
              </p>
            </div>

            {/* Status */}
            <span
              className={`hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border w-fit text-[10px] font-semibold capitalize ${ss.bg} ${ss.text}`}
            >
              {dist.status}
            </span>

            {/* Float balance */}
            <div className="hidden md:block">
              <p className="text-[10px] text-kob-muted uppercase tracking-widest mb-0.5">
                Float
              </p>
              <p className="text-xs font-bold font-mono tabular-nums text-kob-gold">
                {fmtHTG(dist.floatBalance)}
              </p>
            </div>

            {/* Commission in / out */}
            <div className="hidden md:block">
              <p className="text-[10px] text-kob-muted uppercase tracking-widest mb-0.5">
                Comm In/Out
              </p>
              <p className="text-[10px] font-mono text-kob-text">
                {fmtPct(dist.commissionIn)} /{" "}
                <span className="text-kob-muted">
                  {fmtPct(dist.commissionOut)}
                </span>
              </p>
            </div>

            {/* Joined */}
            <div className="hidden md:block">
              <p className="text-[10px] text-kob-muted uppercase tracking-widest mb-0.5">
                Joined
              </p>
              <p className="text-[10px] text-kob-muted">
                {fmtDate(dist.createdAt)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="shrink-0 flex items-center gap-2">
            {dist.status === "pending" && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowActivateModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.08) 100%)",
                  border: "1px solid rgba(212,175,55,0.35)",
                  color: "#D4AF37",
                  boxShadow: "0 2px 12px -2px rgba(212,175,55,0.20)",
                }}
              >
                <Zap className="h-3.5 w-3.5" />
                Activate Account
              </button>
            )}
            {dist.status === "active" && (
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  handleAction(`${dist.id}/suspend`, `${name} suspended`)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-kob-muted hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/8 transition-all disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldX className="h-3.5 w-3.5" />
                )}
                Suspend
              </button>
            )}
            {dist.status === "suspended" && (
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  handleAction(`${dist.id}/reactivate`, `${name} reactivated`)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                Reactivate
              </button>
            )}
          </div>
        </div>

        {/* Inline feedback */}
        {(success || error) && (
          <div
            className={`mx-5 mb-3 px-3 py-2 rounded-xl text-[11px] font-medium ${
              error
                ? "bg-red-500/8 border border-red-500/20 text-red-400"
                : "bg-emerald-500/8 border border-emerald-500/20 text-emerald-400"
            }`}
          >
            {error || success}
          </div>
        )}
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [stats, setStats] = useState<NetworkStats["network"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);

  /* Filter */
  const [filter, setFilter] = useState<
    "all" | "active" | "pending" | "suspended"
  >("all");

  const load = useCallback(async () => {
    setLoading(true);
    setApiDown(false);
    try {
      const [distData, statsData] = await Promise.all([
        kkGet<{ distributors: Distributor[] }>("v1/admin/distributors"),
        kkGet<NetworkStats>("v1/admin/distributors/network/stats"),
      ]);
      setDistributors(distData?.distributors ?? []);
      setStats(statsData?.network ?? null);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.isApiUnavailable) setApiDown(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered =
    filter === "all"
      ? distributors
      : distributors.filter((d) => d.status === filter);

  const pendingCount = distributors.filter(
    (d) => d.status === "pending",
  ).length;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">
            Distributor Management
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Approve, suspend, and reactivate distributor agents
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-kob-muted hover:text-kob-text transition-all disabled:opacity-40"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* ── API offline banner ───────────────────────────────────────────── */}
      {apiDown && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/8">
          <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
          <p className="text-xs text-red-400 font-medium">
            Distributor API is unreachable — data may be stale
          </p>
        </div>
      )}

      {/* ── Pending alert ────────────────────────────────────────────────── */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-orange-500/25 bg-orange-500/8">
          <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
          <p className="text-xs text-orange-400 font-semibold">
            {pendingCount} distributor{pendingCount !== 1 ? "s" : ""} pending
            approval
          </p>
        </div>
      )}

      {/* ── Stats grid ──────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-kob-gold/20 bg-[#080E20] p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0">
              <Users className="h-3.5 w-3.5 text-kob-gold" />
            </div>
            <div>
              <p className="text-[9px] text-kob-muted uppercase tracking-widest">
                Total
              </p>
              <p className="text-xl font-bold text-kob-text tabular-nums">
                {stats.total}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/15 bg-[#080E20] p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[9px] text-kob-muted uppercase tracking-widest">
                Active
              </p>
              <p className="text-xl font-bold text-emerald-400 tabular-nums">
                {stats.active}
              </p>
            </div>
          </div>
          <div
            className={`rounded-2xl border bg-[#080E20] p-4 flex items-center gap-3 ${
              stats.pending > 0 ? "border-orange-500/25" : "border-white/8"
            }`}
          >
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
                stats.pending > 0
                  ? "bg-orange-500/10 border-orange-500/20"
                  : "bg-white/5 border-white/8"
              }`}
            >
              <Clock
                className={`h-3.5 w-3.5 ${stats.pending > 0 ? "text-orange-400" : "text-kob-muted"}`}
              />
            </div>
            <div>
              <p className="text-[9px] text-kob-muted uppercase tracking-widest">
                Pending
              </p>
              <p
                className={`text-xl font-bold tabular-nums ${stats.pending > 0 ? "text-orange-400" : "text-kob-text"}`}
              >
                {stats.pending}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <ShieldX className="h-3.5 w-3.5 text-red-400" />
            </div>
            <div>
              <p className="text-[9px] text-kob-muted uppercase tracking-widest">
                Suspended
              </p>
              <p
                className={`text-xl font-bold tabular-nums ${stats.suspended > 0 ? "text-red-400" : "text-kob-text"}`}
              >
                {stats.suspended}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter tabs ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {(["all", "active", "pending", "suspended"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold capitalize transition-all ${
              filter === f
                ? "bg-kob-gold/10 border-kob-gold/30 text-kob-gold"
                : "bg-white/4 border-white/8 text-kob-muted hover:text-kob-text hover:border-white/15"
            }`}
          >
            {f}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 text-[9px] font-bold text-orange-400">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── List ────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-kob-gold" />
          <span className="text-xs text-kob-muted">Loading distributors…</span>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-[#080E20] flex flex-col items-center justify-center py-14 gap-3">
          <Users className="h-10 w-10 text-kob-muted/30" />
          <p className="text-sm font-semibold text-kob-text">
            No {filter === "all" ? "" : filter} distributors
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[8px_1fr_120px_130px_110px_80px_120px] gap-4 px-5 py-2">
            {[
              "",
              "Distributor",
              "Status",
              "Float Balance",
              "Commission",
              "Joined",
              "",
            ].map((h, i) => (
              <span
                key={"col-" + i}
                className="text-[9px] font-semibold text-kob-muted uppercase tracking-widest"
              >
                {h}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            {filtered.map((d) => (
              <DistributorCard key={d.id} dist={d} onAction={load} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
