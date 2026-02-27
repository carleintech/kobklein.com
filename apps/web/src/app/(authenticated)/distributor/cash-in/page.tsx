"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { kkPost } from "@/lib/kobklein-api";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Phone,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Step = "form" | "confirm" | "processing" | "success" | "error";

const AMBER = "#F59E0B";
const AMBER_DIM = "#78350F";
const EMERALD = "#1F6F4A";

const PRESETS = [500, 1000, 2000, 5000];

export default function CashInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<{ commission?: number; transactionId?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const numAmt = Number(amount) || 0;
  const commission = Math.round(numAmt * 0.01);

  async function handleSubmit() {
    setStep("processing");
    setError(null);

    try {
      const result = await kkPost("v1/distributor/cash-in", {
        customerPhone: phone,
        amount: numAmt,
        currency: "HTG",
        idempotencyKey: crypto.randomUUID(),
      });

      setReceipt(result as { commission?: number; transactionId?: string });
      setStep("success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Cash-in failed. Try again.";
      setError(msg);
      setStep("error");
    }
  }

  const slideVariants = {
    enter: { opacity: 0, x: 32 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -32 },
  };

  return (
    <div
      className="min-h-screen p-4 pb-24"
      style={{ background: "linear-gradient(160deg, #0B1A16 0%, #080B14 60%, #1C0800 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => (step === "form" ? router.back() : setStep("form"))}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: AMBER }} />
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#F2F2F2", fontFamily: "'Playfair Display', serif" }}>
            Agent Cash-In
          </h1>
          <p className="text-xs" style={{ color: "#7A8394" }}>Credit a customer's wallet</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── FORM ── */}
        {step === "form" && (
          <motion.div
            key="form"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* Info banner */}
            <div
              className="rounded-xl p-3 flex gap-2"
              style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}
            >
              <Banknote className="w-4 h-4 mt-0.5 shrink-0" style={{ color: AMBER }} />
              <p className="text-xs" style={{ color: "#C4C7CF" }}>
                Customer gives you cash. Enter their phone number and the amount to credit their KobKlein wallet.
              </p>
            </div>

            {/* Phone */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "#151B2E", border: "1px solid rgba(245,158,11,0.12)" }}
            >
              <label htmlFor="phone-input" className="text-xs font-medium" style={{ color: "#7A8394" }}>
                CUSTOMER PHONE
              </label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" style={{ color: AMBER }} />
                <input
                  id="phone-input"
                  type="tel"
                  placeholder="+509 XXXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  style={{ color: "#F2F2F2" }}
                />
              </div>
            </div>

            {/* Amount */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "#151B2E", border: "1px solid rgba(245,158,11,0.12)" }}
            >
              <label htmlFor="amount-input" className="text-xs font-medium" style={{ color: "#7A8394" }}>
                AMOUNT (HTG)
              </label>
              <input
                id="amount-input"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent outline-none text-3xl font-bold"
                style={{ color: "#F2F2F2" }}
              />
              {/* Presets */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(String(p))}
                    className="rounded-lg py-1.5 text-xs font-medium transition-colors"
                    style={{
                      background: numAmt === p ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.07)",
                      border: `1px solid ${numAmt === p ? AMBER : "rgba(245,158,11,0.15)"}`,
                      color: numAmt === p ? AMBER : "#C4C7CF",
                    }}
                  >
                    {p >= 1000 ? `${p / 1000}K` : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Commission preview */}
            {numAmt > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl px-4 py-3 flex justify-between items-center"
                style={{ background: "rgba(31,111,74,0.1)", border: "1px solid rgba(31,111,74,0.2)" }}
              >
                <span className="text-xs" style={{ color: "#7A8394" }}>Est. commission (1%)</span>
                <span className="text-sm font-semibold" style={{ color: "#4ADE80" }}>+{commission.toLocaleString()} HTG</span>
              </motion.div>
            )}

            {/* Continue */}
            <button
              type="button"
              onClick={() => {
                if (!phone.trim()) { setError("Enter the customer's phone number"); return; }
                if (numAmt <= 0) { setError("Enter a valid amount"); return; }
                setError(null);
                setStep("confirm");
              }}
              className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-opacity active:opacity-80"
              style={{ background: `linear-gradient(135deg, ${AMBER} 0%, #D97706 100%)`, color: "#080B14" }}
            >
              Review Cash-In
              <ChevronRight className="w-4 h-4" />
            </button>

            {error && (
              <p className="text-center text-sm" style={{ color: "#F87171" }}>{error}</p>
            )}
          </motion.div>
        )}

        {/* ── CONFIRM ── */}
        {step === "confirm" && (
          <motion.div
            key="confirm"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            <div
              className="rounded-2xl p-6 space-y-5"
              style={{ background: "#151B2E", border: "1px solid rgba(245,158,11,0.18)" }}
            >
              <p className="text-xs font-medium text-center" style={{ color: "#7A8394" }}>CONFIRM CASH-IN</p>

              {/* Amount hero */}
              <div className="text-center py-2">
                <div className="text-5xl font-bold mb-1" style={{ color: "#F2F2F2" }}>
                  {numAmt.toLocaleString()}
                </div>
                <div className="text-lg" style={{ color: "#7A8394" }}>HTG</div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color: "#7A8394" }}>Customer phone</span>
                  <span style={{ color: "#F2F2F2" }}>{phone}</span>
                </div>
                <div className="flex justify-between text-sm py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color: "#7A8394" }}>Amount credited</span>
                  <span style={{ color: "#F2F2F2" }}>{numAmt.toLocaleString()} HTG</span>
                </div>
                <div className="flex justify-between text-sm py-2">
                  <span style={{ color: "#7A8394" }}>Your commission</span>
                  <span style={{ color: "#4ADE80" }}>+{commission.toLocaleString()} HTG</span>
                </div>
              </div>

              <p className="text-xs text-center" style={{ color: "#7A8394" }}>
                This will debit your float and credit the customer's wallet instantly.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-4 rounded-2xl font-semibold text-base transition-opacity active:opacity-80"
              style={{ background: `linear-gradient(135deg, ${AMBER} 0%, #D97706 100%)`, color: "#080B14" }}
            >
              Confirm &amp; Send
            </button>

            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full py-3 rounded-2xl font-medium text-sm"
              style={{ background: "rgba(255,255,255,0.04)", color: "#C4C7CF", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Back
            </button>
          </motion.div>
        )}

        {/* ── PROCESSING ── */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-4 mt-24"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(245,158,11,0.1)", border: "2px solid rgba(245,158,11,0.3)" }}
            >
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: AMBER }} />
            </div>
            <p className="text-base font-medium" style={{ color: "#F2F2F2" }}>Processing cash-in…</p>
            <p className="text-sm" style={{ color: "#7A8394" }}>Crediting {phone}</p>
          </motion.div>
        )}

        {/* ── SUCCESS ── */}
        {step === "success" && (
          <motion.div
            key="success"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            <div
              className="rounded-2xl p-6 space-y-5 text-center"
              style={{ background: "#151B2E", border: `1px solid ${EMERALD}33` }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "rgba(31,111,74,0.15)" }}
              >
                <CheckCircle2 className="w-10 h-10" style={{ color: "#4ADE80" }} />
              </div>

              <div>
                <div className="text-4xl font-bold mb-1" style={{ color: "#F2F2F2" }}>
                  {numAmt.toLocaleString()} HTG
                </div>
                <p className="text-sm" style={{ color: "#7A8394" }}>credited to <span style={{ color: "#F2F2F2" }}>{phone}</span></p>
              </div>

              {(receipt?.commission ?? 0) > 0 && (
                <div
                  className="rounded-xl py-3 px-4"
                  style={{ background: "rgba(31,111,74,0.1)", border: "1px solid rgba(31,111,74,0.2)" }}
                >
                  <p className="text-xs" style={{ color: "#7A8394" }}>Commission earned</p>
                  <p className="text-xl font-bold" style={{ color: "#4ADE80" }}>
                    +{receipt?.commission?.toLocaleString()} HTG
                  </p>
                </div>
              )}

              {receipt?.transactionId && (
                <p className="text-xs" style={{ color: "#7A8394" }}>
                  Ref: {receipt.transactionId}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setStep("form"); setPhone(""); setAmount(""); setReceipt(null); }}
              className="w-full py-4 rounded-2xl font-semibold text-base transition-opacity active:opacity-80"
              style={{ background: `linear-gradient(135deg, ${AMBER} 0%, #D97706 100%)`, color: "#080B14" }}
            >
              New Cash-In
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 rounded-2xl font-medium text-sm"
              style={{ background: "rgba(255,255,255,0.04)", color: "#C4C7CF", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Back to Dashboard
            </button>
          </motion.div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <motion.div
            key="error"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            <div
              className="rounded-2xl p-6 space-y-4 text-center"
              style={{ background: "#151B2E", border: "1px solid rgba(248,113,113,0.25)" }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "rgba(248,113,113,0.1)" }}
              >
                <AlertCircle className="w-10 h-10" style={{ color: "#F87171" }} />
              </div>
              <div>
                <p className="text-base font-semibold mb-1" style={{ color: "#F2F2F2" }}>Cash-In Failed</p>
                <p className="text-sm" style={{ color: "#F87171" }}>{error}</p>
              </div>
              <p className="text-xs" style={{ color: "#7A8394" }}>
                No funds were moved. Your float is unchanged.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep("confirm")}
              className="w-full py-4 rounded-2xl font-semibold text-base transition-opacity active:opacity-80"
              style={{ background: `linear-gradient(135deg, ${AMBER} 0%, #D97706 100%)`, color: "#080B14" }}
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full py-3 rounded-2xl font-medium text-sm"
              style={{ background: "rgba(255,255,255,0.04)", color: "#C4C7CF", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Edit Details
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Float indicator */}
      {(step === "form" || step === "confirm") && (
        <div
          className="fixed bottom-6 left-4 right-4 rounded-2xl px-4 py-3 flex justify-between items-center"
          style={{ background: "rgba(21,27,46,0.95)", border: `1px solid ${AMBER_DIM}44`, backdropFilter: "blur(12px)" }}
        >
          <span className="text-xs" style={{ color: "#7A8394" }}>Available float</span>
          <span className="text-sm font-semibold" style={{ color: AMBER }}>— HTG</span>
        </div>
      )}
    </div>
  );
}
