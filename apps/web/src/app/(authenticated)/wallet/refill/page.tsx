"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Banknote, ChevronRight, Copy, CheckCircle2,
  MapPin, Phone, QrCode, Info, Loader2, Zap,
  ArrowDownLeft, Shield,
} from "lucide-react";
import { kkGet } from "@/lib/kobklein-api";
import { useToast } from "@kobklein/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserProfile = {
  phone?: string;
  firstName?: string;
  lastName?: string;
  walletId?: string;
};

type DistributorNearby = {
  id: string;
  businessName: string;
  city?: string;
  phone?: string;
  commissionIn: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHTG(n: number) {
  return n.toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Minimal inline QR via a public API (no library dependency needed)
function QrCodeImage({ value, size = 180 }: { value: string; size?: number }) {
  const encoded = encodeURIComponent(value);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=svg&bgcolor=0B1A16&color=C9A84C&margin=4`}
      alt="KobKlein Refill QR"
      width={size}
      height={size}
      className="rounded-xl"
    />
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30
                      flex items-center justify-center shrink-0">
        <span className="text-[11px] font-black text-[#C9A84C]">{n}</span>
      </div>
      <span className="text-sm text-[#B0BBCC]">{label}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WalletRefillPage() {
  const router = useRouter();
  const toast  = useToast();

  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [distributors, setDistributors] = useState<DistributorNearby[]>([]);
  const [amount,       setAmount]       = useState("");
  const [loading,      setLoading]      = useState(true);
  const [copiedPhone,  setCopiedPhone]  = useState(false);
  const [showQr,       setShowQr]       = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [me, agents] = await Promise.allSettled([
          kkGet<UserProfile>("v1/users/me"),
          kkGet<DistributorNearby[]>("v1/distributor/nearby"),
        ]);
        if (me.status === "fulfilled") setProfile(me.value);
        if (agents.status === "fulfilled") setDistributors(agents.value ?? []);
      } catch {
        // silent — profile may be null
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const phone    = profile?.phone ?? "";
  const numAmt   = parseFloat(amount) || 0;
  const qrPayload = phone
    ? `kobklein://refill?phone=${encodeURIComponent(phone)}${numAmt > 0 ? `&amount=${numAmt}` : ""}`
    : "";

  function copyPhone() {
    if (!phone) return;
    navigator.clipboard.writeText(phone).catch(() => {});
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
    toast.show("Phone number copied", "success");
  }

  return (
    <div className="space-y-5 pb-10 max-w-md mx-auto">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-[#0E2018] hover:bg-[#122B22] text-[#6A8A7A] hover:text-[#E0E4EE] transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#F0F1F5]">Refill Wallet</h1>
          <p className="text-xs text-[#5A6B82]">Get cash-in via a K-Agent</p>
        </div>
      </div>

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden border border-[#0D9E8A]/[0.15]"
        style={{ background: "linear-gradient(135deg, #062820 0%, #0A3028 50%, #071A14 100%)" }}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                            flex items-center justify-center">
              <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#F0F1F5]">Cash-In via K-Agent</p>
              <p className="text-xs text-[#5A6B82]">
                Hand cash to a nearby KobKlein distributor
              </p>
            </div>
          </div>

          {/* How it works steps */}
          <div className="space-y-3">
            <StepBadge n={1} label="Tell the agent how much you want to add" />
            <StepBadge n={2} label="Show them your phone number or QR code below" />
            <StepBadge n={3} label="Hand over the cash — your wallet updates instantly" />
          </div>
        </div>

        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 rounded-xl bg-[#0E2018]/80 border border-[#C9A84C]/[0.10] px-3 py-2">
            <Info className="h-3.5 w-3.5 text-[#C9A84C] shrink-0" />
            <p className="text-[10px] text-[#7A8394]">
              Agents may charge a small commission. No charge from KobKlein for cash-in.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Amount (optional, for agent reference) ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl bg-[#0B1A16] border border-[#0D9E8A]/[0.12] p-5 space-y-3"
      >
        <label className="text-xs font-bold text-[#5A6B82] uppercase tracking-wider">
          Amount to Refill (optional)
        </label>
        <div
          className="relative rounded-xl border-2 transition-all"
          style={{
            borderColor: numAmt > 0 ? "#C9A84C" : "rgba(13,158,138,0.15)",
            boxShadow: numAmt > 0 ? "0 0 20px -4px rgba(201,168,76,0.15)" : "none",
          }}
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6B82] text-sm font-bold">G</div>
          <input
            ref={amountRef}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="1"
            className="w-full bg-transparent text-right pr-4 pl-8 py-4 text-2xl font-black
                       text-[#F0F1F5] placeholder-[#2A3448] outline-none"
          />
        </div>
        {numAmt > 0 && (
          <p className="text-xs text-[#5A6B82]">
            Communicate <span className="text-[#C9A84C] font-bold">{fmtHTG(numAmt)} HTG</span> to the agent
          </p>
        )}
      </motion.div>

      {/* ── Phone number ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-[#0B1A16] border border-[#0D9E8A]/[0.12] p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#C9A84C]" />
            <span className="text-xs font-bold text-[#5A6B82] uppercase tracking-wider">
              Your Phone Number
            </span>
          </div>
          <span className="text-[9px] text-[#4A5A72] bg-[#122B22] px-2 py-0.5 rounded-full border border-[#0D9E8A]/[0.10]">
            Show to agent
          </span>
        </div>

        {loading ? (
          <div className="h-14 rounded-xl bg-[#122B22] animate-pulse" />
        ) : phone ? (
          <button
            onClick={copyPhone}
            className="w-full flex items-center justify-between rounded-xl
                       bg-[#0E2018] border border-[#0D9E8A]/[0.15]
                       hover:border-[#C9A84C]/[0.20] px-4 py-4 transition-all group"
          >
            <span className="text-2xl font-black tracking-widest text-[#F0F1F5] font-mono">
              {phone}
            </span>
            {copiedPhone ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <Copy className="h-5 w-5 text-[#4A5A72] group-hover:text-[#C9A84C] shrink-0 transition-colors" />
            )}
          </button>
        ) : (
          <div className="rounded-xl bg-[#0E2018] border border-[#0D9E8A]/[0.10] px-4 py-4">
            <p className="text-sm text-[#5A6B82]">No phone number on file. Add one in Settings.</p>
          </div>
        )}
      </motion.div>

      {/* ── QR Code toggle ───────────────────────────────────────────────── */}
      {phone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-[#0B1A16] border border-[#0D9E8A]/[0.12] overflow-hidden"
        >
          <button
            onClick={() => setShowQr((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#0E2018] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20
                              flex items-center justify-center">
                <QrCode className="h-4 w-4 text-[#C9A84C]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[#F0F1F5]">Show QR Code</p>
                <p className="text-xs text-[#5A6B82]">Agent scans to confirm your identity</p>
              </div>
            </div>
            <ChevronRight
              className={`h-4 w-4 text-[#4A5A72] transition-transform duration-200 ${showQr ? "rotate-90" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showQr && qrPayload && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col items-center gap-3 px-5 pb-6 pt-2 border-t border-[#0D9E8A]/[0.08]">
                  <div className="rounded-2xl overflow-hidden p-3 bg-[#0E2018] border border-[#C9A84C]/[0.15]
                                  shadow-[0_0_40px_-8px_rgba(201,168,76,0.2)]">
                    <QrCodeImage value={qrPayload} size={200} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-[#F0F1F5]">
                      {numAmt > 0 ? `${fmtHTG(numAmt)} HTG Refill` : "Scan to refill wallet"}
                    </p>
                    <p className="text-[10px] text-[#5A6B82]">
                      Valid for this session only
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Nearby distributors ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 px-1">
          <MapPin className="h-4 w-4 text-[#C9A84C]" />
          <h2 className="text-sm font-bold text-[#E0E4EE]">K-Agents Near You</h2>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#0B1A16] animate-pulse" />
            ))}
          </div>
        ) : distributors.length === 0 ? (
          <div className="rounded-2xl bg-[#0B1A16] border border-[#0D9E8A]/[0.10] p-5 text-center">
            <MapPin className="h-8 w-8 text-[#3A4558] mx-auto mb-2" />
            <p className="text-sm text-[#5A6B82]">No agents found nearby</p>
            <p className="text-xs text-[#4A5A72] mt-1">
              All KobKlein agents can process your refill
            </p>
          </div>
        ) : (
          distributors.slice(0, 5).map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="rounded-2xl bg-[#0B1A16] border border-[#0D9E8A]/[0.10]
                         hover:border-[#0D9E8A]/[0.20] p-4 flex items-center gap-3 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0E2018] border border-[#0D9E8A]/[0.10]
                              flex items-center justify-center shrink-0">
                <Banknote className="h-5 w-5 text-[#0D9E8A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#E0E4EE] truncate">{d.businessName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {d.city && (
                    <span className="text-[10px] text-[#5A6B82] flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {d.city}
                    </span>
                  )}
                  {d.commissionIn > 0 && (
                    <span className="text-[10px] text-[#7A8394]">
                      {(d.commissionIn * 100).toFixed(1)}% commission
                    </span>
                  )}
                </div>
              </div>
              {d.phone && (
                <a
                  href={`tel:${d.phone}`}
                  className="p-2 rounded-lg bg-[#0E2018] hover:bg-[#122B22] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-3.5 w-3.5 text-[#5A6B82]" />
                </a>
              )}
            </motion.div>
          ))
        )}
      </motion.div>

      {/* ── Security note ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-2xl bg-[#0B1A16]/60 border border-white/[0.05] p-4">
        <Shield className="h-4 w-4 text-[#0D9E8A] shrink-0 mt-0.5" />
        <p className="text-xs text-[#5A6B82] leading-relaxed">
          K-Agents are verified KobKlein distributors. Your wallet is credited instantly once the agent
          processes the transaction. Only give cash after confirming the agent&apos;s identity.
        </p>
      </div>

      {/* ── Back to wallet ───────────────────────────────────────────────── */}
      <button
        onClick={() => router.push("/wallet")}
        className="w-full h-12 rounded-2xl font-bold text-sm text-[#050F0C]
                   flex items-center justify-center gap-2 transition-all"
        style={{ background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)" }}
      >
        <Zap className="h-4 w-4" />
        Back to Wallet
      </button>

    </div>
  );
}
