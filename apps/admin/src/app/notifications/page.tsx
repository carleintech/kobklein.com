"use client";

import {
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Stats = {
  total: number;
  sent: number;
  failed: number;
  queued: number;
  todaySent: number;
  todayFailed: number;
};

type NotifLog = {
  id: string;
  channel: string;
  type: string;
  to: string;
  body: string;
  status: string;
  error: string | null;
  jobId: string | null;
  userId: string | null;
  attempts: number;
  sentAt: string | null;
  createdAt: string;
  firstName?: string;
  email?: string;
};

type FilterStatus = "all" | "sent" | "failed" | "queued";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { text: string; bg: string; dot: string }> =
  {
    sent: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/25",
      dot: "bg-emerald-400",
    },
    failed: {
      text: "text-red-400",
      bg: "bg-red-500/10 border-red-500/25",
      dot: "bg-red-400",
    },
    queued: {
      text: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/25",
      dot: "bg-orange-400",
    },
  };

const CHANNEL_STYLE: Record<string, { text: string; bg: string }> = {
  sms: { text: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  email: {
    text: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  push: { text: "text-kob-gold", bg: "bg-kob-gold/10 border-kob-gold/20" },
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

function channelStyle(c: string) {
  return (
    CHANNEL_STYLE[c.toLowerCase()] ?? {
      text: "text-kob-muted",
      bg: "bg-white/5 border-white/10",
    }
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<Record<string, string>>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        kkGet<Stats>("v1/admin/notifications/stats"),
        kkGet<{ rows: NotifLog[]; total: number }>(
          `v1/admin/notifications/logs?status=${filter}&limit=50`,
        ),
      ]);
      setStats(s);
      setLogs(l.rows ?? []);
      setTotal(l.total ?? 0);
      setLastRefresh(new Date());
    } catch {
      // silent — stale data stays
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  async function handleRetry(id: string) {
    setRetrying(id);
    setRetryError((p) => ({ ...p, [id]: "" }));
    try {
      await kkPost(`v1/admin/notifications/${id}/retry`, {});
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Retry failed";
      setRetryError((p) => ({ ...p, [id]: msg }));
    } finally {
      setRetrying(null);
    }
  }

  const failedCount = stats?.failed ?? 0;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">
            Notification Delivery
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            SMS, email & push logs · status tracking · retries · auto-refresh
            10s
            {lastRefresh && (
              <span className="ml-2 text-kob-muted/50">
                · {lastRefresh.toLocaleTimeString()}
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

      {/* ── Failure alert ────────────────────────────────────────────────── */}
      {failedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/8">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse shrink-0" />
          <p className="text-xs text-red-400 font-semibold">
            {failedCount} failed notification{failedCount !== 1 ? "s" : ""} —
            use Retry to re-queue
          </p>
        </div>
      )}

      {/* ── KPI grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Sent */}
        <div className="rounded-2xl border border-emerald-500/15 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">
              Total Sent
            </p>
            <p className="text-xl font-bold text-emerald-400 tabular-nums">
              {stats?.sent ?? "—"}
            </p>
            <p className="text-[9px] text-kob-muted/60">
              Today: {stats?.todaySent ?? 0}
            </p>
          </div>
        </div>

        {/* Failed */}
        <div
          className={`rounded-2xl border bg-[#080E20] p-4 flex items-center gap-3 ${
            failedCount > 0 ? "border-red-500/25" : "border-white/8"
          }`}
        >
          <div
            className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
              failedCount > 0
                ? "bg-red-500/10 border-red-500/20"
                : "bg-white/5 border-white/8"
            }`}
          >
            <XCircle
              className={`h-3.5 w-3.5 ${failedCount > 0 ? "text-red-400" : "text-kob-muted"}`}
            />
          </div>
          <div>
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">
              Failed
            </p>
            <p
              className={`text-xl font-bold tabular-nums ${failedCount > 0 ? "text-red-400" : "text-kob-text"}`}
            >
              {stats?.failed ?? "—"}
            </p>
            <p className="text-[9px] text-kob-muted/60">
              Today: {stats?.todayFailed ?? 0}
            </p>
          </div>
        </div>

        {/* Queued */}
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <Clock className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <div>
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">
              Queued
            </p>
            <p
              className={`text-xl font-bold tabular-nums ${(stats?.queued ?? 0) > 5 ? "text-orange-400" : "text-kob-text"}`}
            >
              {stats?.queued ?? "—"}
            </p>
            <p className="text-[9px] text-kob-muted/60">Awaiting delivery</p>
          </div>
        </div>

        {/* All-time */}
        <div className="rounded-2xl border border-kob-gold/15 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0">
            <MessageSquare className="h-3.5 w-3.5 text-kob-gold" />
          </div>
          <div>
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">
              All-Time
            </p>
            <p className="text-xl font-bold text-kob-gold tabular-nums">
              {stats?.total ?? "—"}
            </p>
            <p className="text-[9px] text-kob-muted/60">Total notifications</p>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {(["all", "sent", "failed", "queued"] as FilterStatus[]).map((f) => {
          const count =
            f !== "all" && stats ? (stats[f as keyof Stats] ?? 0) : null;
          return (
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
              {count !== null && (
                <span
                  className={`ml-1.5 text-[9px] font-bold ${
                    f === "failed" && count > 0
                      ? "text-red-400"
                      : "text-kob-muted/70"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Delivery log ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
        {/* Table header row */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-kob-gold" />
            <p className="text-sm font-semibold text-kob-text">Delivery Log</p>
            <span className="px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-[10px] font-bold text-kob-muted">
              {total}
            </span>
          </div>
        </div>

        {/* Column labels */}
        {logs.length > 0 && (
          <div className="grid grid-cols-[8px_110px_1fr_110px_40px_70px_60px] gap-4 px-5 py-2.5 border-b border-white/4">
            {[
              "",
              "Status · Channel",
              "Recipient · Message",
              "Type",
              "Att",
              "When",
              "",
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
        {loading && logs.length === 0 && (
          <div className="flex items-center justify-center py-14 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-kob-gold" />
            <span className="text-xs text-kob-muted">Loading logs…</span>
          </div>
        )}

        {/* Empty */}
        {!loading && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Send className="h-10 w-10 text-kob-muted/30" />
            <p className="text-sm font-semibold text-kob-text">
              No notifications yet
            </p>
            <p className="text-xs text-kob-muted">
              Delivery logs will appear here
            </p>
          </div>
        )}

        {/* Rows */}
        {logs.length > 0 && (
          <div className="divide-y divide-white/4">
            {logs.map((n) => {
              const ss = statusStyle(n.status);
              const cs = channelStyle(n.channel);
              return (
                <div
                  key={n.id}
                  className="grid grid-cols-[8px_110px_1fr_110px_40px_70px_60px] gap-4 items-start px-5 py-3.5 hover:bg-white/2 transition-colors"
                >
                  {/* Status dot */}
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 mt-1 ${ss.dot}`}
                  />

                  {/* Status + channel */}
                  <div className="space-y-1">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded border text-[9px] font-bold capitalize ${ss.bg} ${ss.text}`}
                    >
                      {n.status}
                    </span>
                    <br />
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${cs.bg} ${cs.text}`}
                    >
                      {n.channel}
                    </span>
                  </div>

                  {/* Recipient + message */}
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[10px] font-mono text-kob-text truncate">
                      {n.to}
                    </p>
                    {n.firstName && (
                      <p className="text-[9px] text-kob-muted/70 truncate">
                        {n.firstName}
                      </p>
                    )}
                    <p
                      className="text-[10px] text-kob-muted truncate"
                      title={n.body}
                    >
                      {n.body}
                    </p>
                    {n.error && (
                      <p
                        className="text-[9px] text-red-400/80 truncate"
                        title={n.error}
                      >
                        ↳ {n.error}
                      </p>
                    )}
                  </div>

                  {/* Type */}
                  <p className="text-[10px] font-mono text-kob-muted/70 truncate">
                    {n.type}
                  </p>

                  {/* Attempts */}
                  <p
                    className={`text-[11px] font-mono tabular-nums font-bold ${n.attempts > 1 ? "text-orange-400" : "text-kob-muted"}`}
                  >
                    {n.attempts}
                  </p>

                  {/* When */}
                  <p className="text-[10px] text-kob-muted">
                    {timeAgo(n.createdAt)}
                  </p>

                  {/* Retry */}
                  <div>
                    {n.status === "failed" && (
                      <div>
                        <button
                          type="button"
                          disabled={retrying === n.id}
                          onClick={() => handleRetry(n.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold text-kob-muted hover:text-kob-gold hover:border-kob-gold/30 transition-all disabled:opacity-40"
                        >
                          <RotateCcw
                            className={`h-3 w-3 ${retrying === n.id ? "animate-spin" : ""}`}
                          />
                          Retry
                        </button>
                        {retryError[n.id] && (
                          <p className="text-[9px] text-red-400 mt-0.5 truncate">
                            {retryError[n.id]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
