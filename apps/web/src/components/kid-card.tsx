"use client";

/**
 * KIdCard — KobKlein Identity Card widget
 *
 * Shows the user's K-ID (e.g. KK-3F9A-12B7) with:
 *  - Animated teal-dark card design
 *  - QR code (fetched from /v1/users/me/kid)
 *  - Copy K-ID to clipboard
 *  - Share / Download QR
 *  - Optional compact mode for embedding in dashboards
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  CheckCircle2,
  Share2,
  Download,
  QrCode,
  X,
  Shield,
  ChevronDown,
} from "lucide-react";
import { kkGet } from "@/lib/kobklein-api";

// ─── Types ────────────────────────────────────────────────────────────────────

type KIdData = {
  kId: string;
  qrPayload: string;
  displayName: string;
  handle: string | null;
};

type Props = {
  /** Show compact inline strip instead of full card */
  compact?: boolean;
  /** Pre-fetched profile with kId field */
  profile?: { kId?: string | null; firstName?: string; handle?: string };
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const TEAL = "#0D9E8A";
const TEAL_BRIGHT = "#14C9B0";
const GOLD = "#E2CA6E";
const CARD = "#0B1A16";
const PANEL = "#0E2018";
const BORDER = "rgba(13,158,138,0.18)";

// ─── Component ────────────────────────────────────────────────────────────────

export function KIdCard({ compact = false, profile }: Props) {
  const [kidData, setKidData] = useState<KIdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await kkGet<KIdData>("v1/users/me/kid");
      setKidData(data);
    } catch {
      // If K-ID endpoint fails, fall back to profile prop
      if (profile?.kId) {
        setKidData({
          kId: profile.kId,
          qrPayload: `kobklein://pay?kid=${profile.kId}`,
          displayName: profile.firstName || "KobKlein User",
          handle: profile.handle ?? null,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const copyKId = () => {
    if (!kidData?.kId) return;
    navigator.clipboard.writeText(kidData.kId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareQr = async () => {
    if (!kidData) return;
    if (navigator.share) {
      await navigator.share({
        title: "My KobKlein K-ID",
        text: `Send money to my KobKlein wallet! My K-ID: ${kidData.kId}`,
        url: `https://kobklein.com/pay/${kidData.handle || kidData.kId}`,
      }).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } else {
      copyKId();
    }
  };

  const downloadQr = () => {
    if (!kidData) return;
    const svg = document.getElementById("kobklein-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `kobklein-qr-${kidData.kId}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  // ── Compact strip (for embedding in dashboards) ──────────────────────────
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer"
        style={{ background: PANEL, border: `1px solid ${BORDER}` }}
        onClick={() => setShowQr(true)}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${TEAL}20` }}
        >
          <Shield className="h-4 w-4" style={{ color: TEAL }} />
        </div>

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-4 w-32 rounded animate-pulse" style={{ background: CARD }} />
          ) : (
            <>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                Your K-ID
              </div>
              <div
                className="text-sm font-bold tracking-widest"
                style={{ color: TEAL_BRIGHT, fontFamily: "monospace" }}
              >
                {kidData?.kId ?? "–"}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); copyKId(); }}
            aria-label="Copy K-ID"
            title="Copy K-ID"
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
            )}
          </button>
          <QrCode className="h-3.5 w-3.5" style={{ color: TEAL }} />
        </div>

        {/* Full QR modal */}
        <AnimatePresence>
          {showQr && (
            <KIdModal kidData={kidData} onClose={() => setShowQr(false)} onDownload={downloadQr} onShare={shareQr} />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Full card ────────────────────────────────────────────────────────────
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl p-5"
        style={{
          background: `linear-gradient(145deg, #091c15 0%, #0B1A16 60%, #061410 100%)`,
          border: `1px solid ${BORDER}`,
        }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 20%, ${TEAL}18 0%, transparent 60%)`,
          }}
        />
        {/* Circuit-like decoration */}
        <div
          className="absolute bottom-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, ${TEAL} 0, ${TEAL} 1px, transparent 1px, transparent 12px),
              repeating-linear-gradient(90deg, ${TEAL} 0, ${TEAL} 1px, transparent 1px, transparent 12px)`,
          }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${TEAL}22` }}
              >
                <Shield className="h-4 w-4" style={{ color: TEAL }} />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: TEAL }}>
                  KobKlein Identity
                </div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  K-Agent / Member ID
                </div>
              </div>
            </div>
            <div
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${GOLD}18`, color: GOLD }}
            >
              VERIFIED
            </div>
          </div>

          {/* K-ID display */}
          <div className="mb-4">
            <div className="text-[11px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Your K-ID
            </div>
            {loading ? (
              <div className="h-9 w-48 rounded-xl animate-pulse" style={{ background: PANEL }} />
            ) : (
              <div
                className="text-3xl font-black tracking-[0.15em] text-white"
                style={{ fontFamily: "monospace" }}
              >
                {kidData?.kId ?? "–"}
              </div>
            )}
            {kidData?.handle && (
              <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                @{kidData.handle}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyKId}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: copied ? "rgba(16,185,129,0.15)" : `${TEAL}18`,
                color: copied ? "#34d399" : TEAL_BRIGHT,
                border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : BORDER}`,
              }}
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy K-ID"}
            </button>

            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: `1px solid ${BORDER}` }}
            >
              <QrCode className="h-3.5 w-3.5" />
              My QR
            </button>

            <button
              type="button"
              onClick={shareQr}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold ml-auto"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: `1px solid ${BORDER}` }}
              aria-label="Share K-ID"
              title="Share K-ID"
            >
              {shared ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* QR modal */}
      <AnimatePresence>
        {showQr && (
          <KIdModal kidData={kidData} onClose={() => setShowQr(false)} onDownload={downloadQr} onShare={shareQr} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── QR Modal ─────────────────────────────────────────────────────────────────

function KIdModal({
  kidData,
  onClose,
  onDownload,
  onShare,
}: {
  kidData: KIdData | null;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-sm rounded-3xl p-6 space-y-5"
        style={{ background: "#0A1C16", border: `1px solid ${BORDER}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-base font-bold text-white">My KobKlein QR</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* QR Code */}
        <div
          className="flex flex-col items-center gap-4 p-6 rounded-2xl"
          style={{ background: "white" }}
        >
          {kidData ? (
            <QRCodeSVG
              id="kobklein-qr-svg"
              value={kidData.qrPayload}
              size={200}
              fgColor={TEAL}
              bgColor="#FFFFFF"
              level="H"
              includeMargin={false}
            />
          ) : (
            <div className="w-48 h-48 rounded-xl animate-pulse bg-gray-100" />
          )}
          <div className="text-center">
            <div className="text-xs text-gray-500 font-medium">
              {kidData?.displayName}
            </div>
            <div
              className="text-base font-black tracking-widest mt-0.5"
              style={{ color: TEAL, fontFamily: "monospace" }}
            >
              {kidData?.kId}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div
          className="text-xs text-center leading-relaxed"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Share this QR code so others can send you money instantly on KobKlein
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${TEAL}, #0A8A78)` }}
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: `1px solid ${BORDER}` }}
          >
            <Download className="h-4 w-4" />
            Save QR
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
