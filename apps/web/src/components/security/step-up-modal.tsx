"use client";

import { ArrowRight, Lock, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type TransferPreview = {
  fromCurrency: string;
  toCurrency: string;
  sentAmount: number;
  receivedAmount: number;
  fxRate: number;
  isCrossCurrency: boolean;
  fee: number;
  feeCurrency: string;
  totalDeducted: number;
  corridorLabel?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onVerify: (otpCode: string) => Promise<void>;
  challengeId?: string;
  otpCode?: string;
  preview?: TransferPreview | null;
};

const DIGIT_KEYS = ["d0", "d1", "d2", "d3", "d4", "d5"] as const;

export default function StepUpModal({ open, onClose, onVerify, otpCode, preview }: Props) {
  const [otp, setOtp]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  // Auto-fill the input when the code is provided
  useEffect(() => {
    if (open && otpCode) {
      setOtp(otpCode);
      setError(null);
    }
  }, [open, otpCode]);

  // Focus manual input when modal opens without a code
  useEffect(() => {
    if (open && !otpCode) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, otpCode]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setOtp("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const digits = otpCode ? otpCode.split("") : [];

  async function handleVerify() {
    const code = otpCode || otp;
    if (code.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      await onVerify(code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(4,6,12,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #091C14 0%, #080B14 100%)",
          border: "1px solid rgba(198,167,86,0.15)",
          boxShadow: "0 32px 80px -16px rgba(0,0,0,0.8), 0 0 0 1px rgba(198,167,86,0.08)",
        }}
      >
        {/* Top gold accent */}
        <div
          className="h-0.5 w-full"
          style={{ background: "linear-gradient(90deg, transparent, #C6A756, transparent)" }}
        />

        <div className="p-7 space-y-6">
          {/* Icon + Title */}
          <div className="flex flex-col items-center text-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(198,167,86,0.15), rgba(198,167,86,0.05))",
                border: "1px solid rgba(198,167,86,0.25)",
              }}
            >
              <Lock className="h-6 w-6" style={{ color: "#C6A756" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#F2F2F2" }}>
                Security Verification
              </h2>
              <p className="text-sm mt-1" style={{ color: "#7A8394" }}>
                {otpCode
                  ? "Your verification code is ready. Tap confirm to send."
                  : "Enter the 6-digit verification code."}
              </p>
            </div>
          </div>

          {/* Apple-style digit display — shown when code is provided */}
          {otpCode ? (
            <div className="space-y-2">
              <p
                className="text-[10px] uppercase tracking-[0.15em] font-bold text-center"
                style={{ color: "#7A8394" }}
              >
                Your Code
              </p>
              <div className="flex items-center justify-center gap-2">
                {DIGIT_KEYS.map((key, i) => (
                  <div
                    key={key}
                    className="w-10 h-12 rounded-xl flex items-center justify-center text-xl font-black tabular-nums"
                    style={{
                      background: "linear-gradient(135deg, rgba(198,167,86,0.12), rgba(198,167,86,0.04))",
                      border: "1px solid rgba(198,167,86,0.30)",
                      color: "#E1C97A",
                      boxShadow: "0 0 12px -4px rgba(198,167,86,0.3)",
                    }}
                  >
                    {digits[i] ?? ""}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <Shield className="h-3 w-3" style={{ color: "#4A5A72" }} />
                <p className="text-[10px]" style={{ color: "#4A5A72" }}>
                  Valid for 5 minutes · Never share this code
                </p>
              </div>
            </div>
          ) : (
            /* Manual input fallback */
            <input
              ref={inputRef}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="w-full text-center text-3xl font-black tracking-[0.4em] font-mono rounded-2xl py-4 outline-none border transition-all"
              style={{
                background: "rgba(198,167,86,0.06)",
                border: "1px solid rgba(198,167,86,0.25)",
                color: "#E1C97A",
              }}
            />
          )}

          {error && (
            <p className="text-sm text-red-400 text-center -mt-2">{error}</p>
          )}

          {/* Transfer breakdown — shown when preview is available */}
          {preview && (
            <div
              className="rounded-2xl p-4 space-y-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: "#7A8394" }}>
                Transfer Summary
              </p>

              {/* You send */}
              <div className="flex justify-between text-xs">
                <span style={{ color: "#7A8394" }}>You send</span>
                <span className="font-semibold" style={{ color: "#F2F2F2" }}>
                  {preview.sentAmount.toLocaleString()} {preview.fromCurrency}
                </span>
              </div>

              {/* Fee (only if > 0) */}
              {preview.fee > 0 && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#7A8394" }}>Transfer fee</span>
                  <span className="font-semibold" style={{ color: "#F87171" }}>
                    − {preview.fee.toLocaleString()} {preview.feeCurrency}
                  </span>
                </div>
              )}

              {/* FX conversion (only cross-currency) */}
              {preview.isCrossCurrency && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#7A8394" }}>Exchange rate</span>
                  <span style={{ color: "#C4C7CF" }}>
                    1 {preview.fromCurrency} = {preview.fxRate < 1
                      ? `$${preview.fxRate.toFixed(6)}`
                      : preview.fxRate.toLocaleString()
                    } {preview.toCurrency}
                  </span>
                </div>
              )}

              {/* Divider */}
              <div className="border-t my-2" style={{ borderColor: "rgba(255,255,255,0.06)" }} />

              {/* Total deducted */}
              <div className="flex justify-between text-xs font-bold">
                <span style={{ color: "#7A8394" }}>Total deducted</span>
                <span style={{ color: "#E1C97A" }}>
                  {preview.totalDeducted.toLocaleString()} {preview.fromCurrency}
                </span>
              </div>

              {/* Recipient gets */}
              <div className="flex justify-between text-xs font-bold">
                <span style={{ color: "#7A8394" }}>Recipient gets</span>
                <div className="flex items-center gap-1">
                  {preview.isCrossCurrency && (
                    <ArrowRight className="h-3 w-3" style={{ color: "#7A8394" }} />
                  )}
                  <span style={{ color: "#22C55E" }}>
                    {preview.toCurrency === "USD"
                      ? `$${preview.receivedAmount.toFixed(2)}`
                      : preview.receivedAmount.toLocaleString()
                    } {preview.toCurrency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || (!otpCode && otp.length < 6)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
              style={{
                background: loading
                  ? "rgba(198,167,86,0.3)"
                  : "linear-gradient(135deg, #E1C97A 0%, #C6A756 50%, #9F7F2C 100%)",
                color: "#080B14",
                boxShadow: loading ? "none" : "0 0 24px -6px rgba(198,167,86,0.5)",
              }}
            >
              {loading ? "Verifying…" : "Confirm & Send"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtp("");
                setError(null);
                onClose();
              }}
              disabled={loading}
              className="w-full py-3 rounded-2xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#7A8394",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
