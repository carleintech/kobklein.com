"use client";

import { Loader2, RefreshCw, Shield } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type LimitProfile = {
  id: string;
  role: string;
  currency: string;
  dailyLimit: number;
  monthlyLimit: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const ROLE_STYLE: Record<string, { dot: string; badge: string; text: string }> = {
  client:      { dot: "bg-sky-400",     badge: "bg-sky-500/10 border-sky-500/25",        text: "text-sky-400" },
  diaspora:    { dot: "bg-violet-400",  badge: "bg-violet-500/10 border-violet-500/25",  text: "text-violet-400" },
  merchant:    { dot: "bg-emerald-400", badge: "bg-emerald-500/10 border-emerald-500/25", text: "text-emerald-400" },
  distributor: { dot: "bg-orange-400",  badge: "bg-orange-500/10 border-orange-500/25",  text: "text-orange-400" },
  admin:       { dot: "bg-kob-gold",    badge: "bg-kob-gold/10 border-kob-gold/25",      text: "text-kob-gold" },
};

function roleStyle(role: string) {
  return (
    ROLE_STYLE[role.toLowerCase()] ?? {
      dot: "bg-kob-muted",
      badge: "bg-white/5 border-white/10",
      text: "text-kob-muted",
    }
  );
}

// ── Form primitives ───────────────────────────────────────────────────────────

const fieldCls =
  "w-full h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-kob-text placeholder:text-kob-muted/40 focus:outline-none focus:border-kob-gold/50 focus:bg-white/8 transition-colors";

function FieldInput({
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[10px] font-medium text-kob-muted uppercase tracking-widest mb-1.5 block"
      >
        {label}
      </label>
      <input id={id} {...props} className={fieldCls} />
    </div>
  );
}

function FieldSelect({
  label,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LimitsPage() {
  const [profiles, setProfiles] = useState<LimitProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [role, setRole] = useState("client");
  const [currency, setCurrency] = useState("HTG");
  const [dailyLimit, setDailyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<{ profiles: LimitProfile[] }>("v1/admin/limits/profiles");
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
      await kkPost("v1/admin/limits/profiles/set", {
        role,
        currency,
        dailyLimit: Number(dailyLimit),
        monthlyLimit: Number(monthlyLimit),
      });
      setMessage({ text: "Limit profile updated successfully", ok: true });
      setDailyLimit("");
      setMonthlyLimit("");
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setMessage({ text: msg, ok: false });
    } finally {
      setSubmitting(false);
    }
  }

  const htgCount = profiles.filter((p) => p.currency === "HTG").length;
  const usdCount = profiles.filter((p) => p.currency === "USD").length;

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">Transaction Limits</h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Configure daily and monthly limits by role and currency
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-kob-muted hover:text-kob-text transition-all disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-kob-gold/20 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0">
            <Shield className="h-3.5 w-3.5 text-kob-gold" />
          </div>
          <div>
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">Total Profiles</p>
            <p className="text-xl font-bold text-kob-text tabular-nums">{profiles.length}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-extrabold text-sky-400 tracking-wider">HTG</span>
          </div>
          <div>
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">HTG Profiles</p>
            <p className="text-xl font-bold text-kob-text tabular-nums">{htgCount}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-extrabold text-emerald-400 tracking-wider">USD</span>
          </div>
          <div>
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">USD Profiles</p>
            <p className="text-xl font-bold text-kob-text tabular-nums">{usdCount}</p>
          </div>
        </div>
      </div>

      {/* ── Profiles Table ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <p className="text-sm font-semibold text-kob-text">Current Limit Profiles</p>
          <p className="text-[10px] text-kob-muted">
            {profiles.length} active configuration{profiles.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-kob-gold" />
            <span className="text-xs text-kob-muted">Loading profiles…</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Shield className="h-8 w-8 text-kob-muted" />
            <p className="text-sm text-kob-muted">No limit profiles configured</p>
            <p className="text-xs text-kob-muted/60">Use the form below to create the first profile</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_140px_140px] gap-4 px-5 py-2.5 border-b border-white/4">
              {["Role", "Currency", "Daily Limit", "Monthly Limit"].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-semibold text-kob-muted uppercase tracking-widest"
                >
                  {h}
                </span>
              ))}
            </div>

            <div className="divide-y divide-white/4">
              {profiles.map((p) => {
                const rs = roleStyle(p.role);
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_80px_140px_140px] gap-4 items-center px-5 py-3.5 hover:bg-white/2 transition-colors"
                  >
                    {/* Role */}
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${rs.dot}`} />
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border capitalize ${rs.badge} ${rs.text}`}
                      >
                        {p.role}
                      </span>
                    </div>

                    {/* Currency */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border w-fit ${
                        p.currency === "HTG"
                          ? "text-sky-400 bg-sky-500/8 border-sky-500/20"
                          : "text-emerald-400 bg-emerald-500/8 border-emerald-500/20"
                      }`}
                    >
                      {p.currency}
                    </span>

                    {/* Daily limit */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold tabular-nums text-kob-text font-mono">
                        {fmtAmt(p.dailyLimit)}
                      </span>
                      <span className="text-[10px] text-kob-muted">{p.currency}</span>
                    </div>

                    {/* Monthly limit */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold tabular-nums text-kob-text font-mono">
                        {fmtAmt(p.monthlyLimit)}
                      </span>
                      <span className="text-[10px] text-kob-muted">{p.currency}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Set Limit Form ──────────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-kob-gold/15 bg-[#080E20] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-kob-gold/40 to-transparent" />

        <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2">
          <Shield className="h-4 w-4 text-kob-gold" />
          <p className="text-sm font-semibold text-kob-text">Set Limit Profile</p>
          <p className="text-[10px] text-kob-muted ml-1">— creates or overwrites the profile for that role + currency</p>
        </div>

        <form onSubmit={handleSet} className="p-5 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <FieldSelect id="limit-role" label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="client">Client</option>
              <option value="diaspora">Diaspora</option>
              <option value="merchant">Merchant</option>
              <option value="distributor">Distributor</option>
            </FieldSelect>
            <FieldSelect id="limit-currency" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="HTG">HTG</option>
              <option value="USD">USD</option>
            </FieldSelect>
            <FieldInput
              id="limit-daily"
              label="Daily Limit"
              type="number"
              step="1"
              min="0"
              required
              placeholder="e.g. 50 000"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
            />
            <FieldInput
              id="limit-monthly"
              label="Monthly Limit"
              type="number"
              step="1"
              min="0"
              required
              placeholder="e.g. 500 000"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-kob-gold text-[#060D1F] text-sm font-bold hover:bg-[#E2CA6E] transition-colors disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Shield className="h-3.5 w-3.5" />
                  Save Profile
                </>
              )}
            </button>

            {message && (
              <p
                className={`text-xs font-medium ${message.ok ? "text-emerald-400" : "text-red-400"}`}
              >
                {message.ok ? "✓ " : "✗ "}
                {message.text}
              </p>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}
