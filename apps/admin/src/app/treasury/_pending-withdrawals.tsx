"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react";
import { kkGet, kkPost } from "@/lib/kobklein-api";

type Withdrawal = {
  id: string;
  code: string;
  amount: number;
  currency: string;
  status: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
};

function fmtAmount(n: number, currency: string) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n.toLocaleString()} ${currency}`;
}

function expiryLabel(iso: string): { text: string; urgent: boolean } {
  const msLeft = new Date(iso).getTime() - Date.now();
  if (msLeft <= 0) return { text: "Expired", urgent: true };
  const mins = Math.floor(msLeft / 60_000);
  if (mins < 30) return { text: `${mins}m left`, urgent: true };
  const hrs = Math.floor(mins / 60);
  if (hrs < 2) return { text: `${hrs}h ${mins % 60}m left`, urgent: false };
  return { text: `${hrs}h left`, urgent: false };
}

export function PendingWithdrawals() {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<Withdrawal[]>("admin/withdrawals/pending");
      setItems(data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(code: string) {
    setApproving(code);
    setErrors((p) => ({ ...p, [code]: "" }));
    try {
      await kkPost(`admin/withdrawals/${code}/approve`, {});
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Approve failed";
      setErrors((p) => ({ ...p, [code]: msg }));
    } finally {
      setApproving(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-kob-gold" />
          <span className="text-sm font-semibold text-kob-text">Pending Withdrawals</span>
          {items.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-kob-gold/15 border border-kob-gold/25 text-[10px] font-bold text-kob-gold">
              {items.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-kob-muted hover:text-kob-text transition-all"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-center justify-center py-10 gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-kob-gold" />
          <span className="text-xs text-kob-muted">Loading withdrawals…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <p className="text-sm font-semibold text-kob-text">No pending withdrawals</p>
          <p className="text-xs text-kob-muted">All cash-out codes have been processed</p>
        </div>
      )}

      {/* Withdrawal rows */}
      {!loading && items.length > 0 && (
        <div className="divide-y divide-white/4">
          {items.map((w) => {
            const expiry = expiryLabel(w.expiresAt);
            return (
              <div key={w.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                {/* Code */}
                <div className="shrink-0">
                  <p className="text-[10px] text-kob-muted mb-0.5">Code</p>
                  <p className="text-sm font-bold font-mono text-kob-gold tracking-wider">{w.code}</p>
                </div>

                {/* Amount */}
                <div className="shrink-0 min-w-24">
                  <p className="text-[10px] text-kob-muted mb-0.5">Amount</p>
                  <p className="text-sm font-bold tabular-nums text-kob-text">{fmtAmount(w.amount, w.currency)}</p>
                </div>

                {/* User */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-kob-muted mb-0.5">User</p>
                  <p className="text-xs font-mono text-kob-body truncate">{w.userId.slice(0, 12)}…</p>
                </div>

                {/* Expiry */}
                <div className="shrink-0">
                  <p className="text-[10px] text-kob-muted mb-0.5">Expires</p>
                  <span className={`text-xs font-semibold ${expiry.urgent ? "text-red-400" : "text-kob-muted"}`}>
                    {expiry.text}
                  </span>
                </div>

                {/* Approve */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <button
                    type="button"
                    disabled={approving === w.code}
                    onClick={() => handleApprove(w.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/12 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/22 hover:border-emerald-500/40 transition-all disabled:opacity-40"
                  >
                    {approving === w.code
                      ? <><Loader2 className="h-3 w-3 animate-spin" />Approving…</>
                      : <><CheckCircle2 className="h-3 w-3" />Approve</>
                    }
                  </button>
                  {errors[w.code] && (
                    <p className="text-[10px] text-red-400">{errors[w.code]}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
