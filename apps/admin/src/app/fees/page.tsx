"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight, Check, ChevronRight, DollarSign,
  Loader2, RefreshCw, Settings, Shield, Zap,
} from "lucide-react";
import { kkGet, kkPatch, kkPost } from "@/lib/kobklein-api";

// ─── Types ────────────────────────────────────────────────────────────────────

type FeeConfig = {
  id: string;
  type: string;        // corridor code e.g. "CLIENT_DIASPORA"
  label: string;       // human-readable label
  flat: number;        // flat fee amount
  percent: number;     // percentage (future)
  currency: string;    // fee currency
  active: boolean;
  updatedAt: string;
};

// ─── Currency tag ─────────────────────────────────────────────────────────────

function CurrencyBadge({ currency }: { currency: string }) {
  const isUSD = currency === "USD";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{
        background: isUSD ? "rgba(34,197,94,0.1)" : "rgba(198,167,86,0.12)",
        color: isUSD ? "#22C55E" : "#C6A756",
        border: `1px solid ${isUSD ? "rgba(34,197,94,0.25)" : "rgba(198,167,86,0.25)"}`,
      }}
    >
      {currency}
    </span>
  );
}

// ─── Editable fee row ─────────────────────────────────────────────────────────

function FeeRow({ fee, onSave }: { fee: FeeConfig; onSave: (id: string, flat: number, active: boolean) => Promise<void> }) {
  const [flat,    setFlat]    = useState(String(fee.flat));
  const [active,  setActive]  = useState(fee.active);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const dirty = String(fee.flat) !== flat || fee.active !== active;

  async function handleSave() {
    const value = parseFloat(flat);
    if (isNaN(value) || value < 0) return;
    setSaving(true);
    try {
      await onSave(fee.id, value, active);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-xl transition-colors"
      style={{
        background: dirty ? "rgba(198,167,86,0.04)" : "transparent",
        border: dirty ? "1px solid rgba(198,167,86,0.15)" : "1px solid transparent",
      }}
    >
      {/* Active toggle */}
      <button
        type="button"
        onClick={() => setActive(a => !a)}
        className="shrink-0 w-10 h-6 rounded-full transition-all relative"
        style={{
          background: active
            ? "linear-gradient(90deg,#C6A756,#E1C97A)"
            : "rgba(255,255,255,0.08)",
        }}
        title={active ? "Active — click to disable" : "Inactive — click to enable"}
      >
        <span
          className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ transform: active ? "translateX(16px)" : "translateX(0)" }}
        />
      </button>

      {/* Label + corridor */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "#F2F2F2" }}>
          {fee.label}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px]" style={{ color: "#7A8394" }}>
            {fee.type}
          </span>
          <CurrencyBadge currency={fee.currency} />
        </div>
      </div>

      {/* Flat fee input */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs" style={{ color: "#7A8394" }}>Flat fee</span>
        <div
          className="flex items-center gap-1 rounded-lg px-3 py-1.5"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(198,167,86,0.2)",
          }}
        >
          <span className="text-xs" style={{ color: "#7A8394" }}>
            {fee.currency === "USD" ? "$" : "₲"}
          </span>
          <input
            type="number"
            min={0}
            step={fee.currency === "USD" ? 0.01 : 1}
            value={flat}
            onChange={e => setFlat(e.target.value)}
            className="w-20 text-sm font-bold bg-transparent outline-none text-right"
            style={{ color: "#E1C97A" }}
          />
          <span className="text-[10px]" style={{ color: "#7A8394" }}>{fee.currency}</span>
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || saving}
        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30 flex items-center gap-1.5"
        style={{
          background: saved
            ? "rgba(34,197,94,0.2)"
            : dirty
              ? "linear-gradient(135deg,#C6A756,#9F7F2C)"
              : "rgba(255,255,255,0.05)",
          color: saved ? "#22C55E" : dirty ? "#080B14" : "#7A8394",
        }}
      >
        {saving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : saved ? (
          <><Check className="h-3 w-3" /> Saved</>
        ) : (
          "Save"
        )}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeesPage() {
  const [fees,     setFees]     = useState<FeeConfig[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [seeding,  setSeeding]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await kkGet<FeeConfig[]>("v1/admin/fees");
      setFees(data ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load fee configs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSeed() {
    setSeeding(true);
    try {
      await kkPost("v1/admin/fees/seed", {});
      await load();
    } finally {
      setSeeding(false);
    }
  }

  async function handleSave(id: string, flat: number, active: boolean) {
    const updated = await kkPatch<FeeConfig>(`v1/admin/fees/${id}`, { flat, active });
    setFees(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
  }

  // Group by currency
  const htgFees = fees.filter(f => f.currency === "HTG");
  const usdFees = fees.filter(f => f.currency === "USD");

  return (
    <div className="min-h-screen p-6" style={{ background: "#060912" }}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(198,167,86,0.1)", border: "1px solid rgba(198,167,86,0.2)" }}
            >
              <Settings className="h-5 w-5" style={{ color: "#C6A756" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#F2F2F2" }}>
                Transfer Fees
              </h1>
              <p className="text-sm" style={{ color: "#7A8394" }}>
                Configure flat fees per transfer corridor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#C4C7CF",
              }}
            >
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Seed Defaults
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#C4C7CF",
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: "rgba(198,167,86,0.06)", border: "1px solid rgba(198,167,86,0.12)" }}
        >
          <Shield className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#C6A756" }} />
          <div className="text-sm" style={{ color: "#C4C7CF" }}>
            <p className="font-semibold mb-1" style={{ color: "#E1C97A" }}>How fees work</p>
            <p>The flat fee is deducted from the <strong>sender</strong> in addition to the transfer amount.
              Fees go to the Platform Treasury wallet. Cross-currency transfers show both the fee and
              the converted amount to the sender before they confirm.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#C6A756" }} />
          </div>
        ) : fees.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <ArrowLeftRight className="h-12 w-12 mx-auto" style={{ color: "#7A8394" }} />
            <p style={{ color: "#7A8394" }}>No fee configs yet.</p>
            <button
              onClick={handleSeed}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: "linear-gradient(135deg,#C6A756,#9F7F2C)", color: "#080B14" }}
            >
              Seed Default Corridors
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {/* HTG corridors */}
            {htgFees.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#C6A756" }}>
                    HTG Corridors
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(198,167,86,0.1)", color: "#C6A756" }}>
                    {htgFees.length}
                  </span>
                </div>
                <div
                  className="rounded-2xl overflow-hidden divide-y"
                  style={{
                    background: "#0D1424",
                    border: "1px solid rgba(255,255,255,0.06)",
                    divideColor: "rgba(255,255,255,0.04)",
                  }}
                >
                  {htgFees.map(fee => (
                    <FeeRow key={fee.id} fee={fee} onSave={handleSave} />
                  ))}
                </div>
              </section>
            )}

            {/* USD corridors */}
            {usdFees.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#22C55E" }}>
                    USD Corridors
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
                    {usdFees.length}
                  </span>
                </div>
                <div
                  className="rounded-2xl overflow-hidden divide-y"
                  style={{
                    background: "#0D1424",
                    border: "1px solid rgba(255,255,255,0.06)",
                    divideColor: "rgba(255,255,255,0.04)",
                  }}
                >
                  {usdFees.map(fee => (
                    <FeeRow key={fee.id} fee={fee} onSave={handleSave} />
                  ))}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
