"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { attemptTransfer, confirmTransfer } from "@/lib/transfer";
import { useWallet } from "@/context/wallet-context";
import { useToast } from "@kobklein/ui";
import StepUpModal from "@/components/security/step-up-modal";
import FxPreviewCard from "@/components/finance/fx-preview-card";
import {
  Send, User, Phone, ChevronRight, Star, CheckCircle2,
  ArrowRight, ArrowLeftRight, Zap, Shield,
  RefreshCw, Check, AlertCircle, X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SendState = "idle" | "confirming" | "processing" | "otp" | "success";

type Recipient = {
  contactUserId: string;
  nickname?: string;
  isFavorite: boolean;
  transferCount: number;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    handle?: string;
    phone?: string;
  };
  trust: { score: number; level: string; reasons: string[] };
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(r: Recipient) {
  const name = r.user.firstName || r.user.handle || "?";
  return name.slice(0, 2).toUpperCase();
}

function getDisplayName(r: Recipient) {
  const parts = [r.user.firstName, r.user.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : (r.user.handle || "User");
}

const TRUST_CONFIG = {
  trusted:  { label: "Trusted",  color: "#22C55E", bg: "rgba(34,197,94,0.12)",   dot: "bg-emerald-400" },
  moderate: { label: "Active",   color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  dot: "bg-amber-400"   },
  new:      { label: "New",      color: "#6B7280", bg: "rgba(107,114,128,0.12)", dot: "bg-gray-400"    },
};

function TrustBadge({ level }: { level: string }) {
  const cfg = TRUST_CONFIG[level as keyof typeof TRUST_CONFIG] ?? TRUST_CONFIG.new;
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Avatar circle ─────────────────────────────────────────────────────────────

function Avatar({ r, size = "md" }: { r: Recipient; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "w-16 h-16 text-xl" : size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";
  const colors = ["from-blue-500/40 to-blue-600/20", "from-purple-500/40 to-purple-600/20",
                  "from-teal-500/40 to-teal-600/20", "from-rose-500/40 to-rose-600/20",
                  "from-amber-500/40 to-amber-600/20", "from-[#C9A84C]/40 to-[#9F7F2C]/20"];
  const grad = colors[getInitials(r).charCodeAt(0) % colors.length];
  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center
                     font-black text-[#F0F1F5] border border-[#0D9E8A]/[0.25] shrink-0`}>
      {getInitials(r)}
    </div>
  );
}

// ─── Wrapper (required for useSearchParams) ────────────────────────────────────

export default function SendPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center pt-32">
        <div className="w-10 h-10 rounded-2xl bg-[#C9A84C]/20 animate-pulse flex items-center justify-center">
          <Send className="h-5 w-5 text-[#C9A84C]" />
        </div>
      </div>
    }>
      <SendPage />
    </Suspense>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function SendPage() {
  const searchParams = useSearchParams();

  const [state,           setState]           = useState<SendState>("idle");
  const [phone,           setPhone]           = useState("");
  const [amount,          setAmount]          = useState("");
  const [fromCurrency,    setFromCurrency]    = useState("HTG");
  const [toCurrency,      setToCurrency]      = useState("HTG");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [recipientName,   setRecipientName]   = useState("");
  const [recipientTrust,  setRecipientTrust]  = useState("new");
  const [selectedR,       setSelectedR]       = useState<Recipient | null>(null);
  const [challengeId,     setChallengeId]     = useState<string | null>(null);
  const [otpCode,         setOtpCode]         = useState<string | null>(null);
  const [receipt,         setReceipt]         = useState<any>(null);
  const [error,           setError]           = useState<string | null>(null);
  const [smartRecipients, setSmartRecipients] = useState<Recipient[]>([]);
  const [fxPreview,       setFxPreview]       = useState<any>(null);
  const [previewLoading,  setPreviewLoading]  = useState(false);
  const [stepUpOpen,      setStepUpOpen]      = useState(false);
  const [lookupLoading,   setLookupLoading]   = useState(false);
  const [lookupResult,    setLookupResult]    = useState<{ name: string; kId?: string; kycTier?: number } | null>(null);
  const [lookupError,     setLookupError]     = useState<string | null>(null);

  const { optimisticDebit, refresh } = useWallet();
  const toast = useToast();

  // Pre-fill from URL
  useEffect(() => {
    const rid   = searchParams.get("recipientId");
    const rname = searchParams.get("name");
    if (rid) { setRecipientUserId(rid); if (rname) setRecipientName(decodeURIComponent(rname)); }
  }, [searchParams]);

  // Load smart recipients
  useEffect(() => {
    kkGet<Recipient[]>("v1/recipients/smart").then(setSmartRecipients).catch(() => {});
  }, []);

  // Debounced phone/K-ID lookup — runs when user types in the recipient field
  useEffect(() => {
    // Don't look up if already resolved from smart recipients or URL
    if (selectedR) return;
    const trimmed = phone.trim();
    if (trimmed.length < 4) {
      setLookupResult(null);
      setLookupError(null);
      if (!selectedR) { setRecipientUserId(""); setRecipientName(""); }
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    const t = setTimeout(async () => {
      try {
        const res = await kkPost<any>("v1/transfers/check-recipient", { query: trimmed });
        if (res.selfMatch) {
          setLookupError("You can't send money to yourself.");
          setLookupResult(null);
          setRecipientUserId("");
          setRecipientName("");
        } else if (res.exists) {
          const name = [res.firstName, res.lastName].filter(Boolean).join(" ") || res.handle || trimmed;
          setLookupResult({ name, kId: res.kId, kycTier: res.kycTier });
          setRecipientUserId(res.recipientId);
          setRecipientName(name);
          setRecipientTrust("new");
          setLookupError(null);
        } else {
          setLookupResult(null);
          setLookupError("No user found with this phone, K-ID, or handle.");
          setRecipientUserId("");
          setRecipientName("");
        }
      } catch {
        setLookupResult(null);
        setLookupError(null); // Silent fail — don't alarm user mid-typing
        setRecipientUserId("");
      } finally {
        setLookupLoading(false);
      }
    }, 600);
    return () => { clearTimeout(t); setLookupLoading(false); };
  }, [phone, selectedR]);

  // Debounced FX preview
  useEffect(() => {
    if (!amount || Number(amount) <= 0 || !recipientUserId) { setFxPreview(null); return; }
    const t = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const preview = await kkPost("v1/transfers/preview", {
          recipientUserId, amount: Number(amount), fromCurrency, toCurrency,
        });
        setFxPreview(preview);
      } catch { setFxPreview(null); }
      finally { setPreviewLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [amount, recipientUserId, fromCurrency, toCurrency]);

  function selectRecipient(r: Recipient) {
    setSelectedR(r);
    setRecipientUserId(r.contactUserId);
    setRecipientName(getDisplayName(r));
    setRecipientTrust(r.trust.level);
    setPhone(r.user.phone || r.user.handle || "");
    setLookupResult(null);
    setLookupError(null);
  }

  function handleContinue() {
    if (!recipientUserId || !amount) { setError("Please select a recipient and enter an amount."); return; }
    if (fxPreview?.rateLockExpiresAt && new Date(fxPreview.rateLockExpiresAt).getTime() < Date.now()) {
      setError("Rate expired — refreshing…"); setFxPreview(null); return;
    }
    setError(null);
    setState("confirming");
  }

  async function handleConfirmSend() {
    setState("processing"); setError(null);
    try {
      const result = await attemptTransfer({ recipientUserId, amount: Number(amount), currency: fromCurrency });
      if (result.otpRequired && result.challengeId) {
        setChallengeId(result.challengeId);
        setOtpCode(result.otpCode ?? null);
        setStepUpOpen(true);
        setState("otp");
        return;
      }
      if (result.ok) {
        setReceipt(result); optimisticDebit(fromCurrency, Number(amount));
        toast.show("Transfer sent successfully!"); setState("success"); return;
      }
      setState("confirming");
    } catch (err: any) {
      if (err.message?.includes("rate_expired")) {
        setError("Rate expired — please review updated preview"); setFxPreview(null); setState("idle");
        toast.show("Rate expired — please review updated preview", "warning"); return;
      }
      setError(err.message || "Transfer failed"); toast.show(err.message || "Transfer failed", "error");
      setState("confirming");
    }
  }

  async function handleStepUpVerify(otpCode: string) {
    if (!challengeId) return;
    const result = await confirmTransfer({ challengeId, otpCode });
    if (result.ok) {
      setStepUpOpen(false); setReceipt(result); optimisticDebit(fromCurrency, Number(amount));
      toast.show("Transfer sent successfully!"); setState("success");
    } else { throw new Error("OTP verification failed"); }
  }

  function reset() {
    setState("idle"); setPhone(""); setAmount(""); setRecipientUserId("");
    setRecipientName(""); setRecipientTrust("new"); setSelectedR(null);
    setChallengeId(null); setOtpCode(null); setReceipt(null); setError(null); setFxPreview(null);
    setLookupResult(null); setLookupError(null);
    refresh();
  }

  const isCross = fromCurrency !== toCurrency;

  // ──────────────────────────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ──────────────────────────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="rounded-3xl overflow-hidden border border-emerald-500/20"
          style={{ background: "linear-gradient(160deg, #071A14 0%, #061210 100%)" }}
        >
          <div className="p-8 flex flex-col items-center text-center gap-4">
            {/* Animated check */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30
                         flex items-center justify-center"
            >
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </motion.div>

            <div>
              <p className="text-xs text-emerald-400/70 uppercase tracking-widest font-bold mb-1">
                Transfer Complete
              </p>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-black tabular-nums"
                style={{
                  background: "linear-gradient(135deg, #E2CA6E, #C9A84C)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}
              >
                {Number(amount).toLocaleString("fr-HT", { minimumFractionDigits: 2 })}
                <span className="text-lg ml-1 opacity-60">HTG</span>
              </motion.p>
            </div>

            <div className="flex items-center gap-3 py-3 px-5 rounded-2xl bg-[#0E2018] border border-[#0D9E8A]/[0.12] w-full justify-center">
              <div className="text-xl">→</div>
              <div>
                <p className="text-sm font-bold text-[#F0F1F5]">{recipientName}</p>
                {isCross && fxPreview?.recipientAmount && (
                  <p className="text-xs text-emerald-400">
                    Receives {Number(fxPreview.recipientAmount).toLocaleString()} {toCurrency}
                  </p>
                )}
              </div>
            </div>

            {receipt?.transferId && (
              <p className="text-[10px] text-[#4A5A72] font-mono">
                Ref: {receipt.transferId.slice(0, 16)}…
              </p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={reset}
              className="w-full py-3 rounded-2xl font-bold text-sm
                         bg-emerald-500/10 border border-emerald-500/20
                         text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              Send Another
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // CONFIRM SCREEN
  // ──────────────────────────────────────────────────────────────────────────────
  if (state === "confirming" || state === "processing" || state === "otp") {
    const isProcessing = state === "processing";
    return (
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setState("idle")}
            disabled={isProcessing}
            className="p-2 rounded-xl bg-[#0E2018] border border-[#0D9E8A]/[0.12]
                       hover:bg-[#122B22] transition-colors disabled:opacity-40"
          >
            <ArrowRight className="h-4 w-4 text-[#4A5A72] rotate-180" />
          </motion.button>
          <div>
            <h1 className="text-lg font-bold text-[#F0F1F5]">Confirm Transfer</h1>
            <p className="text-xs text-[#5A6B82]">Review details carefully</p>
          </div>
        </div>

        {/* Confirm card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden border border-[#0D9E8A]/[0.15]"
          style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)" }}
        >
          <div className="p-6 space-y-5">
            {/* Recipient */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0E2018] border border-[#0D9E8A]/[0.12]">
              {selectedR ? (
                <Avatar r={selectedR} size="sm" />
              ) : (
                <div className="w-9 h-9 rounded-2xl bg-[#122B22] flex items-center justify-center">
                  <User className="h-4 w-4 text-[#4A5A72]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#E0E4EE] truncate">{recipientName}</p>
                {phone && <p className="text-xs text-[#5A6B82]">{phone.replace(/(.{3}).*(.{2})$/, "$1•••$2")}</p>}
              </div>
              <TrustBadge level={recipientTrust} />
            </div>

            {/* Amount display */}
            <div className="text-center py-4">
              <p className="text-[10px] uppercase tracking-widest text-[#5A6B82] font-bold mb-1">You are sending</p>
              <p
                className="text-5xl font-black tabular-nums"
                style={{
                  background: "linear-gradient(135deg, #E2CA6E, #C9A84C)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}
              >
                {Number(amount).toLocaleString("fr-HT", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-lg font-bold text-[#C9A84C]/50 mt-1">{fromCurrency}</p>
            </div>

            {/* FX preview */}
            {(fxPreview || previewLoading) && (
              <FxPreviewCard data={fxPreview} loading={previewLoading} />
            )}

            {/* Warning */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/[0.15]">
              <Shield className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <p className="text-[10px] text-amber-400/80">
                Transfers may not be reversible. Verify the recipient before confirming.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/[0.15]">
                <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2 pt-1">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleConfirmSend}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                           font-bold text-sm text-[#050F0C] transition-all disabled:opacity-60"
                style={{
                  background: isProcessing
                    ? "rgba(201,168,76,0.4)"
                    : "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #A08030 100%)",
                  boxShadow: isProcessing ? "none" : "0 0 30px -6px rgba(201,168,76,0.4)",
                }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Confirm &amp; Send
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setState("idle")}
                disabled={isProcessing}
                className="w-full py-3 rounded-2xl font-semibold text-sm
                           bg-[#0E2018] border border-[#0D9E8A]/[0.12]
                           text-[#5A7A6A] hover:bg-[#122B22] hover:text-[#A0BBA8]
                           transition-all disabled:opacity-40"
              >
                Go Back
              </motion.button>
            </div>
          </div>
        </motion.div>

        <StepUpModal
          open={stepUpOpen}
          onClose={() => { setStepUpOpen(false); setState("confirming"); }}
          onVerify={handleStepUpVerify}
          challengeId={challengeId || undefined}
          otpCode={otpCode || undefined}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // IDLE: SELECT RECIPIENT + AMOUNT
  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-[#F0F1F5]">Send Money</h1>
        <p className="text-xs text-[#5A6B82] mt-0.5">Fast, secure transfers in HTG or USD</p>
      </motion.div>

      {/* Smart Recipients */}
      <AnimatePresence>
        {smartRecipients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <p className="text-[9px] uppercase tracking-[0.15em] text-[#4A5A72] font-bold mb-2.5">
              Recent &amp; Favorites
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {smartRecipients.slice(0, 8).map((r, i) => (
                <motion.button
                  key={r.contactUserId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectRecipient(r)}
                  className={`shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl
                               border transition-all duration-200 min-w-[70px]
                               ${recipientUserId === r.contactUserId
                                 ? "border-[#C9A84C]/50 bg-[#C9A84C]/10"
                                 : "border-[#0D9E8A]/[0.12] bg-[#0B1A16]/60 hover:bg-[#122B22] hover:border-[#0D9E8A]/[0.20]"
                               }`}
                >
                  <div className="relative">
                    <Avatar r={r} size="sm" />
                    {r.isFavorite && (
                      <Star className="absolute -top-1 -right-1 h-3 w-3 text-[#C9A84C] fill-[#C9A84C]" />
                    )}
                    {recipientUserId === r.contactUserId && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#C9A84C]
                                      flex items-center justify-center border border-[#050F0C]">
                        <Check className="h-2.5 w-2.5 text-[#050F0C]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-[#B0BBCC] truncate max-w-[60px] text-center leading-tight">
                    {r.user.firstName || r.user.handle || "User"}
                  </span>
                  <TrustBadge level={r.trust.level} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main form card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl overflow-hidden border border-[#0D9E8A]/[0.15]"
        style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)" }}
      >
        <div className="p-5 space-y-4">

          {/* Recipient input */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#5A6B82] font-bold mb-2 block">
              Recipient
            </label>
            <div className={`flex items-center gap-3 px-4 h-12 rounded-2xl border
                             transition-all duration-200
                             ${lookupError
                               ? "border-red-500/30 bg-red-500/[0.04]"
                               : recipientUserId
                               ? "border-[#C9A84C]/30 bg-[#C9A84C]/[0.04]"
                               : "border-[#0D9E8A]/[0.12] bg-[#0E2018] focus-within:border-[#C9A84C]/30"
                             }`}>
              <Phone className="h-4 w-4 text-[#5A6B82] shrink-0" />
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  // Clear smart selection when user types manually
                  if (selectedR) { setSelectedR(null); }
                }}
                placeholder="Phone, K-ID, or @handle"
                className="flex-1 bg-transparent text-sm text-[#E0E4EE] placeholder-[#3A4A60]
                           outline-none border-none"
              />
              {lookupLoading && (
                <RefreshCw className="h-3.5 w-3.5 text-[#5A6B82] animate-spin shrink-0" />
              )}
              {!lookupLoading && recipientUserId && (
                <div className="w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-[#050F0C]" />
                </div>
              )}
              {!lookupLoading && lookupError && (
                <X className="h-4 w-4 text-red-400 shrink-0" />
              )}
            </div>

            <AnimatePresence>
              {/* Resolved recipient */}
              {lookupResult && !selectedR && (
                <motion.div
                  key="lookup-result"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 mt-2 px-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-xs text-emerald-400 font-medium">{lookupResult.name}</p>
                  {lookupResult.kId && (
                    <span className="text-[9px] font-mono text-[#4A5A72]">{lookupResult.kId}</span>
                  )}
                </motion.div>
              )}
              {/* Smart recipient selected */}
              {selectedR && (
                <motion.div
                  key="selected-r"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 mt-2 px-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-xs text-emerald-400 font-medium">
                    {getDisplayName(selectedR)} selected
                  </p>
                  <TrustBadge level={selectedR.trust.level} />
                </motion.div>
              )}
              {/* Lookup error */}
              {lookupError && (
                <motion.div
                  key="lookup-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 mt-2 px-2"
                >
                  <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{lookupError}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Currency pair */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#5A6B82] font-bold mb-2 block">
              Currency
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-2xl
                             bg-[#0E2018] border border-[#0D9E8A]/[0.12]
                             text-sm text-[#E0E4EE] font-semibold
                             focus:outline-none focus:border-[#C9A84C]/30 cursor-pointer
                             transition-all"
                >
                  <option value="HTG">🇭🇹 Send HTG</option>
                  <option value="USD">🇺🇸 Send USD</option>
                </select>
              </div>

              <div className="flex flex-col items-center justify-center w-8 shrink-0">
                <ArrowLeftRight className="h-4 w-4 text-[#5A6B82]" />
              </div>

              <div className="flex-1 relative">
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-2xl
                             bg-[#0E2018] border border-[#0D9E8A]/[0.12]
                             text-sm text-[#E0E4EE] font-semibold
                             focus:outline-none focus:border-[#C9A84C]/30 cursor-pointer
                             transition-all"
                >
                  <option value="HTG">🇭🇹 Receive HTG</option>
                  <option value="USD">🇺🇸 Receive USD</option>
                </select>
              </div>
            </div>
            {isCross && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 mt-2 px-2"
              >
                <Zap className="h-3 w-3 text-[#C9A84C]" />
                <p className="text-[10px] text-[#C9A84C] font-medium">
                  Cross-currency transfer — live FX rate applied
                </p>
              </motion.div>
            )}
          </div>

          {/* Amount input */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#5A6B82] font-bold mb-2 block">
              Amount
            </label>
            <div className={`flex items-center gap-3 px-4 h-14 rounded-2xl border
                             transition-all duration-200
                             ${amount && Number(amount) > 0
                               ? "border-[#C9A84C]/30 bg-[#C9A84C]/[0.04]"
                               : "border-[#0D9E8A]/[0.12] bg-[#0E2018] focus-within:border-[#C9A84C]/30"
                             }`}>
              <span className="text-sm font-bold text-[#5A6B82] shrink-0">{fromCurrency}</span>
              <div className="w-px h-5 bg-[#0D9E8A]/[0.20] shrink-0" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-2xl font-black text-[#F0F1F5]
                           placeholder-[#3A4A60] outline-none border-none tabular-nums"
              />
              {previewLoading && (
                <RefreshCw className="h-4 w-4 text-[#5A6B82] animate-spin shrink-0" />
              )}
            </div>
          </div>

          {/* FX preview */}
          <AnimatePresence>
            {(fxPreview || previewLoading) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <FxPreviewCard data={fxPreview} loading={previewLoading} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/[0.15]"
              >
                <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleContinue}
            disabled={!recipientUserId || !amount || Number(amount) <= 0}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                       font-bold text-base text-[#050F0C] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: (!recipientUserId || !amount)
                ? "rgba(201,168,76,0.3)"
                : "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #A08030 100%)",
              boxShadow: (!recipientUserId || !amount) ? "none" : "0 0 30px -6px rgba(201,168,76,0.4)",
            }}
          >
            <Send className="h-4 w-4" />
            Continue
            <ChevronRight className="h-4 w-4" />
          </motion.button>

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Shield className="h-3 w-3 text-[#4A5A72]" />
            <p className="text-[10px] text-[#4A5A72]">256-bit encrypted · KYC verified</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



