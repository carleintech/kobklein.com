"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Building2, CheckCircle2, ChevronRight,
  Copy, CreditCard, DollarSign, Globe, Loader2,
  ShieldCheck, Smartphone, Wallet, Zap, Info,
  Clock, ArrowRight, Send, X,
} from "lucide-react";
import { kkGet, kkPost } from "@/lib/kobklein-api";
import { useToast } from "@kobklein/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type FundMethod = "bank_wire" | "paypal" | "apple_pay" | "cashapp";

type BalanceResponse = {
  totalBalance?: number;
  availableBalance?: number;
  balances?: { type: string; balance: number; currency: string }[];
};

type UserProfile = {
  walletId?: string;
  phone?: string;
  firstName?: string;
};

type WireDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
  reference: string;
  memo: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHTG(n: number) {
  return n.toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

// Approximate exchange rate (in production, fetch from FX API)
const HTG_PER_USD = 132;

// ─── Method card ──────────────────────────────────────────────────────────────

type MethodConfig = {
  key: FundMethod;
  label: string;
  desc: string;
  icon: typeof Wallet;
  gradient: string;
  border: string;
  iconColor: string;
  available: boolean;
  eta: string;
  fee: string;
};

const METHODS: MethodConfig[] = [
  {
    key:       "bank_wire",
    label:     "Bank Wire / ACH",
    desc:      "Transfer from your US/Canada bank account",
    icon:      Building2,
    gradient:  "from-[#C9A84C]/15 to-[#9F7F2C]/8",
    border:    "border-[#C9A84C]/20",
    iconColor: "#C9A84C",
    available: true,
    eta:       "1-3 business days",
    fee:       "No KobKlein fee",
  },
  {
    key:       "paypal",
    label:     "PayPal",
    desc:      "Fund instantly via your PayPal balance",
    icon:      Globe,
    gradient:  "from-[#0D9E8A]/12 to-[#077A60]/6",
    border:    "border-[#0D9E8A]/15",
    iconColor: "#0D9E8A",
    available: false,
    eta:       "Instant",
    fee:       "2.9% + $0.30",
  },
  {
    key:       "apple_pay",
    label:     "Apple Pay",
    desc:      "Pay with Face ID using your Apple Wallet",
    icon:      Smartphone,
    gradient:  "from-white/5 to-white/2",
    border:    "border-white/10",
    iconColor: "#F0F1F5",
    available: false,
    eta:       "Instant",
    fee:       "0% KobKlein fee",
  },
  {
    key:       "cashapp",
    label:     "Cash App",
    desc:      "Send from your Cash App $Cashtag",
    icon:      DollarSign,
    gradient:  "from-[#10B981]/10 to-[#059669]/5",
    border:    "border-[#10B981]/15",
    iconColor: "#10B981",
    available: false,
    eta:       "Instant",
    fee:       "1% fee",
  },
];

// ─── Wire Details Panel ───────────────────────────────────────────────────────

function WireDetailsPanel({ walletId, onClose }: { walletId: string; onClose: () => void }) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const numAmt = parseFloat(amount) || 0;
  const htgEquiv = Math.round(numAmt * HTG_PER_USD);

  // In production these would come from your bank/treasury config
  const wire: WireDetails = {
    bankName:      "First National Bank",
    accountName:   "KobKlein Inc.",
    accountNumber: "****4821",
    routingNumber:  "021000089",
    swiftCode:     "KOBKUS33",
    reference:     `KK-${walletId.slice(-8).toUpperCase()}`,
    memo:          `Deposit for wallet ${walletId.slice(-8).toUpperCase()}`,
  };

  function copyField(value: string, label: string) {
    navigator.clipboard.writeText(value).catch(() => {});
    toast.show(`${label} copied`, "success");
  }

  async function handleNotify() {
    if (!numAmt || numAmt <= 0) return;
    setSubmitting(true);
    try {
      await kkPost("v1/deposits/notify", {
        walletId,
        amount: numAmt,
        currency: "USD",
        method: "bank_wire",
        reference: wire.reference,
      });
      setSubmitted(true);
    } catch {
      toast.show("Could not send notification — please contact support", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(6,9,18,0.85)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.96 }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0B1A16 0%, #081410 100%)", border: "1px solid rgba(201,168,76,0.15)" }}
      >
        {/* Sheet header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#0D9E8A]/[0.10]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#F0F1F5]">Wire Transfer Details</p>
              <p className="text-xs text-[#5A6B82]">Reference required for processing</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X className="h-4 w-4 text-[#5A6B82]" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.25)" }}>
                <CheckCircle2 className="h-8 w-8 text-[#10B981]" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-[#F0F1F5]">Notification Sent</p>
                <p className="text-xs text-[#5A6B82] mt-1 max-w-xs">
                  We&apos;ll credit your wallet within 1-3 business days once we receive{" "}
                  <span className="text-[#C9A84C]">{fmtUSD(numAmt)}</span> via wire.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-[#050F0C]"
                style={{ background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)" }}
              >
                Done
              </button>
            </motion.div>
          ) : (
            <>
              {/* Amount to wire */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A6B82] uppercase tracking-wider">
                  Amount to Wire (USD)
                </label>
                <div
                  className="relative rounded-xl border-2 transition-all"
                  style={{
                    borderColor: numAmt > 0 ? "#C9A84C" : "rgba(13,158,138,0.15)",
                  }}
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6B82] text-sm font-bold">$</div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="10"
                    className="w-full bg-transparent text-right pr-4 pl-8 py-3 text-xl font-black
                               text-[#F0F1F5] placeholder-[#2A3448] outline-none"
                  />
                </div>
                {numAmt > 0 && (
                  <p className="text-xs text-[#5A6B82]">
                    ≈ <span className="text-[#C9A84C] font-bold">{fmtHTG(htgEquiv)} HTG</span> at today&apos;s rate
                  </p>
                )}
              </div>

              {/* Wire rows */}
              {[
                { label: "Bank Name",       value: wire.bankName,      copyable: false },
                { label: "Account Name",    value: wire.accountName,   copyable: true  },
                { label: "Routing Number",  value: wire.routingNumber,  copyable: true  },
                { label: "SWIFT / BIC",    value: wire.swiftCode,     copyable: true  },
                { label: "Reference",       value: wire.reference,     copyable: true  },
              ].map((row) => (
                <div key={row.label}
                  className="flex items-center justify-between rounded-xl
                             bg-[#0E2018] border border-[#0D9E8A]/[0.10] px-4 py-3"
                >
                  <div>
                    <p className="text-[10px] text-[#5A6B82] uppercase tracking-wider font-semibold">{row.label}</p>
                    <p className="text-sm font-bold text-[#F0F1F5] font-mono mt-0.5">{row.value}</p>
                  </div>
                  {row.copyable && (
                    <button
                      type="button"
                      onClick={() => copyField(row.value, row.label)}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5 text-[#5A6B82] hover:text-[#C9A84C]" />
                    </button>
                  )}
                </div>
              ))}

              {/* Memo warning */}
              <div className="flex items-start gap-2 rounded-xl bg-[#C9A84C]/5 border border-[#C9A84C]/15 px-3 py-2.5">
                <Info className="h-3.5 w-3.5 text-[#C9A84C] shrink-0 mt-0.5" />
                <p className="text-[10px] text-[#7A8394] leading-relaxed">
                  <span className="font-bold text-[#C9A84C]">Important:</span> Include the Reference{" "}
                  <span className="font-mono font-bold text-[#F0F1F5]">{wire.reference}</span> in your wire memo.
                  Without it, processing will be delayed.
                </p>
              </div>

              {/* ETA */}
              <div className="flex items-center gap-2 text-xs text-[#5A6B82]">
                <Clock className="h-3.5 w-3.5 text-[#C9A84C]" />
                <span>Funds credited within <strong className="text-[#B8BCC8]">1-3 business days</strong> after receipt</span>
              </div>

              {/* Notify button */}
              <motion.button
                type="button"
                onClick={handleNotify}
                disabled={!numAmt || numAmt < 10 || submitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full h-12 rounded-2xl font-bold text-sm text-[#050F0C]
                           disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)",
                }}
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  : <><Send className="h-4 w-4" /> I&apos;ve Sent {numAmt > 0 ? fmtUSD(numAmt) : "the Wire"}</>
                }
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Coming Soon modal ────────────────────────────────────────────────────────

function ComingSoonModal({ method, onClose }: { method: MethodConfig; onClose: () => void }) {
  const Icon = method.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(6,9,18,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm rounded-3xl p-6 space-y-4"
        style={{ background: "#0B1A16", border: "1px solid rgba(13,158,138,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `${method.iconColor}18`, border: `1px solid ${method.iconColor}25` }}
          >
            <Icon className="h-8 w-8" style={{ color: method.iconColor }} />
          </div>
          <div>
            <p className="text-base font-bold text-[#F0F1F5]">{method.label} — Coming Soon</p>
            <p className="text-sm text-[#5A6B82] mt-1">
              We&apos;re integrating {method.label} for seamless international funding.
              You&apos;ll be notified when it&apos;s available.
            </p>
          </div>
          <div className="w-full rounded-xl bg-[#0E2018] border border-[#0D9E8A]/[0.10] p-3 flex items-center gap-3">
            <Clock className="h-4 w-4 text-[#C9A84C] shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold text-[#F0F1F5]">When available</p>
              <p className="text-[10px] text-[#5A6B82]">ETA: {method.eta} • {method.fee}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl font-bold text-sm text-[#050F0C]"
            style={{ background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)" }}
          >
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WalletFundPage() {
  const router = useRouter();

  const [profile,    setProfile]    = useState<UserProfile | null>(null);
  const [usdBalance, setUsdBalance] = useState<number | null>(null);
  const [htgBalance, setHtgBalance] = useState<number | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [active,     setActive]     = useState<FundMethod | null>(null);
  const [comingSoon, setComingSoon] = useState<MethodConfig | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [me, bal] = await Promise.allSettled([
          kkGet<UserProfile>("v1/users/me"),
          kkGet<BalanceResponse>("v1/wallets/balance"),
        ]);
        if (me.status === "fulfilled") setProfile(me.value);
        if (bal.status === "fulfilled") {
          const b = bal.value;
          const htg = b.availableBalance
            ?? b.balances?.find((w) => w.currency === "HTG")?.balance
            ?? b.totalBalance
            ?? 0;
          const usd = b.balances?.find((w) => w.currency === "USD")?.balance ?? null;
          setHtgBalance(htg);
          setUsdBalance(usd);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      {/* Wire modal */}
      <AnimatePresence>
        {active === "bank_wire" && profile?.walletId && (
          <WireDetailsPanel
            walletId={profile.walletId}
            onClose={() => setActive(null)}
          />
        )}
      </AnimatePresence>

      {/* Coming soon modal */}
      <AnimatePresence>
        {comingSoon && (
          <ComingSoonModal method={comingSoon} onClose={() => setComingSoon(null)} />
        )}
      </AnimatePresence>

      <div className="space-y-5 pb-10 max-w-md mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-[#0E2018] hover:bg-[#122B22] text-[#6A8A7A] hover:text-[#E0E4EE] transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#F0F1F5]">Fund My Wallet</h1>
            <p className="text-xs text-[#5A6B82]">Add money from abroad</p>
          </div>
        </div>

        {/* ── Balance card ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border border-[#8B5CF6]/[0.15]"
          style={{ background: "linear-gradient(135deg, #09071D 0%, #120F2E 50%, #09071D 100%)" }}
        >
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-[#8B5CF6]" />
              <span className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider">Diaspora Wallet</span>
            </div>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 w-40 rounded-lg bg-white/5 animate-pulse" />
                <div className="h-4 w-24 rounded-lg bg-white/5 animate-pulse" />
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-white">
                    {htgBalance !== null ? fmtHTG(htgBalance) : "—"}
                  </span>
                  <span className="text-base font-bold text-[#C9A84C] mb-0.5">HTG</span>
                </div>
                {usdBalance !== null && (
                  <p className="text-xs text-[#7A8394] mt-1">
                    {fmtUSD(usdBalance)} USD available
                  </p>
                )}
              </>
            )}
          </div>
          <div className="flex border-t border-[#8B5CF6]/[0.10]">
            <button
              type="button"
              onClick={() => router.push("/send")}
              className="flex-1 flex items-center justify-center gap-2 py-3
                         text-xs font-bold text-[#8B5CF6] hover:bg-[#8B5CF6]/[0.06] transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Send to Family
            </button>
            <div className="w-px bg-[#8B5CF6]/[0.10]" />
            <button
              type="button"
              onClick={() => router.push("/wallet")}
              className="flex-1 flex items-center justify-center gap-2 py-3
                         text-xs font-bold text-[#5A6B82] hover:bg-white/[0.03] transition-colors"
            >
              <Wallet className="h-3.5 w-3.5" />
              View Wallet
            </button>
          </div>
        </motion.div>

        {/* ── Section label ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-1">
          <CreditCard className="h-4 w-4 text-[#C9A84C]" />
          <h2 className="text-sm font-bold text-[#E0E4EE]">Choose Funding Method</h2>
        </div>

        {/* ── Method cards ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {METHODS.map((method, i) => {
            const Icon = method.icon;
            return (
              <motion.button
                key={method.key}
                type="button"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  if (method.available) {
                    setActive(method.key);
                  } else {
                    setComingSoon(method);
                  }
                }}
                className={`w-full rounded-2xl border bg-gradient-to-br ${method.gradient} ${method.border}
                             p-4 flex items-center gap-4 text-left transition-all group relative`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${method.iconColor}15`, border: `1px solid ${method.iconColor}20` }}
                >
                  <Icon className="h-6 w-6" style={{ color: method.iconColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#F0F1F5]">{method.label}</span>
                    {method.available ? (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        Available
                      </span>
                    ) : (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#3A4558]/30 text-[#5A6B82]">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5A6B82] mt-0.5">{method.desc}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-[#4A5A72] flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />{method.eta}
                    </span>
                    <span className="text-[10px] text-[#4A5A72]">{method.fee}</span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-[#3A4558] group-hover:text-[#7A8394] transition-colors shrink-0" />
              </motion.button>
            );
          })}
        </div>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-[#0B1A16] border border-[#0D9E8A]/[0.10] p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#C9A84C]" />
            <h3 className="text-sm font-bold text-[#E0E4EE]">How Diaspora Funding Works</h3>
          </div>
          {[
            { n: 1, text: "Send money from your bank, PayPal, or Apple Pay abroad" },
            { n: 2, text: "Funds are converted to HTG at the live exchange rate" },
            { n: 3, text: "Your KobKlein wallet is credited — use it or send to family in Haiti" },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/25
                              flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-[#8B5CF6]">{step.n}</span>
              </div>
              <p className="text-xs text-[#B0BBCC] leading-relaxed">{step.text}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Security note ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-2xl bg-[#0B1A16]/60 border border-white/[0.05] p-4">
          <ShieldCheck className="h-4 w-4 text-[#8B5CF6] shrink-0 mt-0.5" />
          <p className="text-xs text-[#5A6B82] leading-relaxed">
            KobKlein uses bank-grade encryption for all fund transfers. Exchange rates are
            updated every 15 minutes. For wire transfers, always include your reference code.
          </p>
        </div>

        {/* ── Quick action: send to family ──────────────────────────────── */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => router.push("/send")}
          className="w-full flex items-center justify-between rounded-2xl px-5 py-4
                     border border-[#8B5CF6]/[0.15] transition-all group"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.03))" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20
                            flex items-center justify-center">
              <Send className="h-4 w-4 text-[#8B5CF6]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[#F0F1F5]">Send to Family in Haiti</p>
              <p className="text-xs text-[#5A6B82]">Transfer from your wallet to any KobKlein user</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[#4A5A72] group-hover:text-[#8B5CF6] transition-colors" />
        </motion.button>

      </div>
    </>
  );
}
