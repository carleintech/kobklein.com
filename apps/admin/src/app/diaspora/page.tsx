"use client";

import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError, kkGet, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type DiasporaUser = {
  id: string;
  kId: string | null;
  phone: string | null;
  handle: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string;
  kycTier: number;
  isFrozen: boolean;
  onboardingComplete: boolean;
  createdAt: string;
};

type PageData = {
  ok: boolean;
  users: DiasporaUser[];
  total: number;
  page: number;
  pages: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayName(u: DiasporaUser): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return full || u.handle || u.phone || u.email || u.id.slice(0, 8);
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const KYC_LABEL = ["None", "Tier 1", "Tier 2", "Tier 3"];
const KYC_COLOR = [
  "text-kob-muted",
  "text-sky-400",
  "text-emerald-400",
  "text-kob-gold",
];

// ── User Card ─────────────────────────────────────────────────────────────────

function DiasporaCard({
  user,
  onRefresh,
}: {
  user: DiasporaUser;
  onRefresh: () => void;
}) {
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState("");
  const name = displayName(user);

  async function toggleFreeze() {
    setActing(true);
    setMsg("");
    try {
      await kkPost("v1/admin/users/freeze", {
        userId: user.id,
        frozen: !user.isFrozen,
        reason: user.isFrozen ? undefined : "Admin action",
      });
      setMsg(user.isFrozen ? "Account unfrozen" : "Account frozen");
      onRefresh();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080E20] overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar icon */}
        <div className="h-9 w-9 rounded-xl bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.20)] flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-purple-400" />
        </div>

        {/* Info grid */}
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_100px_90px_80px_80px] gap-x-4 gap-y-0.5 items-center">
          {/* Name + email */}
          <div className="min-w-0">
            <p className="text-xs font-bold text-kob-text truncate">{name}</p>
            <p className="text-[10px] text-kob-muted truncate">
              {user.email}
              {user.handle && (
                <span className="ml-1.5 text-kob-muted/60">@{user.handle}</span>
              )}
            </p>
          </div>

          {/* K-ID */}
          <div className="hidden md:block">
            <p className="text-[9px] text-kob-muted uppercase tracking-widest mb-0.5">K-ID</p>
            <p className="text-[10px] font-mono text-kob-gold">{user.kId ?? "–"}</p>
          </div>

          {/* KYC */}
          <div className="hidden md:block">
            <p className="text-[9px] text-kob-muted uppercase tracking-widest mb-0.5">KYC</p>
            <p className={`text-[10px] font-semibold ${KYC_COLOR[user.kycTier] ?? "text-kob-muted"}`}>
              {KYC_LABEL[user.kycTier] ?? "Unknown"}
            </p>
          </div>

          {/* Status */}
          <div className="hidden md:block">
            <p className="text-[9px] text-kob-muted uppercase tracking-widest mb-0.5">Status</p>
            <span className={`text-[10px] font-semibold ${user.isFrozen ? "text-red-400" : "text-emerald-400"}`}>
              {user.isFrozen ? "Frozen" : "Active"}
            </span>
          </div>

          {/* Joined */}
          <div className="hidden md:block">
            <p className="text-[9px] text-kob-muted uppercase tracking-widest mb-0.5">Joined</p>
            <p className="text-[10px] text-kob-muted">{timeAgo(user.createdAt)}</p>
          </div>
        </div>

        {/* Freeze action */}
        <div className="shrink-0">
          <button
            type="button"
            disabled={acting}
            onClick={toggleFreeze}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-40 ${
              user.isFrozen
                ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-white/5 border border-white/10 text-kob-muted hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/8"
            }`}
          >
            {acting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : user.isFrozen ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <ShieldOff className="h-3.5 w-3.5" />
            )}
            {user.isFrozen ? "Unfreeze" : "Freeze"}
          </button>
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiasporaPage() {
  const [data, setData]       = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);
  const [page, setPage]       = useState(1);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    setApiDown(false);
    try {
      const res = await kkGet<PageData>(`v1/admin/users/by-role?role=diaspora&page=${p}`);
      setData(res);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.isApiUnavailable) setApiDown(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  function goPage(p: number) {
    setPage(p);
    load(p);
  }

  const users  = data?.users ?? [];
  const frozen = users.filter((u) => u.isFrozen).length;
  const kyc0   = users.filter((u) => u.kycTier === 0).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-kob-text tracking-tight flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            Diaspora Users
          </h1>
          <p className="text-xs text-kob-muted mt-0.5">
            International remittance accounts · {data?.total ?? 0} total
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
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
          <p className="text-xs text-red-400 font-medium">API unreachable — data may be stale</p>
        </div>
      )}

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[rgba(139,92,246,0.20)] bg-[#080E20] p-4">
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">Total</p>
            <p className="text-2xl font-black text-kob-text tabular-nums mt-1">{data.total}</p>
          </div>
          <div className="rounded-2xl border border-red-500/15 bg-[#080E20] p-4">
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">Frozen</p>
            <p className={`text-2xl font-black tabular-nums mt-1 ${frozen > 0 ? "text-red-400" : "text-kob-text"}`}>
              {frozen}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#080E20] p-4">
            <p className="text-[9px] text-kob-muted uppercase tracking-widest">No KYC</p>
            <p className={`text-2xl font-black tabular-nums mt-1 ${kyc0 > 0 ? "text-orange-400" : "text-kob-text"}`}>
              {kyc0}
            </p>
          </div>
        </div>
      )}

      {/* Column headers */}
      {!loading && users.length > 0 && (
        <div className="hidden md:grid grid-cols-[36px_1fr_100px_90px_80px_80px_110px] gap-4 px-5 py-2">
          {["", "User", "K-ID", "KYC", "Status", "Joined", ""].map((h, i) => (
            <span key={`col-${i}`} className="text-[9px] font-semibold text-kob-muted uppercase tracking-widest">{h}</span>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-kob-gold" />
          <span className="text-xs text-kob-muted">Loading diaspora users…</span>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#080E20] flex flex-col items-center justify-center py-14 gap-3">
          <Globe className="h-10 w-10 text-kob-muted/30" />
          <p className="text-sm font-semibold text-kob-text">No diaspora users yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <DiasporaCard key={u.id} user={u} onRefresh={() => load()} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => goPage(page - 1)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-kob-muted hover:text-kob-text disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-kob-muted">Page {page} of {data.pages}</span>
          <button
            type="button"
            disabled={page >= data.pages}
            onClick={() => goPage(page + 1)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-kob-muted hover:text-kob-text disabled:opacity-30 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
