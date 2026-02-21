"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, kkGet } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Stats = {
  openCases: number;
  kycPending: number;
  sanctionsAlerts: number;
  resolvedToday: number;
};

type ComplianceCase = {
  id: string;
  caseType: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  createdAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PRIORITY_STYLE: Record<
  string,
  { text: string; bg: string; dot: string; border: string }
> = {
  critical: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
    border: "border-l-red-500/70",
  },
  high: {
    text: "text-orange-400",
    bg: "bg-orange-500/10",
    dot: "bg-orange-400",
    border: "border-l-orange-400/60",
  },
  normal: {
    text: "text-kob-gold",
    bg: "bg-kob-gold/10",
    dot: "bg-kob-gold",
    border: "border-l-kob-gold/40",
  },
  low: {
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    dot: "bg-sky-400",
    border: "border-l-sky-500/30",
  },
};

function priorityStyle(p: string) {
  return PRIORITY_STYLE[p?.toLowerCase()] ?? PRIORITY_STYLE.normal;
}

const STATUS_STYLE: Record<string, { text: string; bg: string; dot: string }> =
  {
    open: {
      text: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/25",
      dot: "bg-orange-400",
    },
    investigating: {
      text: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/25",
      dot: "bg-sky-400",
    },
    resolved: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/25",
      dot: "bg-emerald-400",
    },
  };

function statusStyle(s: string) {
  return (
    STATUS_STYLE[s?.toLowerCase()] ?? {
      text: "text-kob-muted",
      bg: "bg-white/5 border-white/10",
      dot: "bg-kob-muted",
    }
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
  alert,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-[#080E20] p-5 flex items-center justify-between ${
        alert && value > 0 ? "border-red-500/25" : "border-white/8"
      }`}
    >
      <div>
        <p className="text-[10px] text-kob-muted uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className={`text-3xl font-bold tabular-nums ${accent}`}>{value}</p>
      </div>
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
          alert && value > 0
            ? "bg-red-500/10 border-red-500/20"
            : "bg-white/5 border-white/8"
        }`}
      >
        {icon}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cases, setCases] = useState<ComplianceCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiDown, setApiDown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setApiDown(false);
    try {
      const [s, c] = await Promise.all([
        kkGet<Stats>("v1/admin/compliance/stats"),
        kkGet<{ cases: ComplianceCase[] }>("v1/admin/compliance/cases"),
      ]);
      setStats(s ?? null);
      setCases(c?.cases ?? []);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.isApiUnavailable) {
        setApiDown(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Sort: critical first, then high, then open status first
  const sortedCases = [...cases].sort((a, b) => {
    const pOrder = ["critical", "high", "normal", "low"];
    const pa = pOrder.indexOf(a.priority ?? "normal");
    const pb = pOrder.indexOf(b.priority ?? "normal");
    if (pa !== pb) return pa - pb;
    if (a.status === "open" && b.status !== "open") return -1;
    if (a.status !== "open" && b.status === "open") return 1;
    return 0;
  });

  const openCount = cases.filter((c) => c.status === "open").length;
  const criticalCount = cases.filter((c) => c.priority === "critical").length;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">
            Compliance
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Monitor cases, KYC reviews, and sanctions screening
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

      {/* ── API offline banner ──────────────────────────────────────────── */}
      {apiDown && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/8">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400 font-medium">
            Compliance API is unreachable — data shown may be stale
          </p>
        </div>
      )}

      {/* ── Critical alert banner ───────────────────────────────────────── */}
      {criticalCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/8">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse shrink-0" />
          <p className="text-xs text-red-400 font-semibold">
            {criticalCount} critical case{criticalCount !== 1 ? "s" : ""}{" "}
            require
            {criticalCount === 1 ? "s" : ""} immediate attention
          </p>
        </div>
      )}

      {/* ── Stats grid ─────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Open Cases"
            value={stats.openCases}
            accent={stats.openCases > 0 ? "text-orange-400" : "text-kob-text"}
            icon={
              <AlertTriangle
                className={`h-4 w-4 ${stats.openCases > 0 ? "text-orange-400" : "text-kob-muted"}`}
              />
            }
            alert={stats.openCases > 5}
          />
          <StatCard
            label="KYC Pending"
            value={stats.kycPending}
            accent={stats.kycPending > 0 ? "text-sky-400" : "text-kob-text"}
            icon={
              <Users
                className={`h-4 w-4 ${stats.kycPending > 0 ? "text-sky-400" : "text-kob-muted"}`}
              />
            }
          />
          <StatCard
            label="Sanctions Alerts"
            value={stats.sanctionsAlerts}
            accent={
              stats.sanctionsAlerts > 0 ? "text-red-400" : "text-kob-text"
            }
            icon={
              <ShieldCheck
                className={`h-4 w-4 ${stats.sanctionsAlerts > 0 ? "text-red-400" : "text-kob-muted"}`}
              />
            }
            alert={stats.sanctionsAlerts > 0}
          />
          <StatCard
            label="Resolved Today"
            value={stats.resolvedToday}
            accent="text-emerald-400"
            icon={<CheckCircle className="h-4 w-4 text-emerald-400" />}
          />
        </div>
      )}

      {/* ── Cases table ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-kob-gold" />
            <p className="text-sm font-semibold text-kob-text">
              Compliance Cases
            </p>
            {openCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/25 text-[10px] font-bold text-orange-400">
                {openCount} open
              </span>
            )}
          </div>
          <p className="text-[10px] text-kob-muted">{cases.length} total</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <Clock className="h-4 w-4 animate-pulse text-kob-gold" />
            <span className="text-xs text-kob-muted">Loading cases…</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <ShieldCheck className="h-10 w-10 text-emerald-400" />
            <p className="text-sm font-semibold text-kob-text">
              No compliance cases
            </p>
            <p className="text-xs text-kob-muted">
              System is clear — no active flags
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[12px_100px_1fr_120px_90px_60px] gap-4 px-5 py-2.5 border-b border-white/4">
              {["", "Priority", "Subject", "Status", "Created", ""].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest"
                >
                  {h}
                </span>
              ))}
            </div>

            <div className="divide-y divide-white/4">
              {sortedCases.map((c) => {
                const ps = priorityStyle(c.priority);
                const ss = statusStyle(c.status);
                return (
                  <div
                    key={c.id}
                    className={`grid grid-cols-[12px_100px_1fr_120px_90px_60px] gap-4 items-center px-5 py-3.5 border-l-2 hover:bg-white/2 transition-colors ${ps.border}`}
                  >
                    {/* Priority dot */}
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${ps.dot}`}
                    />

                    {/* Priority badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${ps.bg} ${ps.text}`}
                    >
                      {c.priority ?? "normal"}
                    </span>

                    {/* Subject */}
                    <div className="min-w-0">
                      <p className="text-sm text-kob-text truncate">
                        {c.subject || c.description?.slice(0, 60) || "—"}
                      </p>
                      <p className="text-[10px] font-mono text-kob-muted/60 mt-0.5 truncate">
                        {c.caseType}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${ss.dot}`}
                      />
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border capitalize ${ss.bg} ${ss.text}`}
                      >
                        {c.status}
                      </span>
                    </div>

                    {/* Created */}
                    <div>
                      <p className="text-[10px] text-kob-muted">
                        {fmtDate(c.createdAt)}
                      </p>
                      <p className="text-[9px] text-kob-muted/60">
                        {timeAgo(c.createdAt)}
                      </p>
                    </div>

                    {/* View link */}
                    <Link
                      href={`/compliance/${c.id}`}
                      className="text-[11px] font-semibold text-kob-gold hover:text-kob-gold-light transition-colors text-right"
                    >
                      View →
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── KYC quick-link ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/compliance/kyc"
          className="flex items-center justify-between px-5 py-4 rounded-2xl border border-white/8 bg-[#080E20] hover:border-sky-500/30 hover:bg-sky-500/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Users className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-kob-text">
                KYC Review Queue
              </p>
              <p className="text-[10px] text-kob-muted">
                Approve or reject pending submissions
              </p>
            </div>
          </div>
          <span className="text-kob-muted group-hover:text-sky-400 transition-colors text-sm">
            →
          </span>
        </Link>

        <Link
          href="/compliance/sanctions"
          className="flex items-center justify-between px-5 py-4 rounded-2xl border border-white/8 bg-[#080E20] hover:border-red-500/30 hover:bg-red-500/5 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-kob-text">
                Sanctions Screening
              </p>
              <p className="text-[10px] text-kob-muted">
                Manual triggers and screening history
              </p>
            </div>
          </div>
          <span className="text-kob-muted group-hover:text-red-400 transition-colors text-sm">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
