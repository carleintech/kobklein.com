"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Shield, X, Smartphone, Eye, Lock, AlertCircle } from "lucide-react";
import { kkPost } from "@/lib/kobklein-api";
import { KNfcIcon } from "./KNfcIcon";
import { useToast } from "@kobklein/ui";

/**
 * PosActivationModal — CashApp-style agreement modal for activating Phone-as-POS.
 *
 * Flow:
 * 1. Shows the K-NFC icon, agreement terms, and two buttons (Decline / Accept)
 * 2. On Accept: POST /v1/pos/devices/register with device fingerprint + platform + timestamp
 * 3. On success: calls onActivated() so parent can update state
 */

type Props = {
  onActivated: () => void;
  onClose: () => void;
};

function detectPlatform(): "web" | "ios" | "android" {
  if (typeof window === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "web";
}

function getDeviceFingerprint(): string {
  // Lightweight browser fingerprint (not stored, non-PII)
  const ua        = navigator.userAgent;
  const lang      = navigator.language;
  const tz        = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const screen_wh = `${window.screen.width}x${window.screen.height}`;
  const raw       = `${ua}|${lang}|${tz}|${screen_wh}`;

  // Simple hash (djb2)
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iphone/i.test(ua)) {
    const m = ua.match(/cpu iphone os (\d+_\d+)/i);
    return `iPhone (iOS ${m ? m[1].replace("_", ".") : "unknown"})`;
  }
  if (/ipad/i.test(ua)) return "iPad";
  if (/android/i.test(ua)) {
    const m = ua.match(/android ([\d.]+)/i);
    return `Android ${m ? m[1] : "Device"}`;
  }
  return "Web Browser";
}

const AGREEMENT_ITEMS = [
  { text: "This device is authorized to receive KobKlein payments" },
  { text: "All transactions are logged, auditable, and reported" },
  { text: "You are responsible for the physical security of this device" },
  { text: "KobKlein may revoke POS access if misuse is detected" },
  { text: "You accept responsibility for all payments processed" },
];

export function PosActivationModal({ onActivated, onClose }: Props) {
  const toast   = useToast();
  const [step, setStep]       = useState<"agreement" | "activating" | "done">("agreement");
  const [agreed, setAgreed]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleActivate() {
    if (!agreed) return;
    setStep("activating");
    setError(null);

    try {
      const fingerprint = getDeviceFingerprint();
      const platform    = detectPlatform();
      const label       = getDeviceLabel();

      await kkPost("v1/pos/devices/register", {
        deviceFingerprint: fingerprint,
        deviceLabel:       label,
        platform,
        agreementAcceptedAt: new Date().toISOString(),
      });

      setStep("done");
      setTimeout(() => {
        onActivated();
        onClose();
      }, 1600);

    } catch (err: unknown) {
      const msg = (err as any)?.message || "Activation failed. Please try again.";
      setError(msg);
      setStep("agreement");
      toast.show(msg, "error");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(4,8,20,0.88)", backdropFilter: "blur(10px)" }}
      onClick={step === "agreement" ? onClose : undefined}
    >
      <motion.div
        initial={{ y: 60, scale: 0.95, opacity: 0 }}
        animate={{ y: 0,  scale: 1,    opacity: 1 }}
        exit={{   y: 60, scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 280 }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0A1628 0%, #050E1F 100%)",
          border:     "1px solid rgba(100,140,220,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Success state ─────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 14, stiffness: 300 }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "rgba(22,199,132,0.12)", border: "2px solid rgba(22,199,132,0.30)" }}
              >
                <CheckCircle2 className="h-10 w-10 text-[#16C784]" />
              </motion.div>
              <div className="text-center">
                <p className="text-xl font-black text-[#E0E4EE]">POS Activated!</p>
                <p className="text-sm text-[#5A6B82] mt-1">
                  Your device is now a KobKlein POS terminal
                </p>
              </div>
              <KNfcIcon size={56} active />
            </motion.div>
          )}

          {/* ── Activating spinner ────────────────────────────── */}
          {step === "activating" && (
            <motion.div
              key="activating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 p-8"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(201,168,76,0.10)", border: "1.5px solid rgba(201,168,76,0.25)" }}>
                <Loader2 className="h-8 w-8 text-[#C9A84C] animate-spin" />
              </div>
              <p className="text-sm font-bold text-[#E0E4EE]">Registering device…</p>
              <p className="text-xs text-[#5A6B82]">Securing your POS connection</p>
            </motion.div>
          )}

          {/* ── Agreement ─────────────────────────────────────── */}
          {step === "agreement" && (
            <motion.div key="agreement" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4"
                style={{ borderBottom: "1px solid rgba(100,140,220,0.10)" }}>
                <div className="flex items-center gap-3">
                  <KNfcIcon size={44} />
                  <div>
                    <p className="text-sm font-black text-[#E0E4EE]">Activate POS on This Device</p>
                    <p className="text-[11px] text-[#5A6B82]">Turn your phone into a payment terminal</p>
                  </div>
                </div>
                <button type="button" onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-white/5 transition-colors">
                  <X className="h-4 w-4 text-[#5A6B82]" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Device info pill */}
                <div className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(100,140,220,0.06)", border: "1px solid rgba(100,140,220,0.12)" }}>
                  <Smartphone className="h-4 w-4 shrink-0" style={{ color: "#6E8DAE" }} />
                  <div>
                    <p className="text-[11px] font-bold text-[#B0BBCC]">
                      {typeof window !== "undefined" ? getDeviceLabel() : "Your Device"}
                    </p>
                    <p className="text-[10px] text-[#5A6B82]">
                      {typeof window !== "undefined" ? detectPlatform() : "web"} · V1 terminal
                    </p>
                  </div>
                </div>

                {/* Agreement terms */}
                <div className="space-y-2.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#4A5A72]">
                    By activating, you confirm:
                  </p>
                  {AGREEMENT_ITEMS.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2.5"
                    >
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}>
                        <CheckCircle2 className="h-2.5 w-2.5 text-[#C9A84C]" />
                      </div>
                      <p className="text-xs text-[#8A99AC] leading-relaxed">{item.text}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Security note */}
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)" }}>
                  <Lock className="h-3.5 w-3.5 text-[#C9A84C] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#7A8394] leading-relaxed">
                    <span className="font-bold text-[#C9A84C]">Secure:</span>{" "}
                    Payment sessions are signed with HMAC-SHA256. Each session expires in 15 minutes.
                    No card data is stored on your device.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)" }}
                  >
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
                  </motion.div>
                )}

                {/* Agree checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background:  agreed ? "linear-gradient(135deg, #E2CA6E, #C9A84C)" : "transparent",
                      border:      agreed ? "none" : "1.5px solid rgba(201,168,76,0.40)",
                    }}
                    onClick={() => setAgreed(v => !v)}
                  >
                    {agreed && <CheckCircle2 className="h-3.5 w-3.5 text-[#050F0C]" />}
                  </div>
                  <span className="text-xs text-[#8A99AC]">
                    I have read and agree to the KobKlein POS Merchant Terms
                  </span>
                </label>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-12 rounded-2xl font-bold text-sm transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border:     "1px solid rgba(255,255,255,0.08)",
                      color:      "#5A6B82",
                    }}
                  >
                    Decline
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleActivate}
                    disabled={!agreed}
                    whileHover={agreed ? { scale: 1.02 } : undefined}
                    whileTap={agreed   ? { scale: 0.98 } : undefined}
                    className="h-12 rounded-2xl font-bold text-sm text-[#050F0C] disabled:opacity-40 transition-all"
                    style={{
                      background: agreed
                        ? "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)"
                        : "rgba(201,168,76,0.20)",
                    }}
                  >
                    Accept &amp; Activate
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
