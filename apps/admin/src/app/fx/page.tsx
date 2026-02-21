"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, DollarSign, RefreshCw, TrendingUp } from "lucide-react";
import { ApiError, kkGet, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type FxRate = {
  id: string;
  mid: number;
  buy: number;
  sell: number;
  spreadBps: number;
  source: string;
  createdAt: string;
};

type FxHistoryEntry = FxRate & { active: boolean };

type FxRevenue = {
  totalUsdConverted?: number;
  totalHtgDelivered?: number;
  totalProfitHtg?: number;
  periodDays?: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHTG(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function timeAgo(d: string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SOURCE_LABELS: Record<string, string> = {
  admin_manual: "Manual",
  bnm: "BNM Feed",
  coinbase: "Coinbase",
  auto: "Auto",
};

// ── Live Rate Hero ────────────────────────────────────────────────────────────

function RateHero({ rate }: { rate: FxRate | null }) {
  if (!rate) {
    return (
      <div className="rounded-2xl border border-white/8 bg-[#080E20] flex items-center justify-center py-12">
        <p className="text-sm text-kob-muted">No active FX rate configured</p>
      </div>
    );
  }

  const spreadPct = (rate.spreadBps / 100).toFixed(2);

  return (
    <div className="relative rounded-2xl border border-kob-gold/25 bg-[#080E20] overflow-hidden">
      {/* Accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-kob-gold/60 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full bg-kob-gold/4 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6">
        {/* Main rate display */}
        <div className="flex items-stretch justify-center gap-0 mb-6">
          {/* Buy side */}
          <div className="flex-1 flex flex-col items-center justify-center gap-1 pr-8 border-r border-white/8">
            <div className="flex items-center gap-1.5">
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">Buy</span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-emerald-400">{rate.buy.toFixed(4)}</p>
            <p className="text-[10px] text-kob-muted">User receives</p>
          </div>

          {/* Mid rate — center spotlight */}
          <div className="flex flex-col items-center justify-center gap-2 px-10">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="h-4 w-4 text-kob-gold" />
              <span className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">Mid Rate</span>
            </div>
            <p className="text-5xl font-bold tabular-nums text-kob-text">{rate.mid.toFixed(2)}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-kob-muted">USD</span>
              <ArrowRightLeft className="h-2.5 w-2.5 text-kob-muted" />
              <span className="text-[10px] font-medium text-kob-muted">HTG</span>
            </div>
          </div>

          {/* Sell side */}
          <div className="flex-1 flex flex-col items-center justify-center gap-1 pl-8 border-l border-white/8">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[10px] font-semibold text-red-400 uppercase tracking-widest">Sell</span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-red-400">{rate.sell.toFixed(4)}</p>
            <p className="text-[10px] text-kob-muted">Platform sells</p>
          </div>
        </div>

        {/* Bottom metadata strip */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/6 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-kob-muted">Spread</span>
            <span className="px-2 py-0.5 rounded-md bg-kob-gold/10 border border-kob-gold/20 font-bold text-kob-gold">
              {rate.spreadBps} bps ({spreadPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-kob-muted">Source</span>
            <span className="font-medium text-kob-text">{SOURCE_LABELS[rate.source] ?? rate.source}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">Active</span>
          </div>
          <div className="ml-auto text-kob-muted">
            Updated {timeAgo(rate.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Set Rate Form ─────────────────────────────────────────────────────────────

function SetRatePanel({ onSuccess }: { onSuccess: () => void }) {
  const [mid, setMid] = useState("");
  const [spreadBps, setSpreadBps] = useState("250");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Live preview
  const midNum = Number(mid);
  const spreadNum = Number(spreadBps);
  const halfSpread = spreadNum / 10000 / 2;
  const previewBuy = midNum > 0 ? (midNum * (1 - halfSpread)).toFixed(4) : null;
  const previewSell = midNum > 0 ? (midNum * (1 + halfSpread)).toFixed(4) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await kkPost("v1/admin/fx/set", {
        mid: midNum,
        spreadBps: spreadNum,
        source: "admin_manual",
      });
      setMessage({ text: "FX rate updated successfully", ok: true });
      setMid("");
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set rate";
      setMessage({ text: msg, ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080E20] p-5">
      <p className="text-xs font-semibold text-kob-muted uppercase tracking-widest mb-4">Set New FX Rate</p>

      <form onSubmit={handleSubmit}>
        <div className="flex items-end gap-3 max-w-xl">
          {/* Mid Rate */}
          <div className="flex-1">
            <label htmlFor="fx-mid" className="text-[10px] font-medium text-kob-muted uppercase tracking-wide mb-1.5 block">
              Mid Rate (USD → HTG)
            </label>
            <div className="relative">
              <input
                id="fx-mid"
                type="number"
                step="0.01"
                min="1"
                required
                value={mid}
                onChange={(e) => setMid(e.target.value)}
                placeholder="e.g. 133.50"
                className="w-full rounded-xl bg-kob-panel/60 border border-white/10 text-sm text-kob-text placeholder:text-kob-muted px-3 py-2.5 outline-none focus:border-kob-gold/50 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-kob-muted font-medium">HTG</span>
            </div>
          </div>

          {/* Spread */}
          <div className="w-36">
            <label htmlFor="fx-spread" className="text-[10px] font-medium text-kob-muted uppercase tracking-wide mb-1.5 block">
              Spread (bps)
            </label>
            <div className="relative">
              <input
                id="fx-spread"
                type="number"
                step="1"
                min="0"
                value={spreadBps}
                onChange={(e) => setSpreadBps(e.target.value)}
                className="w-full rounded-xl bg-kob-panel/60 border border-white/10 text-sm text-kob-text px-3 py-2.5 outline-none focus:border-kob-gold/50 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-kob-muted">bps</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !mid}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kob-gold/90 text-kob-black font-bold text-sm hover:bg-kob-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {submitting ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Setting…</> : "Set Rate"}
          </button>
        </div>

        {/* Live preview */}
        {previewBuy && previewSell && (
          <div className="flex items-center gap-6 mt-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/6 text-xs">
            <span className="text-kob-muted">Preview:</span>
            <span className="flex items-center gap-1">
              <ArrowDownLeft className="h-3 w-3 text-emerald-400" />
              <span className="text-kob-muted">Buy</span>
              <span className="font-bold text-emerald-400 tabular-nums">{previewBuy}</span>
            </span>
            <span className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-red-400" />
              <span className="text-kob-muted">Sell</span>
              <span className="font-bold text-red-400 tabular-nums">{previewSell}</span>
            </span>
            <span className="text-kob-muted">
              Spread: <span className="text-kob-gold font-semibold">{spreadNum} bps ({(spreadNum / 100).toFixed(2)}%)</span>
            </span>
          </div>
        )}

        {/* Feedback */}
        {message && (
          <p className={`mt-2 text-xs font-medium ${message.ok ? "text-emerald-400" : "text-red-400"}`}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FxPage() {
  const [rate, setRate] = useState<FxRate | null>(null);
  const [history, setHistory] = useState<FxHistoryEntry[]>([]);
  const [revenue, setRevenue] = useState<FxRevenue | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiDown, setApiDown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setApiDown(false);
    try {
      const [r, h, rev] = await Promise.all([
        kkGet<{ rate: FxRate | null }>("v1/admin/fx/active"),
        kkGet<{ history: FxHistoryEntry[] }>("v1/admin/fx/history"),
        kkGet<FxRevenue>("v1/admin/fx/revenue?days=30"),
      ]);
      setRate(r?.rate ?? null);
      setHistory(h?.history ?? []);
      setRevenue(rev ?? null);
    } catch (e) {
      if (e instanceof ApiError && e.isApiUnavailable) setApiDown(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">FX Control</h1>
          <p className="text-xs text-kob-muted mt-0.5">Manage USD/HTG exchange rates &amp; spread</p>
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

      {/* API down banner */}
      {apiDown && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/8 border border-yellow-500/20">
          <span className="h-2 w-2 rounded-full bg-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-300 font-medium">API unavailable — showing cached data</p>
        </div>
      )}

      {/* ── Live Rate Hero ──────────────────────────────────── */}
      <RateHero rate={rate} />

      {/* ── Revenue Stats ──────────────────────────────────── */}
      {revenue && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "USD Converted (30d)", value: `$${(revenue.totalUsdConverted ?? 0).toLocaleString()}`, icon: <DollarSign className="h-5 w-5 text-sky-400" />, accent: "bg-sky-500/10 border-sky-500/20" },
            { label: "HTG Delivered (30d)", value: `${fmtHTG(revenue.totalHtgDelivered ?? 0)} HTG`, icon: <ArrowRightLeft className="h-5 w-5 text-kob-gold" />, accent: "bg-kob-gold/10 border-kob-gold/20" },
            { label: "FX Profit (30d)", value: `${fmtHTG(revenue.totalProfitHtg ?? 0)} HTG`, icon: <TrendingUp className="h-5 w-5 text-emerald-400" />, accent: "bg-emerald-500/10 border-emerald-500/20" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${s.accent}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-[10px] font-medium text-kob-muted uppercase tracking-widest">{s.label}</p>
                <p className="text-lg font-bold tabular-nums text-kob-text leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Set Rate Panel ─────────────────────────────────── */}
      <SetRatePanel onSuccess={load} />

      {/* ── Rate History ────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <p className="text-sm font-semibold text-kob-text">Rate History</p>
          <span className="text-[10px] text-kob-muted">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <p className="text-sm text-kob-muted">No FX rate history</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[90px_90px_90px_90px_100px_80px_1fr] gap-x-4 px-5 py-2.5 border-b border-white/4">
              {["Mid", "Buy", "Sell", "Spread", "Source", "Status", "Set At"].map((h) => (
                <span key={h} className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-white/4">
              {history.map((r) => (
                <div
                  key={r.id}
                  className={`grid grid-cols-[90px_90px_90px_90px_100px_80px_1fr] gap-x-4 items-center px-5 py-3 border-l-2 transition-colors hover:bg-white/2 ${r.active ? "border-l-kob-gold/50 bg-kob-gold/3" : "border-l-transparent"}`}
                >
                  <span className={`text-xs font-bold tabular-nums ${r.active ? "text-kob-gold" : "text-kob-text"}`}>
                    {r.mid.toFixed(2)}
                  </span>
                  <span className="text-xs tabular-nums text-emerald-400">{r.buy.toFixed(4)}</span>
                  <span className="text-xs tabular-nums text-red-400">{r.sell.toFixed(4)}</span>
                  <span className="text-xs tabular-nums text-kob-body">{r.spreadBps} bps</span>
                  <span className="text-xs text-kob-muted">{SOURCE_LABELS[r.source] ?? r.source}</span>

                  {/* Status */}
                  {r.active ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-kob-muted">Inactive</span>
                  )}

                  <span className="text-[10px] text-kob-muted">{timeAgo(r.createdAt)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
