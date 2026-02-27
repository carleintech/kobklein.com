"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet, kkPost, kkPatch } from "@/lib/kobklein-api";
import { useI18n } from "@/lib/i18n";
import {
  Bell, BellOff, Check, CheckCheck,
  ArrowDownLeft, ArrowUpRight, ShieldAlert, Wallet,
  CreditCard, Star, Info, RefreshCcw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type NotifType =
  | "transfer.sent" | "transfer.received"
  | "deposit.success" | "withdrawal.ready" | "withdrawal.requested"
  | "fraud.alert" | "kyc.reminder" | "float.low"
  | string;

type Notification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: string;
};

// ─── Type → visual config ─────────────────────────────────────────────────────
function typeConfig(type: NotifType): {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
} {
  const map: Record<string, ReturnType<typeof typeConfig>> = {
    "transfer.sent":        { icon: ArrowUpRight,  color: "#F97316", bg: "rgba(249,115,22,0.10)",  border: "rgba(249,115,22,0.15)" },
    "transfer.received":    { icon: ArrowDownLeft, color: "#10B981", bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.15)" },
    "deposit.success":      { icon: Wallet,        color: "#10B981", bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.15)" },
    "withdrawal.ready":     { icon: CreditCard,    color: "#C9A84C", bg: "rgba(201,168,76,0.10)",  border: "rgba(201,168,76,0.15)" },
    "withdrawal.requested": { icon: CreditCard,    color: "#C9A84C", bg: "rgba(201,168,76,0.10)",  border: "rgba(201,168,76,0.15)" },
    "fraud.alert":          { icon: ShieldAlert,   color: "#EF4444", bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.18)"  },
    "kyc.reminder":         { icon: Star,          color: "#8B5CF6", bg: "rgba(139,92,246,0.10)",  border: "rgba(139,92,246,0.15)" },
    "float.low":            { icon: Info,          color: "#C9A84C", bg: "rgba(201,168,76,0.10)",  border: "rgba(201,168,76,0.15)" },
  };
  return map[type] ?? { icon: Bell, color: "#5A6B82", bg: "rgba(90,107,130,0.10)", border: "rgba(90,107,130,0.12)" };
}

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Group notifications by date ──────────────────────────────────────────────
function groupByDate(items: Notification[]): { label: string; items: Notification[] }[] {
  const groups: Record<string, Notification[]> = {};
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  for (const n of items) {
    const d = new Date(n.createdAt);
    let label: string;
    if (d.toDateString() === today.toDateString())         label = "Today";
    else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else label = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-5"
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgba(201,168,76,0.10), rgba(201,168,76,0.03))",
          border: "1px solid rgba(201,168,76,0.15)",
        }}
      >
        <BellOff className="h-9 w-9 text-[#3A4558]" />
      </div>
      <div className="text-center">
        <p className="text-base font-bold text-[#F0F1F5]">All caught up</p>
        <p className="text-sm text-[#5A6B82] mt-1 max-w-xs">
          No notifications yet. We'll alert you for transfers, deposits, and important activity.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Single notification card ─────────────────────────────────────────────────
function NotifCard({
  n, onMarkRead,
}: {
  n: Notification;
  onMarkRead: (id: string) => void;
}) {
  const cfg  = typeConfig(n.type);
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="relative group rounded-2xl border overflow-hidden transition-colors"
      style={{
        background:   n.read ? "rgba(28,10,53,0.5)" : "var(--dash-shell-bg, #1C0A35)",
        borderColor:  n.read ? "rgba(165,150,201,0.08)" : cfg.border,
        boxShadow:    n.read ? "none" : `0 0 24px -8px ${cfg.color}20`,
      }}
    >
      {/* Unread accent bar */}
      {!n.read && (
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ background: cfg.color }}
        />
      )}

      <div className="flex items-start gap-3 px-4 py-3.5 pl-5">
        {/* Icon badge */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <Icon className="h-[17px] w-[17px]" style={{ color: cfg.color }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-bold leading-snug ${n.read ? "text-[#4A5A72]" : "text-[#F0F1F5]"}`}>
              {n.title}
            </p>
            <span className="text-[10px] text-[#3A4558] shrink-0 mt-0.5 font-medium whitespace-nowrap">
              {relativeTime(n.createdAt)}
            </span>
          </div>
          <p className={`text-xs mt-0.5 leading-relaxed ${n.read ? "text-[#2A3448]" : "text-[#5A6B82]"}`}>
            {n.body}
          </p>
        </div>

        {/* Mark-read button — visible on hover for unread items */}
        {!n.read && (
          <button
            onClick={() => onMarkRead(n.id)}
            title="Mark as read"
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1
                       w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#2A1050]"
          style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}
          >
            <Check className="h-3 w-3 text-[#5A6B82]" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────
function FilterChip({
  label, active, count, onClick,
}: { label: string; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-bold
                  transition-all shrink-0 border ${
                    active
                      ? "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C]"
                      : "text-[#6E558B] hover:text-[#A596C9]"
                  }`}
      style={!active ? { borderColor: "rgba(165,150,201,0.22)", background: "var(--dash-shell-bg, #1C0A35)" } : undefined}
    >
      {label}
      {count !== undefined && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
          active ? "bg-[#C9A84C]/20" : "bg-[#A596C9]/10"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { t } = useI18n();
  const [items, setItems]           = useState<Notification[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [filter, setFilter]         = useState<"all" | "unread">("all");

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await kkGet<{ ok: boolean; unreadCount: number; items: Notification[] }>(
        "v1/notifications?limit=50"
      );
      const list = Array.isArray(res) ? res : (res.items ?? []);
      setItems(list);
      setUnreadTotal(Array.isArray(res)
        ? list.filter((n) => !n.read).length
        : (res.unreadCount ?? 0)
      );
    } catch {
      /* show stale data */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load on mount — intentionally do NOT auto-mark-all-read
  // The bell badge stays live; users mark read themselves
  useEffect(() => { load(); }, [load]);

  async function handleMarkRead(id: string) {
    // Optimistic
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadTotal((c) => Math.max(0, c - 1));
    try {
      await kkPost(`v1/notifications/${id}/read`, {});
    } catch {
      load(true); // revert
    }
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadTotal(0);
    try {
      await kkPatch("v1/notifications/read-all");
    } catch {
      load(true); // revert
    }
  }

  const unreadCount = items.filter((n) => !n.read).length;
  const filtered    = filter === "unread" ? items.filter((n) => !n.read) : items;
  const grouped     = groupByDate(filtered);

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-5 p-4 md:p-0">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
              border: "1px solid rgba(201,168,76,0.20)",
            }}
          >
            <Bell className="h-5 w-5 text-[#C9A84C]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#F0F1F5]">{t("notifications.title")}</h1>
            <p className="text-xs text-[#5A6B82] mt-0.5">
              {unreadTotal > 0 ? `${unreadTotal} unread` : t("notifications.empty")}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            aria-label="Refresh notifications"
            title="Refresh notifications"
            className="p-2 rounded-xl text-[#6E558B] hover:text-[#A596C9] hover:bg-[#2A1050] transition-all"
            style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold
                           text-[#6E558B] hover:text-[#A596C9] hover:bg-[#2A1050] transition-all"
                style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid var(--dash-shell-border, rgba(165,150,201,0.22))" }}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("notifications.markRead")}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Filter chips ─────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <FilterChip label={t("common.seeAll")} active={filter === "all"}    count={items.length}  onClick={() => setFilter("all")} />
        <FilterChip label={t("kyc.pending").split(" ")[0]} active={filter === "unread"} count={unreadCount}   onClick={() => setFilter("unread")} />
      </div>

      {/* ── Unread banner ────────────────────────────────────────────── */}
      <AnimatePresence>
        {unreadCount > 0 && filter === "all" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-2xl px-4 py-3 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))",
                border: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
                <span className="text-sm font-bold text-[#C9A84C]">
                  {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors font-medium"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Clear all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── List ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "var(--dash-shell-bg, #1C0A35)", border: "1px solid rgba(165,150,201,0.10)" }}
            >
              <div className="w-9 h-9 rounded-xl animate-pulse shrink-0" style={{ background: "rgba(165,150,201,0.12)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded-full animate-pulse" style={{ background: "rgba(165,150,201,0.12)" }} />
                <div className="h-2.5 w-full rounded-full animate-pulse" style={{ background: "rgba(165,150,201,0.08)" }} />
              </div>
            </motion.div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ label, items: group }) => (
            <div key={label} className="flex flex-col gap-2">
              {/* Date group header */}
              <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] font-black text-[#3A4558] uppercase tracking-widest shrink-0">
                  {label}
                </span>
                <div className="flex-1 h-px bg-white/[0.04]" />
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {group.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <NotifCard n={n} onMarkRead={handleMarkRead} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
