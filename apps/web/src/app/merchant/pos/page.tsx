"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  QrCode,
  X,
  DollarSign,
  Hash,
  Wallet,
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

/* ── Component ─────────────────────────────────────────── */

export default function MerchantPosPage() {
  const router = useRouter();
  const toast = useToast();

  // Stats
  const [stats, setStats] = useState<MerchantToday | null>(null);

  // POS state machine
  const [posState, setPosState] = useState<PosState>("input");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [qrPayload, setQrPayload] = useState<QrPayload | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Stats fetch ─────────────────────────────────────── */

  const loadStats = useCallback(async () => {
    try {
      const s = await kkGet<MerchantToday>("merchant/today");
      setStats(s);
    } catch {}
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  /* ── Cleanup ─────────────────────────────────────────── */

  const clearTimers = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    pollRef.current = null;
    countdownRef.current = null;
    resetTimerRef.current = null;
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

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
        {
          amount: numAmount,
          currency: "HTG",
          note: note || undefined,
        }
      );

      if (!res.ok || !res.qrPayload) {
        throw new Error("Failed to create POS request");
      }

      setQrPayload(res.qrPayload);
      setPosState("waiting");

      // Start countdown
      const expiresAt = new Date(res.qrPayload.expiresAt).getTime();
      const updateCountdown = () => {
        const remaining = Math.max(
          0,
          Math.round((expiresAt - Date.now()) / 1000)
        );
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          clearTimers();
          toast.show("QR code expired", "error");
          resetToInput();
        }
      };
      updateCountdown();
      countdownRef.current = setInterval(updateCountdown, 1000);

      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          const status = await kkGet<PosStatus>(
            `v1/merchant/pos/${res.qrPayload.requestId}`
          );
          if (status.status === "paid") {
            clearTimers();
            setPaidAmount(status.amount);
            setPosState("paid");
            loadStats();
            // Auto-reset after 4 seconds
            resetTimerRef.current = setTimeout(() => {
              resetToInput();
            }, 4000);
          } else if (
            status.status === "expired" ||
            status.status === "canceled"
          ) {
            clearTimers();
            toast.show(
              status.status === "expired" ? "QR expired" : "Request canceled",
              "error"
            );
            resetToInput();
          }
        } catch {}
      }, 2000);
    } catch (e: any) {
      toast.show(e.message || "Failed to generate QR", "error");
      setPosState("input");
    }
  }

  /* ── Cancel ──────────────────────────────────────────── */

  async function handleCancel() {
    if (!qrPayload) return;
    clearTimers();
    try {
      await kkPost(`v1/merchant/pos/${qrPayload.requestId}/cancel`, {});
    } catch {}
    resetToInput();
  }

  /* ── Reset ───────────────────────────────────────────── */

  function resetToInput() {
    clearTimers();
    setPosState("input");
    setAmount("");
    setNote("");
    setQrPayload(null);
    setSecondsLeft(0);
    setPaidAmount(0);
  }

  /* ── Render ──────────────────────────────────────────── */

  const formatHTG = (n: number) =>
    `G ${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <button type="button" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-[#7A8394]" />
        </button>
        <div className="text-sm font-semibold text-[#F2F2F2]">
          POS Terminal
        </div>
        <div className="w-5" />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-white/5">
        <div className="text-center">
          <div className="text-[10px] text-[#7A8394] uppercase tracking-wider">
            Today
          </div>
          <div className="text-sm font-semibold text-[#F2F2F2]">
            {stats ? formatHTG(stats.todaySales) : "—"}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#7A8394] uppercase tracking-wider">
            Net
          </div>
          <div className="text-sm font-semibold text-[#F2F2F2]">
            {stats ? formatHTG(stats.netToday) : "—"}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#7A8394] uppercase tracking-wider">
            Balance
          </div>
          <div className="text-sm font-semibold text-[#C6A756]">
            {stats ? formatHTG(stats.balance) : "—"}
          </div>
        </div>
      </div>

      {/* Main content — centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* ── INPUT STATE ─────────────────────────────── */}
        {posState === "input" && (
          <div className="w-full max-w-sm space-y-6 text-center">
            <QrCode className="h-12 w-12 text-[#C6A756] mx-auto opacity-40" />
            <div>
              <div className="text-xs text-[#7A8394] uppercase tracking-wider mb-2">
                Amount (HTG)
              </div>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-center text-5xl font-bold bg-transparent border-none outline-none text-[#F2F2F2] placeholder-[#7A8394]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
            </div>

            <div>
              <div className="text-xs text-[#7A8394] uppercase tracking-wider mb-1">
                Note (optional)
              </div>
              <Input
                placeholder="e.g., Table 5, Order #123"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-center bg-[#151B2E] border-white/10 text-[#C4C7CF]"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!amount || Number(amount) <= 0}
              className="w-full h-14 text-lg bg-[#C6A756] hover:bg-[#9F7F2C] text-white rounded-xl"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Generate QR Code
            </Button>
          </div>
        )}

        {/* ── GENERATING STATE ────────────────────────── */}
        {posState === "generating" && (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#C6A756] mx-auto" />
            <div className="text-sm text-[#7A8394]">Generating QR code...</div>
          </div>
        )}

        {/* ── WAITING STATE ───────────────────────────── */}
        {posState === "waiting" && qrPayload && (
          <div className="w-full max-w-sm space-y-5 text-center">
            {/* Amount display */}
            <div>
              <div className="text-xs text-[#7A8394] uppercase tracking-wider">
                Customer pays
              </div>
              <div className="text-4xl font-bold text-[#F2F2F2] mt-1">
                {formatHTG(qrPayload.amount)}
              </div>
              {qrPayload.note && (
                <div className="text-xs text-[#7A8394] mt-1">
                  {qrPayload.note}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl">
                <QRCodeSVG
                  value={JSON.stringify(qrPayload)}
                  size={280}
                  fgColor="#080B14"
                  bgColor="#FFFFFF"
                  level="M"
                />
              </div>
            </div>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-2">
              <div
                className={`text-sm font-mono ${
                  secondsLeft <= 30 ? "text-red-400" : "text-[#7A8394]"
                }`}
              >
                {Math.floor(secondsLeft / 60)}:
                {String(secondsLeft % 60).padStart(2, "0")}
              </div>
              <div className="text-xs text-[#7A8394]">remaining</div>
            </div>

            {/* Scanning indicator */}
            <div className="flex items-center justify-center gap-2 text-[#7A8394]">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Waiting for payment...</span>
            </div>

            {/* Cancel */}
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full border-white/10 text-[#7A8394] hover:text-[#F2F2F2]"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}

        {/* ── PAID STATE ──────────────────────────────── */}
        {posState === "paid" && (
          <div className="w-full max-w-sm space-y-5 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-[#1F6F4A]/20 animate-ping" />
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#1F6F4A]/20">
                <CheckCircle2 className="h-14 w-14 text-[#1F6F4A]" />
              </div>
            </div>

            <div>
              <div className="text-sm text-[#1F6F4A] font-semibold uppercase tracking-wider">
                Payment Received
              </div>
              <div className="text-4xl font-bold text-[#F2F2F2] mt-2">
                {formatHTG(paidAmount)}
              </div>
            </div>

            <div className="text-xs text-[#7A8394]">
              Resetting in a moment...
            </div>
          </div>
        )}
      </div>

      {/* Bottom branding */}
      <div className="text-center py-3 border-t border-white/5">
        <div className="text-[10px] text-[#7A8394]/50 tracking-wider">
          KOBKLEIN POS
        </div>
      </div>
    </div>
  );
}
