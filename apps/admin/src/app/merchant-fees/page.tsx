"use client";

import { Loader2, Percent, RefreshCw, Store } from "lucide-react";
import {
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  useCallback,
  useEffect,
  useState,
} from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type MerchantFeeProfile = {
  id: string;
  merchantId: string;
  mode: string;
  percentBps: number;
  fixedFee: number;
  currency: string;
  active: boolean;
  merchant: {
    businessName: string | null;
    paymentCode: string | null;
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRate(
  mode: string,
  bps: number,
  fixed: number,
  currency: string,
): string {
  if (mode === "percent") return `${bps} bps · ${(bps / 100).toFixed(2)}%`;
  if (mode === "fixed") return `${fixed.toLocaleString()} ${currency}`;
  if (mode === "hybrid")
    return `${bps} bps + ${fixed.toLocaleString()} ${currency}`;
  return "—";
}

const MODE_STYLE: Record<string, { text: string; bg: string; dot: string }> = {
  percent: {
    text: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/25",
    dot: "bg-sky-400",
  },
  fixed: {
    text: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/25",
    dot: "bg-orange-400",
  },
  hybrid: {
    text: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/25",
    dot: "bg-violet-400",
  },
  none: {
    text: "text-kob-muted",
    bg: "bg-white/5 border-white/10",
    dot: "bg-kob-muted",
  },
};

function modeStyle(mode: string) {
  return MODE_STYLE[mode] ?? MODE_STYLE.none;
}

// ── Form primitives ───────────────────────────────────────────────────────────

const fieldCls =
  "w-full h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-kob-text placeholder:text-kob-muted/40 focus:outline-none focus:border-kob-gold/50 focus:bg-white/8 transition-colors";

function FieldInput({
  label,
  id,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[10px] font-medium text-kob-muted uppercase tracking-widest mb-1.5 block"
      >
        {label}
      </label>
      <input id={id} {...props} className={fieldCls} />
      {hint && <p className="text-[9px] text-kob-muted/60 mt-0.5">{hint}</p>}
    </div>
  );
}

function FieldSelect({
  label,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[10px] font-medium text-kob-muted uppercase tracking-widest mb-1.5 block"
      >
        {label}
      </label>
      <select
        id={id}
        {...props}
        className="w-full h-9 rounded-xl border border-white/10 bg-[#0d1528] px-3 text-sm text-kob-text focus:outline-none focus:border-kob-gold/50 transition-colors"
      >
        {children}
      </select>
    </div>
  );
}

// ── Mode hint ─────────────────────────────────────────────────────────────────

const MODE_HINT: Record<string, string> = {
  percent: "Uses bps rate only — fixed fee ignored",
  fixed: "Uses fixed fee only — bps rate ignored",
  hybrid: "Applies both bps rate and fixed fee",
  none: "No fee charged — both fields ignored",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MerchantFeesPage() {
  const [profiles, setProfiles] = useState<MerchantFeeProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  const [merchantId, setMerchantId] = useState("");
  const [mode, setMode] = useState("percent");
  const [percentBps, setPercentBps] = useState("250");
  const [fixedFee, setFixedFee] = useState("0");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<{ profiles: MerchantFeeProfile[] }>(
        "v1/admin/merchant-fees",
      );
      setProfiles(data?.profiles ?? []);
    } catch {
      // silent — table stays empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await kkPost("v1/admin/merchant-fees/set", {
        merchantId,
        mode,
        percentBps: Number(percentBps),
        fixedFee: Number(fixedFee),
        currency: "HTG",
      });
      setMessage({ text: "Fee profile saved successfully", ok: true });
      setMerchantId("");
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setMessage({ text: msg, ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  const percentCount = profiles.filter(
    (p) => p.mode === "percent" || p.mode === "hybrid",
  ).length;
  const activeCount = profiles.filter((p) => p.active).length;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">
            Merchant Fee Profiles
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Per-merchant payment processing fees — overrides global FeeConfig
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

      {/* ── Summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-kob-gold/20 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0">
            <Store className="h-3.5 w-3.5 text-kob-gold" />
          </div>
          <div>
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">
              Custom Profiles
            </p>
            <p className="text-xl font-bold text-kob-text tabular-nums">
              {profiles.length}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Percent className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">
              Pct / Hybrid
            </p>
            <p className="text-xl font-bold text-kob-text tabular-nums">
              {percentCount}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-extrabold text-emerald-400 tracking-wider">
              ACT
            </span>
          </div>
          <div>
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">
              Active
            </p>
            <p className="text-xl font-bold text-kob-text tabular-nums">
              {activeCount}
            </p>
          </div>
        </div>
      </div>

      {/* ── Profiles Table ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <p className="text-sm font-semibold text-kob-text">Merchant List</p>
          <p className="text-[10px] text-kob-muted">
            {profiles.length} custom profile{profiles.length !== 1 ? "s" : ""} ·
            remaining use global config
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-kob-gold" />
            <span className="text-xs text-kob-muted">Loading profiles…</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Store className="h-8 w-8 text-kob-muted" />
            <p className="text-sm text-kob-muted">
              No custom merchant fee profiles
            </p>
            <p className="text-xs text-kob-muted/60">
              All merchants currently use the global FeeConfig
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_90px_200px_50px] gap-4 px-5 py-2.5 border-b border-white/4">
              {["Merchant", "Mode", "Rate / Fee", ""].map((h, i) => (
                <span
                  key={"col-" + i}
                  className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest"
                >
                  {h}
                </span>
              ))}
            </div>

            <div className="divide-y divide-white/4">
              {profiles.map((p) => {
                const ms = modeStyle(p.mode);
                const rateStr = fmtRate(
                  p.mode,
                  p.percentBps,
                  p.fixedFee,
                  p.currency,
                );
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_90px_200px_50px] gap-4 items-center px-5 py-3.5 hover:bg-white/2 transition-colors"
                  >
                    {/* Merchant */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-kob-text truncate">
                        {p.merchant.businessName ?? "—"}
                      </p>
                      <p className="text-[10px] font-mono text-kob-muted truncate">
                        {p.merchant.paymentCode ??
                          `${p.merchantId.slice(0, 12)}…`}
                      </p>
                    </div>

                    {/* Mode */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${ms.dot}`}
                      />
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border capitalize ${ms.bg} ${ms.text}`}
                      >
                        {p.mode}
                      </span>
                    </div>

                    {/* Rate */}
                    <span className="text-sm font-bold tabular-nums text-kob-text font-mono">
                      {rateStr}
                    </span>

                    {/* Active dot */}
                    <div className="flex justify-center">
                      <span
                        className={`h-2 w-2 rounded-full ${p.active ? "bg-emerald-400" : "bg-kob-muted"}`}
                        title={p.active ? "Active" : "Inactive"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Set Fee Form ────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-kob-gold/15 bg-[#080E20] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-kob-gold/40 to-transparent" />

        <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2">
          <Store className="h-4 w-4 text-kob-gold" />
          <p className="text-sm font-semibold text-kob-text">
            Set Merchant Fee Profile
          </p>
          <p className="text-[10px] text-kob-muted ml-1">
            — upserts a per-merchant override
          </p>
        </div>

        <form onSubmit={handleSet} className="p-5 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <FieldInput
              id="fee-merchant-id"
              label="Merchant ID"
              required
              placeholder="Merchant record ID"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              hint="The Merchant.id (not user ID)"
            />
            <FieldSelect
              id="fee-mode"
              label="Fee Mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="percent">Percent</option>
              <option value="fixed">Fixed</option>
              <option value="hybrid">Hybrid</option>
              <option value="none">None</option>
            </FieldSelect>
            <FieldInput
              id="fee-bps"
              label="Rate (bps)"
              type="number"
              step="1"
              min="0"
              max="10000"
              value={percentBps}
              onChange={(e) => setPercentBps(e.target.value)}
              hint={`= ${(Number(percentBps) / 100).toFixed(2)}%`}
            />
            <FieldInput
              id="fee-fixed"
              label="Fixed Fee (HTG)"
              type="number"
              step="0.01"
              min="0"
              value={fixedFee}
              onChange={(e) => setFixedFee(e.target.value)}
              hint="Flat amount per transaction"
            />

            {/* Save button — aligned to bottom via self-end */}
            <div className="flex flex-col justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-kob-gold text-kob-black text-sm font-bold hover:bg-kob-gold-light transition-colors disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Store className="h-3.5 w-3.5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mode hint */}
          <div
            className={`flex items-center gap-2 text-[10px] px-3 py-2 rounded-lg border ${modeStyle(mode).bg}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${modeStyle(mode).dot}`}
            />
            <span className={modeStyle(mode).text}>
              {MODE_HINT[mode] ?? ""}
            </span>
          </div>

          {message && (
            <p
              className={`text-xs font-medium ${message.ok ? "text-emerald-400" : "text-red-400"}`}
            >
              {message.ok ? "✓ " : "✗ "}
              {message.text}
            </p>
          )}
        </form>
      </div>

      {/* ── Global fallback note ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/6 bg-[#080E20]">
        <Percent className="h-4 w-4 text-kob-muted shrink-0" />
        <p className="text-[11px] text-kob-muted">
          Merchants without a custom profile fall back to the{" "}
          <span className="text-kob-text font-medium">global FeeConfig</span>{" "}
          (type: <code className="text-sky-400">merchant_payment</code>).
        </p>
      </div>
    </div>
  );
}
