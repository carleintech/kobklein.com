"use client";

import { useEffect, useState, useCallback } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { RefreshCw, Copy, FileText, CheckCircle } from "lucide-react";

type Withdrawal = {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: string;
  userId?: string;
  expiresAt?: string;
  createdAt: string;
};

// ── Badge helpers ──────────────────────────────────────────────────────────────

function ageBadgeClass(seconds: number) {
  if (seconds > 300) return "bg-red-500/15 text-red-400";
  if (seconds > 120) return "bg-yellow-500/15 text-yellow-400";
  return "bg-emerald-500/15 text-emerald-400";
}

function expiryBadgeClass(seconds: number) {
  if (seconds <= 0) return "bg-red-500/15 text-red-400";
  if (seconds < 300) return "bg-yellow-500/15 text-yellow-400";
  return "bg-emerald-500/15 text-emerald-400";
}

function statusBadgeClass(status: string) {
  if (status === "completed") return "bg-emerald-500/15 text-emerald-400";
  if (status === "reversed") return "bg-red-500/15 text-red-400";
  return "bg-white/8 text-kob-muted";
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const [rows, setRows] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data: Withdrawal[];
      try {
        data = await kkGet<Withdrawal[]>("admin/withdrawals/pending");
      } catch {
        const activity = await kkGet<{ recentWithdrawals?: Withdrawal[] }>(
          "admin/recent-activity",
        );
        data = (activity.recentWithdrawals ?? []).filter(
          (w) => w.status === "pending",
        );
      }
      setRows(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Failed to load withdrawals:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  async function approve(code: string) {
    try {
      await kkPost(`admin/withdrawals/${code}/approve`, {});
      await load();
    } catch {
      alert("Approval failed — check console for details");
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  function ageSeconds(createdAt: string) {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  }

  function formatAge(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }

  function fmt(n: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "HTG",
      minimumFractionDigits: 0,
    }).format(n);
  }

  const pending = rows.filter((w) => w.status === "pending");
  const completed = rows.filter((w) => w.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-kob-text">
            Live Operations
          </h1>
          <p className="text-sm text-kob-muted">
            Pending withdrawals &amp; cash-out control
            {lastRefresh && (
              <span className="ml-2 text-xs opacity-60">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#080E20] px-3 py-1.5 text-xs text-kob-muted hover:text-kob-text hover:border-white/15 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Pending Withdrawals */}
      <div className="rounded-xl border border-white/8 bg-[#080E20] p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="font-medium text-kob-text">Pending Withdrawals</span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-yellow-500/15 text-yellow-400 ml-1">
            {pending.length}
          </span>
          <span className="ml-auto text-xs text-kob-muted">Auto-refresh: 5s</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/8">
                {["Code", "Amount", "Currency", "Age", "Expires", "Actions"].map(
                  (h, i) => (
                    <th
                      key={"col-" + i}
                      className={`py-2 pr-4 font-medium text-[10px] uppercase tracking-wider text-kob-muted ${i === 5 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-kob-muted">
                    <CheckCircle
                      size={18}
                      className="mx-auto mb-2 text-emerald-400"
                    />
                    No pending withdrawals — all clear
                  </td>
                </tr>
              )}

              {pending.map((w) => {
                const age = ageSeconds(w.createdAt);
                const expiresIn = w.expiresAt
                  ? Math.floor(
                      (new Date(w.expiresAt).getTime() - Date.now()) / 1000,
                    )
                  : null;
                return (
                  <tr
                    key={w.id}
                    className="border-t border-white/5 hover:bg-white/2 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono font-medium text-kob-text">
                      {w.code}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-kob-text">
                      {fmt(w.amount)}
                    </td>
                    <td className="py-3 pr-4 text-kob-muted">{w.currency}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ageBadgeClass(age)}`}
                      >
                        {formatAge(age)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {expiresIn !== null ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${expiryBadgeClass(expiresIn)}`}
                        >
                          {expiresIn <= 0
                            ? "Expired"
                            : `${Math.floor(expiresIn / 60)}m left`}
                        </span>
                      ) : (
                        <span className="text-kob-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Copy code"
                          onClick={() => copyCode(w.code)}
                          className="flex items-center justify-center w-7 h-7 rounded-md border border-white/8 bg-[#060912] text-kob-muted hover:text-kob-text transition-colors"
                        >
                          <Copy
                            size={12}
                            className={copied === w.code ? "text-emerald-400" : ""}
                          />
                        </button>
                        <button
                          type="button"
                          title="Open case"
                          onClick={() =>
                            window.open(`/cases?code=${w.code}`, "_self")
                          }
                          className="flex items-center justify-center w-7 h-7 rounded-md border border-white/8 bg-[#060912] text-kob-muted hover:text-kob-text transition-colors"
                        >
                          <FileText size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => approve(w.code)}
                          className="rounded-lg bg-kob-gold text-[#080B14] px-3 py-1 text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recently Completed */}
      {completed.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-[#080E20] p-5">
          <div className="font-medium text-kob-muted mb-4">
            Recently Completed
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/8">
                  {["Code", "Amount", "Currency", "Status", "Age"].map((h, i) => (
                    <th
                      key={"col-" + i}
                      className="py-2 pr-4 font-medium text-[10px] uppercase tracking-wider text-kob-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completed.map((w) => (
                  <tr key={w.id} className="border-t border-white/5">
                    <td className="py-3 pr-4 font-mono text-kob-text">
                      {w.code}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-kob-text">
                      {fmt(w.amount)}
                    </td>
                    <td className="py-3 pr-4 text-kob-muted">{w.currency}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(w.status)}`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 text-kob-muted">
                      {formatAge(ageSeconds(w.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
