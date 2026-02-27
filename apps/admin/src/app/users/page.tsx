"use client";

import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { type FormEvent, useCallback, useState } from "react";
import { ApiError, kkGet, kkPost } from "@/lib/kobklein-api";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserResult = {
  id: string;
  kId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  role: string;
  kycTier: number;
  isFrozen: boolean;
};

// ── Style maps ────────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, { text: string; bg: string }> = {
  client: {
    text: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/25",
  },
  diaspora: {
    text: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/25",
  },
  merchant: {
    text: "text-kob-gold",
    bg: "bg-kob-gold/10 border-kob-gold/25",
  },
  distributor: {
    text: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/25",
  },
  admin: {
    text: "text-red-400",
    bg: "bg-red-500/10 border-red-500/25",
  },
};

const TIER_STYLE: Record<number, { text: string; bg: string }> = {
  0: { text: "text-kob-muted", bg: "bg-white/5 border-white/10" },
  1: { text: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  2: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  3: { text: "text-kob-gold", bg: "bg-kob-gold/10 border-kob-gold/20" },
};

function roleStyle(role: string) {
  return (
    ROLE_STYLE[role] ?? {
      text: "text-kob-muted",
      bg: "bg-white/5 border-white/10",
    }
  );
}

function tierStyle(tier: number) {
  return TIER_STYLE[tier] ?? TIER_STYLE[1];
}

function initials(u: UserResult): string {
  return (
    ((u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")).toUpperCase() || "?"
  );
}

const ROLES = [
  "client",
  "diaspora",
  "merchant",
  "distributor",
  "admin",
] as const;

// ── User Card ─────────────────────────────────────────────────────────────────

type WalletInfo = { id: string; currency: string; balance: number };

function UserCard({
  user,
  onAction,
}: {
  user: UserResult;
  onAction: () => void;
}) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [newRole, setNewRole] = useState(user.role);
  const [submitting, setSubmitting] = useState<"freeze" | "role" | "wallet" | "delete" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [adjustCurrency, setAdjustCurrency] = useState("HTG");
  const [adjustDirection, setAdjustDirection] = useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const rs = roleStyle(user.role);
  const ts = tierStyle(user.kycTier);

  async function handleFreeze() {
    setSubmitting("freeze");
    setError(""); setSuccess("");
    try {
      await kkPost("v1/admin/users/freeze", { userId: user.id, frozen: !user.isFrozen });
      setSuccess(user.isFrozen ? "Account successfully unfrozen" : "Account frozen");
      onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally { setSubmitting(null); }
  }

  async function handleSetRole() {
    if (!newRole) return;
    setSubmitting("role"); setError(""); setSuccess("");
    try {
      await kkPost("v1/admin/users/set-role", { userId: user.id, role: newRole });
      setSuccess(`Role updated to "${newRole}"`);
      setRoleOpen(false); onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Role update failed");
    } finally { setSubmitting(null); }
  }

  async function handleWalletOpen() {
    if (walletOpen) { setWalletOpen(false); return; }
    setWalletOpen(true);
    setWalletLoading(true);
    try {
      const data = await kkGet<{ wallets: WalletInfo[] }>(`v1/admin/users/${user.id}/wallets`);
      setWallets(data?.wallets ?? []);
      if (data?.wallets?.length) setAdjustCurrency(data.wallets[0].currency);
    } catch { /* silent */ }
    finally { setWalletLoading(false); }
  }

  async function handleWalletAdjust() {
    if (!adjustAmount || !adjustReason) return;
    setSubmitting("wallet"); setError(""); setSuccess("");
    try {
      const res = await kkPost<{ newBalance: number }>("v1/admin/wallets/adjust", {
        userId: user.id, currency: adjustCurrency,
        direction: adjustDirection, amount: Number(adjustAmount), reason: adjustReason,
      });
      setSuccess(`${adjustDirection === "credit" ? "+" : "-"}${adjustAmount} ${adjustCurrency} · new balance: ${res.newBalance}`);
      setAdjustAmount(""); setAdjustReason("");
      const data = await kkGet<{ wallets: WalletInfo[] }>(`v1/admin/users/${user.id}/wallets`);
      setWallets(data?.wallets ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Adjustment failed");
    } finally { setSubmitting(null); }
  }

  async function handleDelete() {
    setSubmitting("delete"); setError(""); setSuccess("");
    try {
      await kkPost(`v1/admin/users/${user.id}/delete`, {});
      setSuccess("Account deleted");
      setDeleteConfirm(false); onAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally { setSubmitting(null); }
  }

  return (
    <div
      className={`rounded-2xl border bg-[#080E20] overflow-hidden transition-colors ${
        roleOpen || walletOpen || deleteConfirm ? "border-kob-gold/20" : "border-white/8"
      }`}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar */}
        <div
          className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${rs.bg}`}
        >
          <span className={`text-sm font-bold ${rs.text}`}>
            {initials(user)}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-kob-text">
              {user.firstName} {user.lastName}
            </p>
            {user.kId && (
              <span className="px-2 py-0.5 rounded-md border border-kob-gold/30 bg-kob-gold/8 text-[10px] font-mono font-semibold text-kob-gold">
                {user.kId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-kob-muted">
            {user.phone && <span>{user.phone}</span>}
            {user.email && <span className="truncate">{user.email}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Role */}
            <span
              className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold capitalize ${rs.bg} ${rs.text}`}
            >
              {user.role}
            </span>

            {/* KYC tier */}
            <span
              className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${ts.bg} ${ts.text}`}
            >
              KYC T{user.kycTier}
            </span>

            {/* Frozen / Active */}
            {user.isFrozen ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-red-500/30 bg-red-500/10 text-[10px] font-semibold text-red-400">
                <ShieldX className="h-3 w-3" />
                Frozen
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 text-[10px] font-semibold text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                Active
              </span>
            )}
          </div>

          <p className="text-[9px] font-mono text-kob-muted/50 truncate">
            {user.id}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Freeze / Unfreeze */}
          {user.isFrozen ? (
            <button
              type="button"
              disabled={submitting !== null}
              onClick={handleFreeze}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
            >
              {submitting === "freeze" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              Unfreeze
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting !== null}
              onClick={handleFreeze}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-kob-muted hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/8 transition-all disabled:opacity-40"
            >
              {submitting === "freeze" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldX className="h-3.5 w-3.5" />
              )}
              Freeze
            </button>
          )}

          {/* Change Role toggle */}
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => { setRoleOpen((v) => !v); setNewRole(user.role); setError(""); setSuccess(""); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-40 ${
              roleOpen ? "bg-kob-gold/10 border-kob-gold/30 text-kob-gold" : "bg-white/5 border-white/10 text-kob-muted hover:text-kob-text hover:border-white/20"
            }`}
          >
            <UserCog className="h-3.5 w-3.5" />
            Role
            {roleOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {/* Wallet adjust toggle */}
          <button
            type="button"
            disabled={submitting !== null}
            onClick={handleWalletOpen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-40 ${
              walletOpen ? "bg-sky-500/10 border-sky-500/30 text-sky-400" : "bg-white/5 border-white/10 text-kob-muted hover:text-kob-text hover:border-white/20"
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            Wallet
          </button>

          {/* Delete toggle */}
          <button
            type="button"
            aria-label="Delete account"
            disabled={submitting !== null}
            onClick={() => { setDeleteConfirm((v) => !v); setError(""); setSuccess(""); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-40 ${
              deleteConfirm ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-kob-muted hover:text-red-400 hover:border-red-500/25 hover:bg-red-500/8"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Inline feedback ── */}
      {(success || error) && (
        <div
          className={`mx-5 mb-3 px-3 py-2 rounded-xl text-[11px] font-medium ${
            error
              ? "bg-red-500/8 border border-red-500/20 text-red-400"
              : "bg-emerald-500/8 border border-emerald-500/20 text-emerald-400"
          }`}
        >
          {error || success}
        </div>
      )}

      {/* ── Role change panel ── */}
      {roleOpen && (
        <div className="px-5 pb-5 pt-0 border-t border-kob-gold/10">
          <div className="pt-4 space-y-3">
            <p className="text-[10px] text-kob-gold/70 uppercase tracking-widest font-semibold">
              Change Role — {user.firstName} {user.lastName}
            </p>
            <div className="flex items-center gap-3">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                aria-label="New role"
                className="flex-1 max-w-50 h-9 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none px-3 text-xs text-kob-text appearance-none transition-colors"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-[#0F1626]">
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={submitting !== null || newRole === user.role}
                onClick={handleSetRole}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kob-gold text-kob-black text-[11px] font-bold hover:bg-kob-gold-light transition-all disabled:opacity-40"
              >
                {submitting === "role" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCog className="h-3.5 w-3.5" />}
                Update Role
              </button>
              <button type="button" onClick={() => { setRoleOpen(false); setNewRole(user.role); setError(""); }} className="px-3 py-2 rounded-xl border border-white/8 text-[11px] text-kob-muted hover:text-kob-text transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Wallet controls panel ── */}
      {walletOpen && (
        <div className="px-5 pb-5 pt-0 border-t border-sky-500/10">
          <div className="pt-4 space-y-3">
            <p className="text-[10px] text-sky-400/70 uppercase tracking-widest font-semibold">Manual Wallet Adjustment</p>
            {walletLoading ? (
              <div className="flex items-center gap-2 text-xs text-kob-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading wallets…</div>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label htmlFor={`${user.id}-currency`} className="text-[9px] text-kob-muted uppercase tracking-wider">Currency</label>
                  <select id={`${user.id}-currency`} value={adjustCurrency} onChange={(e) => setAdjustCurrency(e.target.value)}
                    className="h-9 rounded-xl bg-white/5 border border-white/10 focus:border-sky-400/40 focus:outline-none px-3 text-xs text-kob-text appearance-none transition-colors">
                    {wallets.map((w) => (
                      <option key={w.currency} value={w.currency} className="bg-[#0F1626]">
                        {w.currency} — bal: {w.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-kob-muted uppercase tracking-wider">Direction</p>
                  <div className="flex gap-1.5">
                    {(["credit", "debit"] as const).map((d) => (
                      <button key={d} type="button" onClick={() => setAdjustDirection(d)}
                        className={`px-3 py-2 rounded-xl border text-[11px] font-semibold capitalize transition-all ${adjustDirection === d ? (d === "credit" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400") : "bg-white/5 border-white/10 text-kob-muted"}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor={`${user.id}-amount`} className="text-[9px] text-kob-muted uppercase tracking-wider">Amount</label>
                  <input id={`${user.id}-amount`} type="number" min="0.01" step="0.01" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="0.00"
                    className="w-28 h-9 rounded-xl bg-white/5 border border-white/10 focus:border-sky-400/40 focus:outline-none px-3 text-xs text-kob-text transition-colors" />
                </div>
                <div className="flex-1 min-w-40 space-y-1">
                  <label htmlFor={`${user.id}-reason`} className="text-[9px] text-kob-muted uppercase tracking-wider">Reason (required)</label>
                  <input id={`${user.id}-reason`} type="text" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g. Refund for error TX-123"
                    className="w-full h-9 rounded-xl bg-white/5 border border-white/10 focus:border-sky-400/40 focus:outline-none px-3 text-xs text-kob-text transition-colors" />
                </div>
                <button type="button" disabled={submitting !== null || !adjustAmount || !adjustReason} onClick={handleWalletAdjust}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/25 text-[11px] font-bold text-sky-400 hover:bg-sky-500/20 transition-all disabled:opacity-40">
                  {submitting === "wallet" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete confirmation panel ── */}
      {deleteConfirm && (
        <div className="px-5 pb-5 pt-0 border-t border-red-500/10">
          <div className="pt-4 space-y-3">
            <p className="text-[10px] text-red-400/70 uppercase tracking-widest font-semibold">Delete Account — Irreversible</p>
            <p className="text-xs text-kob-muted">
              This will anonymize all PII and freeze the account for <span className="text-kob-text font-medium">{user.firstName} {user.lastName}</span>. Wallet history is preserved for compliance.
            </p>
            <div className="flex items-center gap-3">
              <button type="button" disabled={submitting !== null} onClick={handleDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40">
                {submitting === "delete" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Confirm Delete
              </button>
              <button type="button" onClick={() => setDeleteConfirm(false)} className="px-3 py-2 rounded-xl border border-white/8 text-[11px] text-kob-muted hover:text-kob-text transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [apiDown, setApiDown] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const refresh = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    try {
      const data = await kkGet<{ users: UserResult[] }>(
        `v1/admin/users/search?q=${encodeURIComponent(q.trim())}`,
      );
      setResults(data?.users ?? []);
    } catch {
      // silent refresh
    }
  }, []);

  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    setApiDown(false);
    try {
      const data = await kkGet<{ users: UserResult[] }>(
        `v1/admin/users/search?q=${encodeURIComponent(query.trim())}`,
      );
      setResults(data?.users ?? []);
      setHasSearched(true);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.isApiUnavailable) setApiDown(true);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-kob-text tracking-tight">
          User Management
        </h1>
        <p className="text-xs text-kob-muted mt-0.5">
          Search by K-ID, phone, handle, or name · freeze accounts · manage
          roles
        </p>
      </div>

      {/* ── API offline banner ───────────────────────────────────────────── */}
      {apiDown && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/8">
          <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
          <p className="text-xs text-red-400 font-medium">
            User API is unreachable — search results may be unavailable
          </p>
        </div>
      )}

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-3 p-4 rounded-2xl border border-white/8 bg-[#080E20]"
      >
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-kob-muted pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="K-ID, phone, @handle, or name…"
            minLength={2}
            required
            className="w-full h-9 rounded-xl bg-white/5 border border-white/10 focus:border-kob-gold/40 focus:outline-none pl-9 pr-3 text-xs text-kob-text placeholder:text-kob-muted/60 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={searching || query.trim().length < 2}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kob-gold text-kob-black text-[11px] font-bold hover:bg-kob-gold-light transition-all disabled:opacity-40"
        >
          {searching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {/* ── Empty / no results ──────────────────────────────────────────── */}
      {hasSearched && !searching && results.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-[#080E20] flex flex-col items-center justify-center py-14 gap-3">
          <Users className="h-10 w-10 text-kob-muted/40" />
          <p className="text-sm font-semibold text-kob-text">No users found</p>
          <p className="text-xs text-kob-muted">
            No results for &quot;{query}&quot; — try a different query
          </p>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] text-kob-muted uppercase tracking-widest">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-3">
            {results.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onAction={() => refresh(query)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
