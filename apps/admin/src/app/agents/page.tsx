"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { kkGet } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Agent = {
  distributorId: string;
  name: string;
  city: string;
  floatBalance: number;
  threshold: number;
  todayVolume: number;
  todayCashoutCount: number;
  lastCashout: string | null;
  status: "green" | "warning" | "critical";
  riskSignals: string[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHTG(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "HTG",
    minimumFractionDigits: 0,
  }).format(n);
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Signal badge ──────────────────────────────────────────────────────────────

const SIGNAL_STYLE: Record<
  string,
  { label: string; text: string; bg: string }
> = {
  ZERO_BALANCE: {
    label: "Zero Balance",
    text: "text-red-400",
    bg: "bg-red-500/10 border-red-500/25",
  },
  BELOW_THRESHOLD: {
    label: "Below Threshold",
    text: "text-red-400",
    bg: "bg-red-500/10 border-red-500/25",
  },
  APPROACHING_THRESHOLD: {
    label: "Approaching",
    text: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/25",
  },
  HIGH_VELOCITY: {
    label: "High Velocity",
    text: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/25",
  },
  NEVER_CASHED_OUT: {
    label: "Never Cashed Out",
    text: "text-kob-muted",
    bg: "bg-white/5 border-white/10",
  },
  INACTIVE_24H: {
    label: "Inactive 24h+",
    text: "text-kob-muted",
    bg: "bg-white/5 border-white/10",
  },
};

function signalStyle(sig: string) {
  return (
    SIGNAL_STYLE[sig] ?? {
      label: sig,
      text: "text-kob-muted",
      bg: "bg-white/5 border-white/10",
    }
  );
}

// ── Status colors ─────────────────────────────────────────────────────────────

function statusDot(s: "green" | "warning" | "critical"): string {
  if (s === "critical") return "bg-red-500 animate-pulse";
  if (s === "warning") return "bg-orange-400";
  return "bg-emerald-400";
}

function floatColor(s: "green" | "warning" | "critical"): string {
  if (s === "critical") return "text-red-400";
  if (s === "warning") return "text-orange-400";
  return "text-emerald-400";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [rows, setRows] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<Agent[]>("v1/admin/liquidity/agents");
      setRows(data ?? []);
      setLastRefresh(new Date());
    } catch {
      // silent — stale data stays
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  const critical = rows.filter((a) => a.status === "critical");
  const warning = rows.filter((a) => a.status === "warning");
  const healthy = rows.filter((a) => a.status === "green");
  const totalFloat = rows.reduce((s, a) => s + a.floatBalance, 0);
  const totalVolume = rows.reduce((s, a) => s + a.todayVolume, 0);

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">
            Agent Liquidity Monitor
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Real-time distributor float health · auto-refresh 10s
            {lastRefresh && (
              <span className="ml-2 text-kob-muted/50">
                · updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
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

      {/* ── Critical alert banner ───────────────────────────────────────── */}
      {critical.length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/6 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse shrink-0" />
            <p className="text-xs font-bold text-red-400">
              {critical.length} agent{critical.length !== 1 ? "s" : ""} require
              {critical.length === 1 ? "s" : ""} immediate float refill
            </p>
          </div>
          <div className="space-y-1 pl-4">
            {critical.map((a) => (
              <div
                key={a.distributorId}
                className="flex items-center justify-between text-[11px]"
              >
                <span className="text-red-300/80 font-medium">
                  {a.name}
                  {a.city ? (
                    <span className="text-kob-muted/60 ml-1">({a.city})</span>
                  ) : null}
                </span>
                <span className="font-mono font-bold text-red-400">
                  {fmtHTG(a.floatBalance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Agents */}
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
            <Users className="h-3.5 w-3.5 text-kob-muted" />
          </div>
          <div>
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">
              Agents
            </p>
            <p className="text-xl font-bold text-kob-text tabular-nums">
              {rows.length}
            </p>
          </div>
        </div>

        {/* Healthy */}
        <div className="rounded-2xl border border-emerald-500/15 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">
              Healthy
            </p>
            <p className="text-xl font-bold text-emerald-400 tabular-nums">
              {healthy.length}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-2xl border border-orange-500/15 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <div>
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">
              Warning
            </p>
            <p className="text-xl font-bold text-orange-400 tabular-nums">
              {warning.length}
            </p>
          </div>
        </div>

        {/* Critical */}
        <div
          className={`rounded-2xl border bg-[#080E20] p-4 flex items-center gap-3 ${
            critical.length > 0 ? "border-red-500/30" : "border-white/8"
          }`}
        >
          <div
            className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
              critical.length > 0
                ? "bg-red-500/10 border-red-500/20"
                : "bg-white/5 border-white/8"
            }`}
          >
            <AlertTriangle
              className={`h-3.5 w-3.5 ${critical.length > 0 ? "text-red-400" : "text-kob-muted"}`}
            />
          </div>
          <div>
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">
              Critical
            </p>
            <p
              className={`text-xl font-bold tabular-nums ${critical.length > 0 ? "text-red-400" : "text-kob-text"}`}
            >
              {critical.length}
            </p>
          </div>
        </div>

        {/* Network Float */}
        <div className="rounded-2xl border border-kob-gold/15 bg-[#080E20] p-4 flex items-center gap-3 lg:col-span-1 col-span-2">
          <div className="h-8 w-8 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0">
            <TrendingDown className="h-3.5 w-3.5 text-kob-gold" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">
              Network Float
            </p>
            <p className="text-xl font-bold text-kob-gold tabular-nums truncate">
              {fmtHTG(totalFloat)}
            </p>
            <p className="text-[9px] text-kob-muted mt-0.5">
              Today out: {fmtHTG(totalVolume)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Agent table ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-kob-gold" />
            <p className="text-sm font-semibold text-kob-text">All Agents</p>
          </div>
          <p className="text-[10px] text-kob-muted">
            {rows.length} active distributor{rows.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Column labels */}
        {rows.length > 0 && (
          <div className="grid grid-cols-[12px_1fr_110px_120px_90px_1fr] gap-4 px-5 py-2.5 border-b border-white/4">
            {[
              "",
              "Agent",
              "Float Balance",
              "Today Volume",
              "Last Cash-out",
              "Risk Signals",
            ].map((h) => (
              <span
                key={h}
                className="text-[9px] font-semibold text-kob-muted uppercase tracking-widest"
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && rows.length === 0 && (
          <div className="flex items-center justify-center py-14 gap-2">
            <Clock className="h-4 w-4 animate-pulse text-kob-gold" />
            <span className="text-xs text-kob-muted">Loading agents…</span>
          </div>
        )}

        {/* Empty */}
        {!loading && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Users className="h-10 w-10 text-kob-muted/30" />
            <p className="text-sm font-semibold text-kob-text">
              No active agents
            </p>
            <p className="text-xs text-kob-muted">
              No distributors with active status registered
            </p>
          </div>
        )}

        {/* Rows */}
        {rows.length > 0 && (
          <div className="divide-y divide-white/4">
            {rows.map((a) => (
              <div
                key={a.distributorId}
                className="grid grid-cols-[12px_1fr_110px_120px_90px_1fr] gap-4 items-center px-5 py-3.5 hover:bg-white/2 transition-colors"
              >
                {/* Status dot */}
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${statusDot(a.status)}`}
                />

                {/* Agent name + city */}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-kob-text truncate">
                    {a.name || "—"}
                  </p>
                  {a.city && (
                    <p className="text-[10px] text-kob-muted truncate">
                      {a.city}
                    </p>
                  )}
                </div>

                {/* Float balance */}
                <div>
                  <p
                    className={`text-xs font-bold font-mono tabular-nums ${floatColor(a.status)}`}
                  >
                    {fmtHTG(a.floatBalance)}
                  </p>
                  <p className="text-[9px] text-kob-muted/60 font-mono">
                    min {fmtHTG(a.threshold)}
                  </p>
                </div>

                {/* Today volume */}
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-kob-muted/50 shrink-0" />
                  <div>
                    <p className="text-xs font-mono text-kob-text tabular-nums">
                      {fmtHTG(a.todayVolume)}
                    </p>
                    <p className="text-[9px] text-kob-muted/60">
                      {a.todayCashoutCount} tx
                    </p>
                  </div>
                </div>

                {/* Last cash-out */}
                <div>
                  {a.lastCashout ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-kob-muted/50 shrink-0" />
                      <span className="text-[10px] text-kob-muted">
                        {timeAgo(a.lastCashout)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-kob-muted/50">—</span>
                  )}
                </div>

                {/* Risk signals */}
                <div className="flex flex-wrap gap-1 min-w-0">
                  {a.riskSignals.length === 0 ? (
                    <span className="text-[10px] text-kob-muted/40">None</span>
                  ) : (
                    a.riskSignals.map((sig) => {
                      const ss = signalStyle(sig);
                      return (
                        <span
                          key={sig}
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${ss.bg} ${ss.text}`}
                        >
                          {ss.label}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
