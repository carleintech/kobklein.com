"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Input } from "@kobklein/ui/input";
import { useToast } from "@kobklein/ui";
import { QRCodeSVG } from "qrcode.react";
import { KNfcIcon } from "@/components/pos/KNfcIcon";
import { PosActivationModal } from "@/components/pos/PosActivationModal";
import {
  ArrowLeft, CheckCircle2, Loader2, QrCode, X, Smartphone,
  Zap, ArrowRight, RefreshCw, Wifi, Clock, AlertCircle,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */

type PosState = "input" | "generating" | "waiting" | "paid";

type QrPayload = {
  requestId: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: string;
  note: string | null;
  signature: string;
  expiresAt: string;
};

type PosStatus = {
  ok: boolean;
  status: "pending" | "expired" | "paid" | "canceled";
  amount: number;
  currency: string;
  paidByUserId: string | null;
  paidAt: string | null;
};

type MerchantToday = {
  todaySales: number;
  todayFees: number;
  balance: number;
  netToday: number;
};

type NfcSession = {
  sessionToken: string;
  ndefUri: string;
  expiresAt: string;
  merchantHandle: string;
  platform: string;
};

type PosDevice = {
  id: string;
  deviceLabel?: string;
  platform: string;
  status: string;
};

/* ── Component ─────────────────────────────────────────── */

export default function MerchantPosPage() {
  const router = useRouter();
  const toast  = useToast();

  // Device registration gate
  const [deviceChecking, setDeviceChecking] = useState(true);
  const [hasDevice, setHasDevice]           = useState(false);
  const [showActivation, setShowActivation] = useState(false);

  // NFC session
  const [nfcSession, setNfcSession]     = useState<NfcSession | null>(null);
  const [nfcLoading, setNfcLoading]     = useState(false);
  const [activeMode, setActiveMode]     = useState<"qr" | "nfc">("qr");

  // Stats
  const [stats, setStats] = useState<MerchantToday | null>(null);

  // POS state machine
  const [posState, setPosState]     = useState<PosState>("input");
  const [amount, setAmount]         = useState("");
  const [note, setNote]             = useState("");
  const [qrPayload, setQrPayload]   = useState<QrPayload | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Device check on mount ────────────────────────────── */

  useEffect(() => {
    async function checkDevice() {
      try {
        const res = await kkGet<{ hasActivePosDevice: boolean; devices: PosDevice[] }>("v1/pos/devices/my");
        setHasDevice(res.hasActivePosDevice ?? false);
      } catch {
        setHasDevice(false);
      } finally {
        setDeviceChecking(false);
      }
    }
    checkDevice();
  }, []);

  /* ── Stats fetch ─────────────────────────────────────── */

  const loadStats = useCallback(async () => {
    try {
      const s = await kkGet<MerchantToday>("v1/merchant/stats");
      setStats(s);
    } catch {}
  }, []);

  useEffect(() => {
    if (hasDevice) loadStats();
  }, [hasDevice, loadStats]);

  /* ── Init NFC session ────────────────────────────────── */

  async function initNfcSession(amount?: number) {
    setNfcLoading(true);
    try {
      const params = amount ? `?amount=${amount}&currency=HTG` : "";
      const session = await kkGet<NfcSession>(`v1/pos/session/init${params}`);
      setNfcSession(session);
      setActiveMode("nfc");
      toast.show("NFC session started — tap to receive payment", "success");
    } catch (err: unknown) {
      const msg = (err as any)?.message || "Could not start NFC session.";
      toast.show(msg, "error");
    } finally {
      setNfcLoading(false);
    }
  }

  /* ── Cleanup timers ──────────────────────────────────── */

  const clearTimers = useCallback(() => {
    if (pollRef.current)      clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    pollRef.current = null;
    countdownRef.current = null;
    resetTimerRef.current = null;
  }, []);

  useEffect(() => { return () => clearTimers(); }, [clearTimers]);

  /* ── Generate QR ─────────────────────────────────────── */

  async function handleGenerate() {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.show("Enter a valid amount", "error");
      return;
    }

    setPosState("generating");
    try {
      const res = await kkPost<{ ok: boolean; qrPayload: QrPayload }>(
        "v1/merchant/pos/create",
        { amount: numAmount, currency: "HTG", note: note || undefined }
      );

      if (!res.ok || !res.qrPayload) throw new Error("Failed to create POS request");

      setQrPayload(res.qrPayload);
      setPosState("waiting");

      const expiresAt = new Date(res.qrPayload.expiresAt).getTime();
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0) { clearTimers(); toast.show("QR code expired", "error"); resetToInput(); }
      };
      updateCountdown();
      countdownRef.current = setInterval(updateCountdown, 1000);

      pollRef.current = setInterval(async () => {
        try {
          const status = await kkGet<PosStatus>(`v1/merchant/pos/${res.qrPayload.requestId}`);
          if (status.status === "paid") {
            clearTimers();
            setPaidAmount(status.amount);
            setPosState("paid");
            loadStats();
            resetTimerRef.current = setTimeout(() => resetToInput(), 4000);
          } else if (status.status === "expired" || status.status === "canceled") {
            clearTimers();
            toast.show(status.status === "expired" ? "QR expired" : "Request canceled", "error");
            resetToInput();
          }
        } catch {}
      }, 2000);
    } catch (e: any) {
      toast.show(e.message || "Failed to generate QR", "error");
      setPosState("input");
    }
  }

  async function handleCancel() {
    if (!qrPayload) return;
    clearTimers();
    try { await kkPost(`v1/merchant/pos/${qrPayload.requestId}/cancel`, {}); } catch {}
    resetToInput();
  }

  function resetToInput() {
    clearTimers();
    setPosState("input");
    setAmount(""); setNote(""); setQrPayload(null);
    setSecondsLeft(0); setPaidAmount(0);
  }

  const formatHTG = (n: number) => `G ${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

  /* ── Loading / device gate ────────────────────────────── */

  if (deviceChecking) {
    return (
      <div className="min-h-screen bg-[#060D1F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (!hasDevice) {
    return (
      <>
        <AnimatePresence>
          {showActivation && (
            <PosActivationModal
              onActivated={() => { setHasDevice(true); setShowActivation(false); }}
              onClose={() => setShowActivation(false)}
            />
          )}
        </AnimatePresence>

        <div className="min-h-screen bg-[#060D1F] flex flex-col">
          <div className="flex items-center px-4 py-3 border-b border-white/5">
            <button type="button" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5 text-[#6B7489]" />
            </button>
            <div className="text-sm font-semibold text-[#F0F1F5] ml-3">POS Terminal</div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
            <KNfcIcon size={80} active={false} />

            <div>
              <h2 className="text-xl font-black text-[#F0F1F5]">Activate Phone POS</h2>
              <p className="text-sm text-[#5A6B82] mt-2 max-w-xs">
                Register this device as an authorized KobKlein POS terminal to receive customer payments.
              </p>
            </div>

            <div className="w-full max-w-xs space-y-3">
              {[
                "Accept KobKlein payments via QR code",
                "Android NFC tap-to-pay support",
                "Real-time payment notifications",
                "All transactions automatically logged",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-left">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}>
                    <CheckCircle2 className="h-3 w-3 text-[#C9A84C]" />
                  </div>
                  <p className="text-xs text-[#8A99AC]">{feature}</p>
                </div>
              ))}
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowActivation(true)}
              className="w-full max-w-xs h-13 py-3.5 rounded-2xl font-bold text-sm text-[#050F0C] flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)" }}
            >
              <Zap className="h-4 w-4" />
              Activate POS Terminal
            </motion.button>

            <p className="text-xs text-[#3A4558]">No hardware required · Works on any smartphone</p>
          </div>
        </div>
      </>
    );
  }

  /* ── Active POS Terminal ──────────────────────────────── */

  return (
    <div className="min-h-screen bg-[#060D1F] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-[#6B7489]" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#16C784]" />
          <div className="text-sm font-semibold text-[#F0F1F5]">POS Terminal</div>
        </div>
        <KNfcIcon size={36} active />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-white/5">
        {[
          { label: "Today",   value: stats ? formatHTG(stats.todaySales) : "—" },
          { label: "Net",     value: stats ? formatHTG(stats.netToday)   : "—" },
          { label: "Balance", value: stats ? formatHTG(stats.balance)    : "—", gold: true },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-[10px] text-[#6B7489] uppercase tracking-wider">{s.label}</div>
            <div className={`text-sm font-semibold ${s.gold ? "text-[#C9A84C]" : "text-[#F0F1F5]"}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Mode tabs */}
      <div className="flex px-4 py-2 gap-2 border-b border-white/5">
        {[
          { key: "qr",  label: "QR Code",  icon: QrCode  },
          { key: "nfc", label: "NFC Tap",  icon: Wifi    },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeMode === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveMode(tab.key as "qr" | "nfc")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: active ? "rgba(201,168,76,0.15)" : "transparent",
                border:     active ? "1px solid rgba(201,168,76,0.30)" : "1px solid transparent",
                color:      active ? "#C9A84C" : "#5A6B82",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">

        {/* ── NFC MODE ──────────────────────────────────── */}
        {activeMode === "nfc" && (
          <div className="w-full max-w-sm space-y-5 text-center">
            {nfcSession ? (
              <>
                <KNfcIcon size={80} active />
                <div>
                  <p className="text-lg font-black text-[#F0F1F5]">Ready to Receive</p>
                  <p className="text-xs text-[#5A6B82] mt-1">
                    Customer taps their phone to pay via NFC
                  </p>
                </div>

                {/* NFC URI QR fallback */}
                <div className="bg-white p-3 rounded-2xl mx-auto w-fit">
                  <QRCodeSVG
                    value={nfcSession.ndefUri}
                    size={200}
                    fgColor="#060D1F"
                    bgColor="#FFFFFF"
                    level="M"
                  />
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-[#5A6B82]">
                  <Clock className="h-3.5 w-3.5 text-[#C9A84C]" />
                  <span>Session expires: {new Date(nfcSession.expiresAt).toLocaleTimeString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setNfcSession(null); setActiveMode("qr"); }}
                    className="py-2.5 rounded-xl text-xs font-bold text-[#5A6B82] border border-white/10"
                  >
                    Cancel Session
                  </button>
                  <button
                    type="button"
                    onClick={() => initNfcSession()}
                    className="py-2.5 rounded-xl text-xs font-bold text-[#050F0C]"
                    style={{ background: "linear-gradient(135deg, #E2CA6E, #C9A84C)" }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 inline mr-1" />
                    Refresh
                  </button>
                </div>
              </>
            ) : (
              <>
                <KNfcIcon size={72} active={false} />
                <div>
                  <p className="text-base font-bold text-[#F0F1F5]">Start NFC Session</p>
                  <p className="text-xs text-[#5A6B82] mt-1">
                    Generate a signed NFC link for contactless payment.
                    Customer scans QR or taps phone.
                  </p>
                </div>

                <div className="w-full space-y-2">
                  <div className="text-xs text-[#6B7489] uppercase tracking-wider">
                    Amount (HTG) — optional
                  </div>
                  <input
                    type="number"
                    placeholder="Any amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full text-center text-3xl font-bold bg-transparent border-none outline-none
                               text-[#F0F1F5] placeholder-[#6B7489]/30"
                  />
                </div>

                <motion.button
                  type="button"
                  onClick={() => initNfcSession(amount ? parseFloat(amount) : undefined)}
                  disabled={nfcLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-[#050F0C] disabled:opacity-50
                             flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #E2CA6E, #C9A84C)" }}
                >
                  {nfcLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Wifi className="h-4 w-4" /> Start NFC Session</>
                  }
                </motion.button>
              </>
            )}
          </div>
        )}

        {/* ── QR MODE ───────────────────────────────────── */}
        {activeMode === "qr" && (
          <>
            {posState === "input" && (
              <div className="w-full max-w-sm space-y-6 text-center">
                <QrCode className="h-12 w-12 text-[#C9A84C] mx-auto opacity-40" />
                <div>
                  <div className="text-xs text-[#6B7489] uppercase tracking-wider mb-2">Amount (HTG)</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full text-center text-5xl font-bold bg-transparent border-none outline-none
                               text-[#F0F1F5] placeholder-[#6B7489]/30
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                               [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                </div>

                <div>
                  <div className="text-xs text-[#6B7489] uppercase tracking-wider mb-1">Note (optional)</div>
                  <Input
                    placeholder="e.g., Table 5, Order #123"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="text-center bg-[#0F1D35] border-white/10 text-[#B8BCC8]"
                  />
                </div>

                <motion.button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!amount || Number(amount) <= 0}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full h-14 text-lg font-bold text-white rounded-2xl disabled:opacity-40
                             flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #B8941E, #C9A84C, #A07E2E)" }}
                >
                  <QrCode className="h-5 w-5" />
                  Generate QR Code
                </motion.button>
              </div>
            )}

            {posState === "generating" && (
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#C9A84C] mx-auto" />
                <div className="text-sm text-[#6B7489]">Generating QR code...</div>
              </div>
            )}

            {posState === "waiting" && qrPayload && (
              <div className="w-full max-w-sm space-y-5 text-center">
                <div>
                  <div className="text-xs text-[#6B7489] uppercase tracking-wider">Customer pays</div>
                  <div className="text-4xl font-bold text-[#F0F1F5] mt-1">{formatHTG(qrPayload.amount)}</div>
                  {qrPayload.note && <div className="text-xs text-[#6B7489] mt-1">{qrPayload.note}</div>}
                </div>
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl">
                    <QRCodeSVG
                      value={JSON.stringify(qrPayload)}
                      size={260}
                      fgColor="#060D1F"
                      bgColor="#FFFFFF"
                      level="M"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className={`text-sm font-mono ${secondsLeft <= 30 ? "text-red-400" : "text-[#6B7489]"}`}>
                    {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-[#6B7489]">remaining</div>
                </div>
                <div className="flex items-center justify-center gap-2 text-[#6B7489]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Waiting for payment...</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-2.5 rounded-xl border border-white/10 text-[#6B7489] hover:text-[#F0F1F5] transition-colors text-sm font-bold flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />Cancel
                </button>
              </div>
            )}

            {posState === "paid" && (
              <div className="w-full max-w-sm space-y-5 text-center">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 rounded-full bg-[#1F6F4A]/20 animate-ping" />
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#1F6F4A]/20">
                    <CheckCircle2 className="h-14 w-14 text-[#1F6F4A]" />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#1F6F4A] font-semibold uppercase tracking-wider">Payment Received</div>
                  <div className="text-4xl font-bold text-[#F0F1F5] mt-2">{formatHTG(paidAmount)}</div>
                </div>
                <div className="text-xs text-[#6B7489]">Resetting in a moment...</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom branding */}
      <div className="text-center py-3 border-t border-white/5">
        <div className="text-[10px] text-[#6B7489]/50 tracking-wider">KOBKLEIN POS — V1</div>
      </div>
    </div>
  );
}
