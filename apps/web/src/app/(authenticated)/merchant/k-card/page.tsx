"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet } from "@/lib/kobklein-api";
import { KIdCard } from "@/components/kid-card";
import {
  ArrowLeft, RefreshCw, QrCode, Share2, Download,
  Monitor, BarChart3, Banknote, TrendingUp, Shield,
  CheckCircle2, Printer, ExternalLink, Store,
} from "lucide-react";

// ─── Design tokens — Merchant: Deep Navy ──────────────────────────────────────

const M = {
  bg:      "#0A1628",
  card:    "#0F1E3A",
  panel:   "#102240",
  panel2:  "#132850",
  border:  "rgba(100,140,220,0.13)",
  border2: "rgba(100,140,220,0.08)",
  border3: "rgba(100,140,220,0.20)",
  gold:    "#D4AF37",
  goldL:   "#F5B77A",
  goldD:   "#A08030",
  text:    "#E6EDF7",
  muted:   "#A8BAD8",
  dimmed:  "#3A5A7A",
  success: "#16C784",
  accent:  "#6E8DAE",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  firstName?: string;
  lastName?: string;
  handle?: string;
  kId?: string | null;
  kycTier: number;
  kycStatus?: string;
};

type MerchantStats = {
  todaySales: number;
  todayCount: number;
  todayFees:  number;
  balance:    number;
  netToday:   number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("fr-HT", {
    minimumFractionDigits:  2,
    maximumFractionDigits:  2,
  }).format(n);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MerchantKCardPage() {
  const router = useRouter();

  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [stats,      setStats]      = useState<MerchantStats | null>(null);
  const [qrDataUrl,  setQrDataUrl]  = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [shared,     setShared]     = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [profileRes, statsRes, qrRes] = await Promise.allSettled([
        kkGet<Profile>("v1/users/me"),
        kkGet<MerchantStats>("v1/merchant/stats"),
        kkGet<{ qr: string }>("merchant/qr"),
      ]);
      if (profileRes.status === "fulfilled") setProfile(profileRes.value);
      if (statsRes.status   === "fulfilled") setStats(statsRes.value);
      if (qrRes.status      === "fulfilled") setQrDataUrl(qrRes.value.qr ?? null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function refresh() {
    setRefreshing(true);
    load(true);
  }

  // Share merchant payment link
  async function shareQr() {
    const handle = profile?.handle;
    const url    = handle
      ? `https://kobklein.com/pay/${handle}`
      : `https://kobklein.com/pay/${profile?.kId ?? ""}`;
    if (navigator.share) {
      await navigator.share({
        title: "Pay me on KobKlein",
        text:  `Scan or tap to pay my KobKlein merchant wallet`,
        url,
      }).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Download QR as PNG
  function downloadQr() {
    if (!qrDataUrl) return;
    const a      = document.createElement("a");
    a.href       = qrDataUrl;
    a.download   = `kobklein-merchant-qr-${profile?.handle ?? profile?.id?.slice(-6) ?? "me"}.png`;
    a.click();
  }

  // Print the QR
  function printQr() {
    const win = window.open("", "_blank");
    if (!win || !qrDataUrl) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
        <title>KobKlein Merchant QR</title>
        <style>
          body { margin: 0; display: flex; flex-direction: column; align-items: center;
                 justify-content: center; min-height: 100vh; font-family: sans-serif;
                 background: #fff; }
          img  { width: 280px; height: 280px; }
          p    { font-size: 14px; color: #444; margin-top: 12px; text-align: center; }
          h2   { font-size: 20px; font-weight: 800; color: #0A1628; margin: 0 0 4px; }
        </style>
      </head><body>
        <h2>KobKlein Payment</h2>
        <p style="font-size:12px;color:#888;margin:0 0 16px">Scan to pay instantly</p>
        <img src="${qrDataUrl}" alt="Merchant QR" />
        <p>${profile?.firstName ?? ""} ${profile?.lastName ?? ""}</p>
        ${profile?.handle ? `<p>@${profile.handle}</p>` : ""}
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5 pb-8 animate-pulse" data-dashboard="merchant">
        <div className="h-8 w-40 rounded-xl" style={{ background: M.panel }} />
        <div className="h-40 rounded-3xl" style={{ background: M.card }} />
        <div className="h-72 rounded-3xl" style={{ background: M.card }} />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 rounded-2xl" style={{ background: M.card }} />
          <div className="h-20 rounded-2xl" style={{ background: M.card }} />
        </div>
        <div className="h-36 rounded-2xl" style={{ background: M.card }} />
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Merchant";

  return (
    <div className="space-y-5 pb-8" data-dashboard="merchant">

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 hover:brightness-110 transition-all"
            style={{ background: M.card, border: `1px solid ${M.border}` }}
          >
            <ArrowLeft className="h-4 w-4" style={{ color: M.muted }} />
          </button>
          <div>
            <div
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: M.muted }}
            >
              <Store className="h-3 w-3" />
              Merchant Profile
            </div>
            <h1 className="text-xl font-black leading-none" style={{ color: M.text }}>
              K-Card
            </h1>
          </div>
        </div>

        <button
          onClick={refresh}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: M.card, border: `1px solid ${M.border}` }}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            style={{ color: M.muted }}
          />
        </button>
      </motion.div>

      {/* ── K-ID IDENTITY CARD ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        {/* Section label */}
        <div
          className="flex items-center gap-2 mb-3 px-1"
        >
          <Shield className="h-3.5 w-3.5" style={{ color: M.gold }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: M.muted }}>
            KobKlein Identity
          </span>
          {profile?.kycTier && profile.kycTier >= 2 && (
            <span
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto"
              style={{ background: "rgba(22,199,132,0.10)", color: M.success }}
            >
              <CheckCircle2 className="h-2.5 w-2.5" />
              Verified
            </span>
          )}
        </div>

        {/* KIdCard component renders its own card with QR */}
        <KIdCard profile={profile ?? undefined} />
      </motion.div>

      {/* ── MERCHANT PAYMENT QR ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: M.card, border: `1px solid ${M.border}` }}
      >
        {/* Card header */}
        <div
          className="flex items-center gap-2 px-5 py-4"
          style={{ borderBottom: `1px solid ${M.border2}` }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(212,175,55,0.12)" }}
          >
            <QrCode className="h-4 w-4" style={{ color: M.gold }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: M.text }}>
              Payment QR Code
            </div>
            <div className="text-[11px]" style={{ color: M.dimmed }}>
              Customers scan this to pay you instantly
            </div>
          </div>
        </div>

        {/* QR display */}
        <div className="flex flex-col items-center gap-4 px-5 py-6">
          {qrDataUrl ? (
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.18, type: "spring", stiffness: 260, damping: 22 }}
              className="relative"
            >
              {/* QR frame */}
              <div
                className="p-4 rounded-2xl"
                style={{
                  background:    "#FFFFFF",
                  boxShadow:     "0 0 0 1px rgba(212,175,55,0.30), 0 8px 32px rgba(0,0,0,0.4)",
                }}
              >
                <img
                  src={qrDataUrl}
                  alt="Merchant QR Code"
                  className="block rounded-lg"
                  style={{ width: 200, height: 200 }}
                />
              </div>
              {/* Corner accents */}
              <div
                className="absolute -top-0.5 -left-0.5 w-6 h-6 rounded-tl-xl pointer-events-none"
                style={{ border: "2.5px solid rgba(212,175,55,0.6)", borderRight: "none", borderBottom: "none" }}
              />
              <div
                className="absolute -top-0.5 -right-0.5 w-6 h-6 rounded-tr-xl pointer-events-none"
                style={{ border: "2.5px solid rgba(212,175,55,0.6)", borderLeft: "none", borderBottom: "none" }}
              />
              <div
                className="absolute -bottom-0.5 -left-0.5 w-6 h-6 rounded-bl-xl pointer-events-none"
                style={{ border: "2.5px solid rgba(212,175,55,0.6)", borderRight: "none", borderTop: "none" }}
              />
              <div
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-br-xl pointer-events-none"
                style={{ border: "2.5px solid rgba(212,175,55,0.6)", borderLeft: "none", borderTop: "none" }}
              />
            </motion.div>
          ) : (
            <div
              className="w-[200px] h-[200px] rounded-2xl flex items-center justify-center"
              style={{ background: M.panel }}
            >
              <div className="animate-spin w-8 h-8 rounded-full border-2 border-t-transparent"
                style={{ borderColor: `${M.accent} transparent ${M.accent} ${M.accent}` }} />
            </div>
          )}

          {/* Merchant name under QR */}
          <div className="text-center">
            <div className="text-sm font-black" style={{ color: M.text }}>
              {displayName}
            </div>
            {profile?.handle && (
              <div className="text-xs mt-0.5" style={{ color: M.dimmed }}>
                @{profile.handle}
              </div>
            )}
            <div
              className="text-[10px] font-bold uppercase tracking-widest mt-1"
              style={{ color: M.gold }}
            >
              KobKlein Merchant
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="grid grid-cols-3 px-0"
          style={{ borderTop: `1px solid ${M.border2}` }}
        >
          <button
            onClick={printQr}
            disabled={!qrDataUrl}
            className="flex flex-col items-center gap-1.5 py-4 hover:brightness-110 transition-all disabled:opacity-40"
          >
            <Printer className="h-4 w-4" style={{ color: M.accent }} />
            <span className="text-[11px] font-semibold" style={{ color: M.muted }}>Print</span>
          </button>
          <button
            onClick={downloadQr}
            disabled={!qrDataUrl}
            className="flex flex-col items-center gap-1.5 py-4 hover:brightness-110 transition-all disabled:opacity-40"
            style={{ borderLeft: `1px solid ${M.border2}`, borderRight: `1px solid ${M.border2}` }}
          >
            <Download className="h-4 w-4" style={{ color: M.accent }} />
            <span className="text-[11px] font-semibold" style={{ color: M.muted }}>Save PNG</span>
          </button>
          <button
            onClick={shareQr}
            className="flex flex-col items-center gap-1.5 py-4 hover:brightness-110 transition-all"
          >
            <AnimatePresence mode="wait">
              {shared || copied ? (
                <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <CheckCircle2 className="h-4 w-4" style={{ color: M.success }} />
                </motion.div>
              ) : (
                <motion.div key="share" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Share2 className="h-4 w-4" style={{ color: M.accent }} />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-[11px] font-semibold" style={{ color: M.muted }}>
              {shared ? "Shared!" : copied ? "Copied!" : "Share"}
            </span>
          </button>
        </div>
      </motion.div>

      {/* ── TODAY'S STATS ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Today's Sales */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-2"
          style={{ background: M.card, border: `1px solid ${M.border}` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(22,199,132,0.10)" }}
            >
              <TrendingUp className="h-3.5 w-3.5" style={{ color: M.success }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: M.muted }}>
              Today
            </span>
          </div>
          <div>
            <div className="text-lg font-black leading-none" style={{ color: M.success }}>
              {fmt(stats?.todaySales ?? 0)}
            </div>
            <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: M.dimmed }}>
              HTG · {stats?.todayCount ?? 0} tx{(stats?.todayCount ?? 0) !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Balance */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-2"
          style={{
            background: `linear-gradient(135deg, ${M.panel2} 0%, rgba(212,175,55,0.08) 100%)`,
            border:     "1px solid rgba(212,175,55,0.22)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(212,175,55,0.12)" }}
            >
              <Banknote className="h-3.5 w-3.5" style={{ color: M.gold }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: M.muted }}>
              Balance
            </span>
          </div>
          <div>
            <div className="text-lg font-black leading-none" style={{ color: M.gold }}>
              {fmt(stats?.balance ?? 0)}
            </div>
            <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: M.dimmed }}>
              HTG available
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── QUICK LINKS ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: M.card, border: `1px solid ${M.border}` }}
      >
        <div
          className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: M.dimmed, borderBottom: `1px solid ${M.border2}` }}
        >
          Quick Links
        </div>

        {[
          {
            icon:  <Monitor className="h-4 w-4" />,
            label: "POS Terminal",
            sub:   "Create a payment request",
            href:  "/merchant/pos",
            color: M.accent,
          },
          {
            icon:  <BarChart3 className="h-4 w-4" />,
            label: "Sales Report",
            sub:   "View analytics & history",
            href:  "/merchant/sales",
            color: M.gold,
          },
          {
            icon:  <Banknote className="h-4 w-4" />,
            label: "Withdraw",
            sub:   "Transfer earnings to bank",
            href:  "/merchant/withdraw",
            color: M.success,
          },
        ].map((item, i, arr) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:brightness-110 transition-all"
            style={{
              borderBottom: i < arr.length - 1 ? `1px solid ${M.border2}` : "none",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `${item.color}18`,
                color:       item.color,
              }}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold" style={{ color: M.text }}>
                {item.label}
              </div>
              <div className="text-xs" style={{ color: M.dimmed }}>
                {item.sub}
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" style={{ color: M.dimmed }} />
          </button>
        ))}
      </motion.div>

    </div>
  );
}
