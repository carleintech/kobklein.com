"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode, Hash, ChevronLeft, ShieldCheck, Zap,
  CheckCircle2, XCircle, Loader2,
  ArrowRight, Receipt, Copy, Home,
} from "lucide-react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { useWallet } from "@/context/wallet-context";
import { QrScanner } from "@/components/qr-scanner";

// ─── Types ────────────────────────────────────────────────────────────────────
type PayFlow =
  | "choose"    // landing: pick QR vs code
  | "qr"        // QR scanner view
  | "code"      // enter merchant code manually
  | "merchant"  // merchant confirmed, enter amount
  | "confirm"   // review & confirm
  | "processing"
  | "success"
  | "error";

type MerchantInfo = {
  id: string;
  name: string;
  logo?: string;
  verified: boolean;
  category?: string;
};

type ReceiptData = {
  merchant: string;
  amount: number;
  fee: number;
  net: number;
  transactionId: string;
  createdAt: string;
  currency: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, cur = "HTG") {
  return new Intl.NumberFormat("fr-HT", {
    style: "currency", currency: cur, minimumFractionDigits: 2,
  }).format(n);
}

// ─── Merchant Initials Avatar ─────────────────────────────────────────────────
function MerchantAvatar({ name, logo }: { name: string; logo?: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = [
    ["#C9A84C", "#9F7F2C"],
    ["#3B82F6", "#1D4ED8"],
    ["#10B981", "#059669"],
    ["#8B5CF6", "#7C3AED"],
    ["#F97316", "#EA580C"],
  ];
  const [a, b] = colors[name.charCodeAt(0) % colors.length];

  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#0D9E8A]/[0.20]"
      />
    );
  }
  return (
    <div
      className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      {initials}
    </div>
  );
}

// QrScannerView is replaced by the real QrScanner component — see PayContent below

// ─── Choose flow view ─────────────────────────────────────────────────────────
function ChooseFlowView({ onChoose }: { onChoose: (f: "qr" | "code") => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex flex-col gap-6"
    >
      {/* Title */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))", border: "1px solid rgba(201,168,76,0.2)" }}>
          <Zap className="h-7 w-7 text-[#C9A84C]" />
        </div>
        <h1 className="text-2xl font-black text-[#F0F1F5] mb-1">Pay Merchant</h1>
        <p className="text-sm text-[#5A6B82]">Choose how to find the merchant</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-4">
        {[
          {
            key: "qr" as const,
            icon: QrCode,
            title: "Scan QR Code",
            desc: "Point your camera at the merchant's QR code",
            gradient: "from-[#C9A84C]/20 to-[#9F7F2C]/10",
            border: "border-[#C9A84C]/20",
            iconColor: "#C9A84C",
            badge: "Fastest",
            badgeColor: "bg-[#C9A84C]/15 text-[#C9A84C]",
          },
          {
            key: "code" as const,
            icon: Hash,
            title: "Enter Merchant Code",
            desc: "Type the merchant's unique payment code",
            gradient: "from-[#3B82F6]/15 to-[#1D4ED8]/10",
            border: "border-[#3B82F6]/20",
            iconColor: "#3B82F6",
            badge: null,
            badgeColor: "",
          },
        ].map((opt) => (
          <motion.button
            key={opt.key}
            onClick={() => onChoose(opt.key)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`relative w-full rounded-2xl border bg-gradient-to-br ${opt.gradient} ${opt.border} p-5 flex items-center gap-4 text-left transition-all group`}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${opt.iconColor}18`, border: `1px solid ${opt.iconColor}25` }}
            >
              <opt.icon className="h-6 w-6" style={{ color: opt.iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#F0F1F5]">{opt.title}</span>
                {opt.badge && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${opt.badgeColor}`}>
                    {opt.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5A6B82] mt-0.5">{opt.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#3A4558] group-hover:text-[#7A8394] transition-colors shrink-0" />
          </motion.button>
        ))}
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2.5 rounded-xl bg-[#0E2018] border border-[#0D9E8A]/[0.10] px-4 py-3">
        <ShieldCheck className="h-4 w-4 text-[#10B981] shrink-0" />
        <p className="text-xs text-[#5A6B82]">
          All payments are encrypted end-to-end and protected by KobKlein Shield
        </p>
      </div>
    </motion.div>
  );
}

// ─── Code entry view ──────────────────────────────────────────────────────────
function CodeEntryView({
  onBack, onConfirm,
}: { onBack: () => void; onConfirm: (id: string) => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleLookup() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      onConfirm(code.trim());
    } catch {
      setError("Merchant not found. Check the code and try again.");
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[#0E2018] hover:bg-[#122B22] text-[#6A8A7A] hover:text-[#E0E4EE] transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-[#F0F1F5]">Merchant Code</h2>
          <p className="text-xs text-[#5A6B82]">Enter the unique merchant code</p>
        </div>
      </div>

      {/* Input area */}
      <div className="rounded-2xl bg-[#0B1A16] border border-[#0D9E8A]/[0.12] p-6 flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[#0E2018] flex items-center justify-center">
          <Hash className="h-7 w-7 text-[#C9A84C]" />
        </div>

        <div className="w-full relative">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="e.g. MRC-AB12"
            maxLength={12}
            className="w-full text-center text-2xl font-black text-[#F0F1F5] placeholder-[#2A3448]
                       bg-[#0E2018] border-2 rounded-2xl px-4 py-4 outline-none tracking-[0.3em]
                       transition-colors"
            style={{
              borderColor: code ? "#C9A84C" : "rgba(13,158,138,0.15)",
              boxShadow: code ? "0 0 20px -4px rgba(201,168,76,0.2)" : "none",
            }}
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 text-sm"
          >
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </div>

      <motion.button
        onClick={handleLookup}
        disabled={!code.trim() || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full h-14 rounded-2xl font-bold text-base text-[#050F0C]
                   disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)",
          boxShadow: code.trim() ? "0 8px 24px -4px rgba(201,168,76,0.4)" : "none",
        }}
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Find Merchant <ArrowRight className="h-4 w-4" /></>}
      </motion.button>
    </motion.div>
  );
}

// ─── Merchant + Amount view ───────────────────────────────────────────────────
function MerchantPayView({
  merchant, onBack, onPay, currency = "HTG",
}: {
  merchant: MerchantInfo;
  onBack: () => void;
  onPay: (amount: number) => void;
  currency?: string;
}) {
  const [amount, setAmount] = useState("");
  const FEE_RATE = 0.015;
  const numAmount = parseFloat(amount) || 0;
  const fee = numAmount * FEE_RATE;
  const total = numAmount + fee;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-[#0E2018] hover:bg-[#122B22] text-[#6A8A7A] hover:text-[#E0E4EE] transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-[#F0F1F5]">Pay Merchant</h2>
          <p className="text-xs text-[#5A6B82]">Enter the amount to pay</p>
        </div>
      </div>

      {/* Merchant card */}
      <div className="rounded-2xl bg-[#0B1A16] border border-[#0D9E8A]/[0.12] p-5 flex items-center gap-4">
        <MerchantAvatar name={merchant.name} logo={merchant.logo} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-[#F0F1F5] truncate">{merchant.name}</span>
            {merchant.verified && (
              <div className="flex items-center gap-1 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full px-2 py-0.5 shrink-0">
                <ShieldCheck className="h-3 w-3 text-[#10B981]" />
                <span className="text-[9px] font-black text-[#10B981] uppercase tracking-wide">Verified</span>
              </div>
            )}
          </div>
          {merchant.category && (
            <p className="text-xs text-[#5A6B82] mt-0.5">{merchant.category}</p>
          )}
          <p className="text-[10px] text-[#3A4558] mt-1 font-mono">ID: {merchant.id}</p>
        </div>
      </div>

      {/* Amount input */}
      <div className="rounded-2xl bg-[#0B1A16] border border-[#0D9E8A]/[0.12] p-5 flex flex-col gap-4">
        <label className="text-xs font-bold text-[#5A6B82] uppercase tracking-wider">Amount</label>

        <div
          className="relative rounded-xl border-2 transition-all"
          style={{
            borderColor: numAmount > 0 ? "#C9A84C" : "rgba(13,158,138,0.15)",
            boxShadow: numAmount > 0 ? "0 0 20px -4px rgba(201,168,76,0.2)" : "none",
          }}
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6B82] text-sm font-bold">
            {currency === "HTG" ? "G" : "$"}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="1"
            className="w-full bg-transparent text-right pr-4 pl-8 py-4 text-2xl font-black
                       text-[#F0F1F5] placeholder-[#2A3448] outline-none"
          />
        </div>

        {/* Fee breakdown */}
        <AnimatePresence>
          {numAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl bg-[#0E2018] border border-[#0D9E8A]/[0.10] p-3 space-y-2">
                {[
                  { label: "Amount", value: fmt(numAmount, currency), color: "text-[#B8BCC8]" },
                  { label: "Service Fee (1.5%)", value: fmt(fee, currency), color: "text-[#7A8394]" },
                  { label: "Total Deducted", value: fmt(total, currency), color: "text-[#C9A84C] font-bold" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-[#5A6B82]">{row.label}</span>
                    <span className={row.color}>{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pay button */}
      <motion.button
        onClick={() => onPay(numAmount)}
        disabled={numAmount <= 0}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full h-14 rounded-2xl font-bold text-base text-[#050F0C]
                   disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)",
          boxShadow: numAmount > 0 ? "0 8px 24px -4px rgba(201,168,76,0.4)" : "none",
        }}
      >
        <Zap className="h-5 w-5" />
        Pay {numAmount > 0 ? fmt(numAmount, currency) : ""}
      </motion.button>
    </motion.div>
  );
}

// ─── Confirm view ─────────────────────────────────────────────────────────────
function ConfirmView({
  merchant, amount, currency, onBack, onConfirm, processing,
}: {
  merchant: MerchantInfo;
  amount: number;
  currency: string;
  onBack: () => void;
  onConfirm: () => void;
  processing: boolean;
}) {
  const FEE_RATE = 0.015;
  const fee = amount * FEE_RATE;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={processing}
          className="p-2 rounded-xl bg-[#0E2018] hover:bg-[#122B22] text-[#6A8A7A] hover:text-[#E0E4EE] transition-all disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-[#F0F1F5]">Confirm Payment</h2>
          <p className="text-xs text-[#5A6B82]">Review before sending</p>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl bg-[#0B1A16] border border-[#0D9E8A]/[0.12] overflow-hidden">
        {/* Amount hero */}
        <div className="p-6 text-center border-b border-[#0D9E8A]/[0.08]"
          style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))" }}>
          <p className="text-xs text-[#5A6B82] uppercase tracking-widest mb-2">You're paying</p>
          <p className="text-4xl font-black text-[#F0F1F5]">{fmt(amount, currency)}</p>
          <p className="text-sm text-[#5A6B82] mt-1">+ {fmt(fee, currency)} fee</p>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          {[
            { label: "To", value: merchant.name },
            { label: "Merchant ID", value: merchant.id, mono: true },
            { label: "Service Fee", value: fmt(fee, currency) },
            { label: "Total", value: fmt(amount + fee, currency), bold: true },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center text-sm">
              <span className="text-[#5A6B82]">{row.label}</span>
              <span className={`${row.bold ? "text-[#C9A84C] font-black text-base" : "text-[#B8BCC8] font-medium"} ${row.mono ? "font-mono text-xs" : ""}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm button */}
      <motion.button
        onClick={onConfirm}
        disabled={processing}
        whileHover={{ scale: processing ? 1 : 1.02 }}
        whileTap={{ scale: processing ? 1 : 0.98 }}
        className="w-full h-14 rounded-2xl font-bold text-base text-[#050F0C]
                   disabled:opacity-70 transition-all flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)",
          boxShadow: "0 8px 24px -4px rgba(201,168,76,0.4)",
        }}
      >
        {processing ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
        ) : (
          <><ShieldCheck className="h-5 w-5" /> Confirm Payment</>
        )}
      </motion.button>

      <p className="text-center text-[10px] text-[#3A4558]">
        Protected by KobKlein Shield • End-to-end encrypted
      </p>
    </motion.div>
  );
}

// ─── Processing View ──────────────────────────────────────────────────────────
function ProcessingView() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-6 py-12"
    >
      {/* Animated ring */}
      <div className="relative w-28 h-28">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-transparent"
          style={{ borderTopColor: "#C9A84C", borderRightColor: "#C9A84C44" }}
        />
        <div className="absolute inset-3 rounded-full bg-[#071A14] flex items-center justify-center">
          <Zap className="h-8 w-8 text-[#C9A84C]" />
        </div>
      </div>

      <div className="text-center">
        <p className="text-lg font-bold text-[#F0F1F5]">
          Processing{".".repeat(dots)}
        </p>
        <p className="text-sm text-[#5A6B82] mt-1">Securing your transaction</p>
      </div>

      <div className="flex gap-2">
        {["Encrypting", "Verifying", "Sending"].map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.3 }}
            className="px-3 py-1.5 rounded-full bg-[#0E2018] border border-[#0D9E8A]/[0.10] text-xs text-[#5A6B82] flex items-center gap-1.5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
            {step}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Success / Receipt View ───────────────────────────────────────────────────
function SuccessView({
  receipt, onDone,
}: { receipt: ReceiptData; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  function copyTxId() {
    navigator.clipboard.writeText(receipt.transactionId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex flex-col items-center gap-6"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))", border: "2px solid rgba(16,185,129,0.3)" }}>
          <CheckCircle2 className="h-12 w-12 text-[#10B981]" />
        </div>
        {/* Rings */}
        {[1, 2].map((r) => (
          <motion.div
            key={r}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1 + r * 0.4, opacity: 0 }}
            transition={{ duration: 1, delay: r * 0.2, repeat: 2 }}
            className="absolute inset-0 rounded-full border border-[#10B981]/30"
          />
        ))}
      </motion.div>

      <div className="text-center">
        <h2 className="text-2xl font-black text-[#F0F1F5]">Payment Sent!</h2>
        <p className="text-sm text-[#5A6B82] mt-1">Your payment was processed successfully</p>
      </div>

      {/* Receipt card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full rounded-2xl bg-[#0B1A16] border border-[#0D9E8A]/[0.12] overflow-hidden"
      >
        {/* Receipt header */}
        <div className="p-5 border-b border-[#0D9E8A]/[0.08] flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))" }}>
          <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-[#10B981]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#F0F1F5]">Receipt</p>
            <p className="text-xs text-[#5A6B82]">{new Date(receipt.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Receipt rows */}
        <div className="p-5 space-y-3">
          {[
            { label: "Merchant", value: receipt.merchant },
            { label: "Amount Paid", value: fmt(receipt.amount, receipt.currency), highlight: true },
            { label: "Service Fee", value: fmt(receipt.fee, receipt.currency) },
            { label: "Net to Merchant", value: fmt(receipt.net, receipt.currency) },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center text-sm">
              <span className="text-[#5A6B82]">{row.label}</span>
              <span className={row.highlight ? "text-[#C9A84C] font-black text-base" : "text-[#B8BCC8] font-medium"}>
                {row.value}
              </span>
            </div>
          ))}

          {/* Divider */}
          <div className="border-t border-dashed border-[#0D9E8A]/[0.10] pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#5A6B82]">Transaction ID</span>
              <button
                onClick={copyTxId}
                className="flex items-center gap-1.5 text-[#4A5A72] hover:text-[#C9A84C] transition-colors font-mono"
              >
                <span className="truncate max-w-[120px]">{receipt.transactionId}</span>
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                ) : (
                  <Copy className="h-3.5 w-3.5 shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="w-full grid grid-cols-2 gap-3">
        <button
          onClick={onDone}
          className="h-12 rounded-xl bg-[#0E2018] border border-[#0D9E8A]/[0.12] text-sm font-bold text-[#A0BBA8]
                     hover:bg-[#122B22] hover:text-[#F0F1F5] transition-all flex items-center justify-center gap-2"
        >
          <QrCode className="h-4 w-4" />
          Pay Again
        </button>
        <button
          onClick={() => router.push("/wallet")}
          className="h-12 rounded-xl font-bold text-sm text-[#050F0C] flex items-center justify-center gap-2 transition-all"
          style={{ background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)" }}
        >
          <Home className="h-4 w-4" />
          Wallet
        </button>
      </div>
    </motion.div>
  );
}

// ─── Error View ───────────────────────────────────────────────────────────────
function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.2)" }}>
        <XCircle className="h-10 w-10 text-red-400" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-[#F0F1F5]">Payment Failed</h3>
        <p className="text-sm text-[#5A6B82] mt-2 max-w-xs">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-8 h-12 rounded-xl font-bold text-sm text-[#050F0C]"
        style={{ background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)" }}
      >
        Try Again
      </button>
    </motion.div>
  );
}

// ─── Main Pay Content ─────────────────────────────────────────────────────────
function PayContent() {
  const params = useSearchParams();
  const urlMerchantId = params.get("merchantId");
  const { optimisticDebit } = useWallet();

  const [flow, setFlow]           = useState<PayFlow>(urlMerchantId ? "merchant" : "choose");
  const [merchant, setMerchant]   = useState<MerchantInfo | null>(null);
  const [amount, setAmount]       = useState(0);
  const [currency]                = useState("HTG");
  const [receipt, setReceipt]     = useState<ReceiptData | null>(null);
  const [errorMsg, setErrorMsg]   = useState("");
  const [processing, setProcessing] = useState(false);
  const [qrOpen, setQrOpen]       = useState(false);

  // Auto-load merchant from URL ?merchantId=
  useEffect(() => {
    if (!urlMerchantId) return;
    kkGet(`public/merchant/${urlMerchantId}`)
      .then((res: any) => {
        setMerchant({
          id: res.id,
          name: res.name,
          logo: res.logo,
          verified: res.verified,
          category: res.category,
        });
        setFlow("merchant");
      })
      .catch(() => setFlow("choose"));
  }, [urlMerchantId]);

  async function handleCodeLookup(code: string) {
    try {
      const res = await kkGet(`public/merchant/code/${code}`) as any;
      setMerchant({
        id: res.id,
        name: res.name,
        logo: res.logo,
        verified: res.verified,
        category: res.category,
      });
      setFlow("merchant");
    } catch {
      setErrorMsg("Merchant not found. Check the code and try again.");
      setFlow("error");
    }
  }

  // Parse QR payload: kobklein://pay?merchantId=XXX  or  kobklein://pay?code=XXX  or raw code
  async function handleQrResult(payload: string) {
    setQrOpen(false);
    try {
      let merchantId: string | null = null;
      let merchantCode: string | null = null;

      if (payload.startsWith("kobklein://")) {
        const url = new URL(payload.replace("kobklein://", "https://kobklein.com/"));
        merchantId = url.searchParams.get("merchantId");
        merchantCode = url.searchParams.get("code");
      } else {
        merchantCode = payload;
      }

      if (merchantId) {
        const res = await kkGet(`public/merchant/${merchantId}`) as any;
        setMerchant({ id: res.id, name: res.name, logo: res.logo, verified: res.verified, category: res.category });
        setFlow("merchant");
      } else if (merchantCode) {
        await handleCodeLookup(merchantCode);
      } else {
        setErrorMsg("Invalid QR code. Please try the merchant code instead.");
        setFlow("error");
      }
    } catch {
      setErrorMsg("Could not read QR code. Please try entering the merchant code manually.");
      setFlow("error");
    }
  }

  async function handlePay() {
    if (!merchant) return;
    setProcessing(true);
    setFlow("processing");
    try {
      const res = await kkPost("v1/merchant/pay", {
        merchantId: merchant.id,
        amount,
        currency,
      }) as any;

      const rec: ReceiptData = {
        merchant: res.receipt?.merchant ?? merchant.name,
        amount: res.receipt?.amount ?? amount,
        fee: res.receipt?.fee ?? amount * 0.015,
        net: res.receipt?.net ?? amount * 0.985,
        transactionId: res.receipt?.transactionId ?? `TX-${Date.now()}`,
        createdAt: res.receipt?.createdAt ?? new Date().toISOString(),
        currency,
      };

      optimisticDebit(currency, amount + rec.fee);
      setReceipt(rec);
      setFlow("success");
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong. Please try again.");
      setFlow("error");
    } finally {
      setProcessing(false);
    }
  }

  function reset() {
    setFlow("choose");
    setMerchant(null);
    setAmount(0);
    setReceipt(null);
    setErrorMsg("");
  }

  return (
    <>
      {/* Real QR Scanner — full-screen overlay */}
      <AnimatePresence>
        {qrOpen && (
          <QrScanner
            onResult={handleQrResult}
            onClose={() => { setQrOpen(false); setFlow("choose"); }}
            title="Scan Merchant QR"
            hint="Point at the merchant's KobKlein QR code"
          />
        )}
      </AnimatePresence>

    <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-8">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {flow === "choose" && (
            <motion.div key="choose">
              <ChooseFlowView
                onChoose={(f) => {
                  if (f === "qr") { setQrOpen(true); }
                  else { setFlow(f); }
                }}
              />
            </motion.div>
          )}

          {flow === "code" && (
            <motion.div key="code">
              <CodeEntryView
                onBack={() => setFlow("choose")}
                onConfirm={handleCodeLookup}
              />
            </motion.div>
          )}

          {flow === "merchant" && merchant && (
            <motion.div key="merchant">
              <MerchantPayView
                merchant={merchant}
                onBack={() => setFlow(urlMerchantId ? "choose" : "code")}
                onPay={(amt) => { setAmount(amt); setFlow("confirm"); }}
                currency={currency}
              />
            </motion.div>
          )}

          {flow === "confirm" && merchant && (
            <motion.div key="confirm">
              <ConfirmView
                merchant={merchant}
                amount={amount}
                currency={currency}
                onBack={() => setFlow("merchant")}
                onConfirm={handlePay}
                processing={processing}
              />
            </motion.div>
          )}

          {flow === "processing" && (
            <motion.div key="processing">
              <ProcessingView />
            </motion.div>
          )}

          {flow === "success" && receipt && (
            <motion.div key="success">
              <SuccessView receipt={receipt} onDone={reset} />
            </motion.div>
          )}

          {flow === "error" && (
            <motion.div key="error">
              <ErrorView message={errorMsg} onRetry={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function PayMerchantPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-transparent"
            style={{ borderTopColor: "#C9A84C" }}
          />
          <p className="text-sm text-[#5A6B82]">Loading…</p>
        </div>
      </div>
    }>
      <PayContent />
    </Suspense>
  );
}
