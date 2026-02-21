"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Ban, FileText, Flag, RefreshCw, RotateCcw, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
import { kkGet } from "@/lib/kobklein-api";

// ── Types ────────────────────────────────────────────────────────────────────

type RiskSignals = {
  velocityAlerts: number;
  reversalsLast10Min: number;
  reversalsToday: number;
  openCases: number;
  failedWebhooks: number;
  highSeverityFlagsLastHour: number;
  blockedUsers: number;
  unresolvedFlags: number;
};

type RiskFlag = {
  id: string;
  userId: string;
  type: string;
  severity: number;
  details: string | null;
  resolvedAt: string | null;
  createdAt: string;
  phone?: string;
  email?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/** Maps a 0-100 score to a Tailwind fraction class — avoids inline style */
function riskWidthClass(score: number): string {
  if (score >= 95) return "w-full";
  if (score >= 80) return "w-5/6";
  if (score >= 65) return "w-3/4";
  if (score >= 50) return "w-1/2";
  if (score >= 35) return "w-2/5";
  if (score >= 20) return "w-1/4";
  if (score > 5)  return "w-1/6";
  return "w-0";
}

function parseFlagDetails(raw: string | null): string {
  if (!raw) return "—";
  try {
    const d = JSON.parse(raw);
    const first = Object.entries(d)[0];
    return first ? `${first[0]}: ${first[1]}` : raw;
  } catch {
    return raw.slice(0, 60);
  }
}

function threatLevel(s: RiskSignals | null): {
  level: "ELEVATED" | "GUARDED" | "NORMAL";
  score: number;
  border: string;
  glow: string;
  text: string;
  bg: string;
  dotColor: string;
} {
  if (!s) return { level: "NORMAL", score: 0, border: "border-white/10", glow: "", text: "text-kob-muted", bg: "bg-white/3", dotColor: "bg-kob-muted" };

  const score =
    s.velocityAlerts * 25 +
    s.highSeverityFlagsLastHour * 20 +
    s.blockedUsers * 10 +
    s.reversalsLast10Min * 15 +
    s.unresolvedFlags * 3 +
    s.failedWebhooks * 8;

  if (s.velocityAlerts > 3 || s.highSeverityFlagsLastHour > 2 || s.blockedUsers > 5 || score > 80) {
    return { level: "ELEVATED", score: Math.min(score, 100), border: "border-red-500/40", glow: "shadow-[0_0_40px_rgba(239,68,68,0.15)]", text: "text-red-400", bg: "bg-red-500/8", dotColor: "bg-red-400" };
  }
  if (s.velocityAlerts > 0 || s.highSeverityFlagsLastHour > 0 || s.unresolvedFlags > 10 || score > 20) {
    return { level: "GUARDED", score: Math.min(score, 100), border: "border-kob-gold/35", glow: "shadow-[0_0_40px_rgba(198,167,86,0.12)]", text: "text-kob-gold", bg: "bg-kob-gold/8", dotColor: "bg-kob-gold" };
  }
  return { level: "NORMAL", score: Math.min(score, 100), border: "border-emerald-500/30", glow: "shadow-[0_0_40px_rgba(31,111,74,0.15)]", text: "text-emerald-400", bg: "bg-emerald-500/5", dotColor: "bg-emerald-400" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

type SevStyle = { label: string; dot: string; text: string; bg: string; border: string };

const SEV: Record<number, SevStyle> = {
  4: { label: "Critical", dot: "bg-red-500", text: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/25" },
  3: { label: "High",     dot: "bg-orange-500", text: "text-orange-300", bg: "bg-orange-500/10", border: "border-orange-500/25" },
  2: { label: "Medium",   dot: "bg-kob-gold", text: "text-kob-gold", bg: "bg-kob-gold/10", border: "border-kob-gold/25" },
  1: { label: "Low",      dot: "bg-kob-muted", text: "text-kob-muted", bg: "bg-white/5", border: "border-white/10" },
};

function SeverityBadge({ severity }: { severity: number }) {
  const s = SEV[severity] ?? SEV[1];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${s.text} ${s.bg} ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

type SignalCardProps = {
  label: string;
  value: number | null;
  sub: string;
  icon: React.ReactNode;
  warn?: boolean;
  critical?: boolean;
};

function SignalCard({ label, value, sub, icon, warn, critical }: SignalCardProps) {
  const border = critical && (value ?? 0) > 0
    ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
    : warn && (value ?? 0) > 0
    ? "border-kob-gold/35 shadow-[0_0_20px_rgba(198,167,86,0.1)]"
    : "border-white/8";

  const numColor = critical && (value ?? 0) > 0
    ? "text-red-400"
    : warn && (value ?? 0) > 0
    ? "text-kob-gold"
    : "text-kob-text";

  return (
    <div className={`rounded-2xl border bg-[#080E20] p-4 flex flex-col gap-2 transition-all duration-300 ${border}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-kob-muted uppercase tracking-widest leading-none">{label}</span>
        {icon}
      </div>
      <div className={`text-3xl font-bold tabular-nums leading-none ${numColor}`}>
        {value === null ? <span className="text-kob-muted text-2xl animate-pulse">—</span> : value}
      </div>
      <div className="text-[10px] text-kob-muted">{sub}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RiskPage() {
  const [signals, setSignals] = useState<RiskSignals | null>(null);
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(5);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const tickRef = useRef(5);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sig, flg] = await Promise.all([
        kkGet<RiskSignals>("admin/risk/signals"),
        kkGet<RiskFlag[]>("admin/risk/recent-flags"),
      ]);
      setSignals(sig);
      setFlags(flg ?? []);
      setLastRefresh(new Date());
      tickRef.current = 5;
      setTick(5);
    } catch {
      // silently retry
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 5s with countdown
  useEffect(() => {
    load();
    const countdown = setInterval(() => {
      tickRef.current -= 1;
      setTick(tickRef.current);
      if (tickRef.current <= 0) {
        tickRef.current = 5;
        load();
      }
    }, 1000);
    return () => clearInterval(countdown);
  }, [load]);

  const threat = threatLevel(signals);
  const criticalFlags = flags.filter((f) => f.severity >= 3);
  const otherFlags = flags.filter((f) => f.severity < 3);
  const sortedFlags = [...criticalFlags, ...otherFlags];

  return (
    <div className="space-y-5">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">Risk Command Center</h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Fraud signals, velocity alerts &amp; step-up controls
            {lastRefresh && (
              <span className="ml-2 opacity-50">· {lastRefresh.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-refresh countdown */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/3 border border-white/8 text-xs text-kob-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-kob-gold animate-pulse" />
            Auto {tick}s
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-kob-muted hover:text-kob-text hover:border-white/20 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Threat Level Hero ──────────────────────────────── */}
      <div className={`relative rounded-2xl border overflow-hidden ${threat.border} ${threat.glow} ${threat.bg}`}>
        {/* Scan line animation */}
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-current to-transparent opacity-20 animate-pulse" />

        <div className="relative z-10 flex items-center gap-6 p-5">
          {/* Pulsing shield icon */}
          <div className="relative shrink-0">
            <div className={`absolute inset-0 rounded-full ${threat.dotColor} opacity-20 animate-ping-slow`} />
            <div className={`relative h-14 w-14 rounded-2xl border flex items-center justify-center ${threat.bg} ${threat.border}`}>
              {threat.level === "NORMAL"
                ? <ShieldCheck className={`h-7 w-7 ${threat.text}`} />
                : <ShieldAlert className={`h-7 w-7 ${threat.text}`} />
              }
            </div>
          </div>

          {/* Threat level label */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest mb-0.5">Threat Posture</p>
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-bold tracking-tight ${threat.text}`}>{threat.level}</span>
              <span className="text-xs text-kob-muted font-medium">Risk Score: {threat.score}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/5 w-48">
              <div
                className={`h-full rounded-full transition-all duration-700 ${riskWidthClass(threat.score)} ${threat.level === "ELEVATED" ? "bg-red-500" : threat.level === "GUARDED" ? "bg-kob-gold" : "bg-emerald-500"}`}
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="hidden lg:grid grid-cols-3 gap-x-8 gap-y-1 shrink-0 pr-2">
            {[
              { label: "Velocity Alerts", value: signals?.velocityAlerts ?? "—" },
              { label: "High Severity (1h)", value: signals?.highSeverityFlagsLastHour ?? "—" },
              { label: "Blocked Users", value: signals?.blockedUsers ?? "—" },
              { label: "Reversals (10m)", value: signals?.reversalsLast10Min ?? "—" },
              { label: "Open Cases", value: signals?.openCases ?? "—" },
              { label: "Unresolved Flags", value: signals?.unresolvedFlags ?? "—" },
            ].map((s) => (
              <div key={s.label} className="text-right">
                <p className="text-[10px] text-kob-muted leading-none">{s.label}</p>
                <p className={`text-lg font-bold tabular-nums leading-tight ${threat.text}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Model badge */}
          <div className="shrink-0 hidden xl:block">
            <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-center">
              <p className="text-[10px] text-kob-muted mb-0.5">Risk Model</p>
              <p className="text-xs font-semibold text-kob-gold">Balanced</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Signal Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SignalCard
          label="Velocity Alerts"
          value={signals?.velocityAlerts ?? null}
          sub="Transactions last 10 min"
          icon={<Zap className="h-4 w-4 text-yellow-400" />}
          critical
        />
        <SignalCard
          label="High Severity (1h)"
          value={signals?.highSeverityFlagsLastHour ?? null}
          sub="Flags raised this hour"
          icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
          critical
        />
        <SignalCard
          label="Blocked Users"
          value={signals?.blockedUsers ?? null}
          sub="Active blocks in system"
          icon={<Ban className="h-4 w-4 text-red-400" />}
          critical
        />
        <SignalCard
          label="Reversals"
          value={signals?.reversalsLast10Min ?? null}
          sub={`Last 10 min · Today: ${signals?.reversalsToday ?? "—"}`}
          icon={<RotateCcw className="h-4 w-4 text-orange-400" />}
          warn
        />
        <SignalCard
          label="Open Cases"
          value={signals?.openCases ?? null}
          sub="Active investigations"
          icon={<FileText className="h-4 w-4 text-sky-400" />}
        />
        <SignalCard
          label="Unresolved Flags"
          value={signals?.unresolvedFlags ?? null}
          sub="Awaiting review"
          icon={<Flag className="h-4 w-4 text-kob-gold" />}
          warn
        />
        <SignalCard
          label="Failed Webhooks"
          value={signals?.failedWebhooks ?? null}
          sub="Delivery failures"
          icon={<AlertTriangle className="h-4 w-4 text-orange-400" />}
          warn
        />

        {/* Model status card */}
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-medium text-kob-muted uppercase tracking-widest">Auto-Refresh</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-1 flex-1">
                {[5, 4, 3, 2, 1].map((v) => (
                  <div
                    key={v}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${tick >= v ? "bg-kob-gold" : "bg-white/10"}`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-kob-gold tabular-nums w-5 text-right">{tick}s</span>
            </div>
            <p className="text-[10px] text-kob-muted mt-2">
              Model: <span className="text-kob-text font-medium">Balanced</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Active Risk Flags Table ────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-4 w-4 text-kob-muted" />
            <span className="text-sm font-semibold text-kob-text">Active Risk Flags</span>
            {flags.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/25 text-[10px] font-bold text-red-400">
                {flags.length}
              </span>
            )}
          </div>
          <span className="text-[10px] text-kob-muted">Unresolved · sorted by severity</span>
        </div>

        {/* Empty state */}
        {sortedFlags.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-kob-text">No unresolved risk flags</p>
            <p className="text-xs text-kob-muted">All systems nominal — threat posture is {threat.level}</p>
          </div>
        )}

        {/* Table */}
        {sortedFlags.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/4">
                  {["Severity", "Type", "User", "Details", "When"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold text-kob-muted uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {sortedFlags.map((f) => {
                  const sev = SEV[f.severity] ?? SEV[1];
                  const details = parseFlagDetails(f.details);
                  const isCritical = f.severity >= 3;
                  return (
                    <tr
                      key={f.id}
                      className={`group transition-colors duration-100 hover:bg-white/3 ${isCritical ? "bg-red-500/3" : ""}`}
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <SeverityBadge severity={f.severity} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-semibold text-kob-text font-mono">{f.type}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-mono text-kob-body">{f.userId?.slice(0, 8)}…</p>
                        {f.phone && (
                          <p className="text-[10px] text-kob-muted mt-0.5">{f.phone}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <span className="text-xs text-kob-muted truncate block max-w-70">{details}</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`text-xs ${sev.text}`}>{timeAgo(f.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
