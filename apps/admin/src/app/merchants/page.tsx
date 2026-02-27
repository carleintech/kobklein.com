"use client";

import {
  Building2,
  CheckCircle,
  Loader2,
  RefreshCw,
  ShieldX,
  Store,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError, kkGet, kkPost } from "@/lib/kobklein-api";

type MerchantUser = {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  kycTier: number;
};

type Merchant = {
  id: string;
  userId: string;
  displayName: string | null;
  businessName: string | null;
  locationText: string | null;
  status: "active" | "suspended" | "pending" | "onboarding";
  businessType: string | null;
  hasProfile: boolean;   // false = registered as merchant but hasn't completed onboarding yet
  user: MerchantUser;
  createdAt: string;
};

const STATUS_STYLE: Record<string, { text: string; bg: string }> = {
  active:     { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25" },
  pending:    { text: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/25" },
  onboarding: { text: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/25" },
  suspended:  { text: "text-red-400",     bg: "bg-red-500/10 border-red-500/25" },
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function MerchantCard({ m, onRefresh }: { m: Merchant; onRefresh: () => void }) {
  const [acting, setActing] = useState<"approve" | "suspend" | null>(null);
  const [msg, setMsg] = useState("");

  const ss = STATUS_STYLE[m.status] ?? STATUS_STYLE.pending;

  async function handleAction(action: "approve" | "suspend") {
    setActing(action);
    setMsg("");
    try {
      await kkPost(`v1/admin/merchants/${m.id}/${action}`, {});
      setMsg(action === "approve" ? "Merchant approved" : "Merchant suspended");
      onRefresh();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
      <div className="flex items-start gap-4 px-5 py-4">
        {/* Icon */}
        <div className="h-10 w-10 rounded-xl border border-kob-gold/20 bg-kob-gold/10 flex items-center justify-center shrink-0">
          <Store className="h-4 w-4 text-kob-gold" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-kob-text">
              {m.businessName ?? m.displayName ?? `${m.user.firstName} ${m.user.lastName}`}
            </p>
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold capitalize ${ss.bg} ${ss.text}`}>
              {m.status}
            </span>
          </div>

          <div className="text-[11px] font-mono text-kob-muted space-x-3">
            <span>{m.user.phone}</span>
            {m.locationText && <span>{m.locationText}</span>}
            {m.businessType && <span className="capitalize">{m.businessType}</span>}
          </div>

          <p className="text-[9px] font-mono text-kob-muted/40">{m.id} · {timeAgo(m.createdAt)}</p>
        </div>

        {/* Actions — only available once the merchant has completed their business profile */}
        <div className="flex items-center gap-2 shrink-0">
          {!m.hasProfile ? (
            <span className="px-2 py-1 rounded-lg text-[10px] font-medium text-kob-muted/60 border border-white/8">
              Awaiting profile
            </span>
          ) : (
            <>
              {m.status !== "active" && (
                <button
                  type="button"
                  disabled={acting !== null}
                  onClick={() => handleAction("approve")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                >
                  {acting === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  Approve
                </button>
              )}
              {m.status !== "suspended" && (
                <button
                  type="button"
                  disabled={acting !== null}
                  onClick={() => handleAction("suspend")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-kob-muted hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/8 transition-all disabled:opacity-40"
                >
                  {acting === "suspend" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldX className="h-3.5 w-3.5" />}
                  Suspend
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {msg && (
        <div className={`mx-5 mb-3 px-3 py-2 rounded-xl text-[11px] font-medium ${
          msg.includes("failed") || msg.includes("error")
            ? "bg-red-500/8 border border-red-500/20 text-red-400"
            : "bg-emerald-500/8 border border-emerald-500/20 text-emerald-400"
        }`}>
          {msg}
        </div>
      )}
    </div>
  );
}

const STATUS_TABS = ["all", "pending", "onboarding", "active", "suspended"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);
  const [tab, setTab] = useState<StatusTab>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setApiDown(false);
    try {
      const data = await kkGet<{ merchants: Merchant[] }>("v1/admin/merchants");
      setMerchants(data?.merchants ?? []);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.isApiUnavailable) setApiDown(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = merchants.filter((m) => tab === "all" || m.status === tab);
  const pendingCount = merchants.filter((m) => m.status === "pending" || m.status === "onboarding").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-kob-gold" />
            Merchant Validation
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            Approve or suspend merchant accounts · {pendingCount} pending review
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

      {apiDown && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/8">
          <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
          <p className="text-xs text-red-400 font-medium">Merchant API is unreachable</p>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-orange-500/25 bg-orange-500/8">
          <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
          <p className="text-xs text-orange-400 font-semibold">
            {pendingCount} merchant{pendingCount !== 1 ? "s" : ""} awaiting approval
          </p>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-[#080E20] p-1 w-fit">
        {STATUS_TABS.map((s) => {
          const count = s === "all" ? merchants.length : merchants.filter((m) => m.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                tab === s ? "bg-kob-gold text-[#080B14]" : "text-kob-muted hover:text-kob-text"
              }`}
            >
              {s}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                tab === s ? "bg-black/20 text-[#080B14]" : "bg-white/8 text-kob-muted"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-kob-gold" />
          <span className="text-sm text-kob-muted">Loading merchants…</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#080E20] flex flex-col items-center justify-center py-14 gap-3">
          <Store className="h-10 w-10 text-kob-muted/30" />
          <p className="text-sm font-semibold text-kob-text">No merchants in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((m) => (
            <MerchantCard key={m.id} m={m} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}
