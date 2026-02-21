"use client";

import {
  Loader2,
  Package,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { kkGet, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Plan = {
  id: string;
  planKey: string;
  amountUsd: number;
  interval: string;
  labelEn: string;
  active: boolean;
};

type CatalogItem = {
  id: string;
  merchantKey: string;
  category: string;
  nameEn: string;
  active: boolean;
  plans: Plan[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { text: string; bg: string }> = {
  data: { text: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  streaming: {
    text: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  finance: { text: "text-kob-gold", bg: "bg-kob-gold/10 border-kob-gold/20" },
  telecom: {
    text: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
};

function categoryStyle(cat: string) {
  return (
    CATEGORY_STYLE[cat.toLowerCase()] ?? {
      text: "text-kob-muted",
      bg: "bg-white/5 border-white/10",
    }
  );
}

const INTERVAL_COLOR: Record<string, string> = {
  monthly: "text-sky-400",
  annual: "text-emerald-400",
  yearly: "text-emerald-400",
  weekly: "text-orange-400",
};

function intervalColor(iv: string) {
  return INTERVAL_COLOR[iv.toLowerCase()] ?? "text-kob-muted";
}

// ── Toggle Button ─────────────────────────────────────────────────────────────

function ToggleBtn({
  id,
  active,
  spinning,
  onToggle,
  size = "md",
}: {
  id: string;
  active: boolean;
  spinning: boolean;
  onToggle: (id: string) => void;
  size?: "sm" | "md";
}) {
  const base =
    size === "sm"
      ? "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all disabled:opacity-40"
      : "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all disabled:opacity-40";

  const variant = active
    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
    : "bg-white/5 border-white/10 text-kob-muted hover:text-kob-text hover:border-white/20";

  return (
    <button
      type="button"
      disabled={spinning}
      onClick={() => onToggle(id)}
      className={`${base} ${variant}`}
    >
      {spinning ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : active ? (
        <ToggleRight className="h-3 w-3" />
      ) : (
        <ToggleLeft className="h-3 w-3" />
      )}
      {active ? "Active" : "Inactive"}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KPayPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await kkGet<{ items: CatalogItem[] }>("v1/admin/catalog");
      setItems(data?.items ?? []);
    } catch {
      // silent — items stay empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleItem(id: string) {
    setToggling(id);
    setErrors((p) => ({ ...p, [id]: "" }));
    try {
      await kkPost(`v1/admin/catalog/item/${id}/toggle`, {});
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Toggle failed";
      setErrors((p) => ({ ...p, [id]: msg }));
    } finally {
      setToggling(null);
    }
  }

  async function togglePlan(id: string) {
    setToggling(id);
    setErrors((p) => ({ ...p, [id]: "" }));
    try {
      await kkPost(`v1/admin/catalog/plan/${id}/toggle`, {});
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Toggle failed";
      setErrors((p) => ({ ...p, [id]: msg }));
    } finally {
      setToggling(null);
    }
  }

  const activeCount = items.filter((i) => i.active).length;
  const totalPlans = items.reduce((s, i) => s + i.plans.length, 0);
  const activePlans = items.reduce(
    (s, i) => s + i.plans.filter((p) => p.active).length,
    0,
  );

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight">
            K-Pay Catalog
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Subscription products and billing plans · toggle to activate or
            pause
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
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-2xl border border-kob-gold/20 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0">
            <Package className="h-3.5 w-3.5 text-kob-gold" />
          </div>
          <div>
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">
              Products
            </p>
            <p className="text-xl font-bold text-kob-text tabular-nums">
              {items.length}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-400 ml-3 shrink-0" />
          <div>
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">
              Active
            </p>
            <p className="text-xl font-bold text-emerald-400 tabular-nums">
              {activeCount}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-sky-400 ml-3 shrink-0" />
          <div>
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">
              Plans
            </p>
            <p className="text-xl font-bold text-kob-text tabular-nums">
              {totalPlans}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-violet-400 ml-3 shrink-0" />
          <div>
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">
              Active Plans
            </p>
            <p className="text-xl font-bold text-violet-400 tabular-nums">
              {activePlans}
            </p>
          </div>
        </div>
      </div>

      {/* ── Loading state ──────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-kob-gold" />
          <span className="text-sm text-kob-muted">Loading catalog…</span>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-[#080E20] flex flex-col items-center justify-center py-16 gap-3">
          <Package className="h-10 w-10 text-kob-muted" />
          <p className="text-sm font-semibold text-kob-text">
            No catalog items
          </p>
          <p className="text-xs text-kob-muted">
            Run the seed script to populate K-Pay catalog items and plans.
          </p>
        </div>
      )}

      {/* ── Catalog items ──────────────────────────────────────────────── */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const cs = categoryStyle(item.category);
            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-[#080E20] overflow-hidden transition-colors ${
                  item.active ? "border-white/10" : "border-white/5 opacity-75"
                }`}
              >
                {/* Item header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Active indicator */}
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${item.active ? "bg-emerald-400" : "bg-kob-muted"}`}
                    />

                    {/* Name */}
                    <p className="text-sm font-bold text-kob-text">
                      {item.nameEn}
                    </p>

                    {/* Category pill */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-widest ${cs.bg} ${cs.text}`}
                    >
                      {item.category}
                    </span>

                    {/* Merchant key */}
                    <span className="text-[10px] font-mono text-kob-muted hidden md:block">
                      {item.merchantKey}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {errors[item.id] && (
                      <p className="text-[10px] text-red-400">
                        {errors[item.id]}
                      </p>
                    )}
                    <ToggleBtn
                      id={item.id}
                      active={item.active}
                      spinning={toggling === item.id}
                      onToggle={toggleItem}
                    />
                  </div>
                </div>

                {/* Plans table */}
                {item.plans.length > 0 ? (
                  <>
                    {/* Column headers */}
                    <div className="grid grid-cols-[140px_1fr_80px_90px_80px_80px] gap-3 px-5 py-2 border-b border-white/4">
                      {[
                        "Plan Key",
                        "Label",
                        "Price",
                        "Interval",
                        "Status",
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

                    <div className="divide-y divide-white/4">
                      {item.plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`grid grid-cols-[140px_1fr_80px_90px_80px_80px] gap-3 items-center px-5 py-3 hover:bg-white/2 transition-colors ${
                            !plan.active ? "opacity-50" : ""
                          }`}
                        >
                          {/* Plan key */}
                          <span className="text-[11px] font-mono text-kob-muted truncate">
                            {plan.planKey}
                          </span>

                          {/* Label */}
                          <span className="text-xs text-kob-text truncate">
                            {plan.labelEn}
                          </span>

                          {/* Price */}
                          <span className="text-xs font-bold tabular-nums text-kob-gold font-mono">
                            ${Number(plan.amountUsd).toFixed(2)}
                          </span>

                          {/* Interval */}
                          <span
                            className={`text-[10px] font-semibold capitalize ${intervalColor(plan.interval)}`}
                          >
                            {plan.interval}
                          </span>

                          {/* Status dot */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${plan.active ? "bg-emerald-400" : "bg-kob-muted"}`}
                            />
                            <span
                              className={`text-[10px] font-medium ${plan.active ? "text-emerald-400" : "text-kob-muted"}`}
                            >
                              {plan.active ? "Live" : "Off"}
                            </span>
                          </div>

                          {/* Toggle */}
                          <div className="flex flex-col items-end gap-0.5">
                            <ToggleBtn
                              id={plan.id}
                              active={plan.active}
                              spinning={toggling === plan.id}
                              onToggle={togglePlan}
                              size="sm"
                            />
                            {errors[plan.id] && (
                              <p className="text-[9px] text-red-400">
                                {errors[plan.id]}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="px-5 py-4 flex items-center gap-2">
                    <span className="text-[10px] text-kob-muted/60 italic">
                      No plans configured for this item
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
