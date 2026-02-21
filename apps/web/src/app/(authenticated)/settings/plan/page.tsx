"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { kkGet } from "@/lib/kobklein-api";
import {
  ArrowLeft, CheckCircle2, Lock, ShieldCheck, Zap, CreditCard,
  Globe, Users, ArrowUpRight, Star,
} from "lucide-react";

type UserProfile = {
  role: string;
  kycTier: number;
  kycStatus: string;
  firstName: string | null;
};

// ─── Features always free for clients ─────────────────────────────────────────
const FREE_FEATURES = [
  { icon: Zap,          label: "Send & receive money instantly" },
  { icon: Users,        label: "Link family members (K-Link)" },
  { icon: Globe,        label: "Pay merchants via QR code" },
  { icon: CheckCircle2, label: "Full transaction history" },
  { icon: Star,         label: "KobKlein K-ID & personal handle" },
];

// ─── Features unlocked after free identity verification ───────────────────────
const VERIFIED_FEATURES = [
  { icon: CreditCard,  label: "Virtual Visa card (Netflix, Amazon & more)" },
  { icon: Globe,       label: "Higher transfer limits" },
  { icon: ShieldCheck, label: "Advanced security features" },
  { icon: Zap,         label: "Faster withdrawals & settlements" },
  { icon: Star,        label: "Priority customer support" },
];

export default function PlanPage() {
  const router  = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    kkGet<UserProfile>("v1/users/me")
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isClient   = !profile || profile.role === "client" || profile.role === "user";
  const isVerified = (profile?.kycTier ?? 0) >= 2;
  const isPending  = profile?.kycStatus === "submitted" || profile?.kycStatus === "pending";

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div
          className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "#C9A84C" }}
        />
      </div>
    );
  }

  // ── Non-client roles: simple info ─────────────────────────────────────────
  if (!isClient) {
    return (
      <div className="max-w-lg mx-auto flex flex-col gap-6 p-4 md:p-0">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-[#162038] hover:bg-[#1A2640] text-[#7A8394] hover:text-[#E0E4EE] transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#F0F1F5]">Account Access</h1>
            <p className="text-xs text-[#5A6B82] mt-0.5">Your current access level</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl bg-[#0E1829] border border-white/[0.06] p-6 text-center flex flex-col items-center gap-3"
        >
          <ShieldCheck className="h-10 w-10 text-[#0D9E8A]" />
          <p className="text-base font-bold text-[#F0F1F5]">Business accounts are managed separately</p>
          <p className="text-sm text-[#5A6B82] leading-relaxed">
            Your {profile?.role} account features are managed by the KobKlein team. Contact support for access changes.
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Client view — free forever, no billing ────────────────────────────────
  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 p-4 md:p-0 pb-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-[#162038] hover:bg-[#1A2640] text-[#7A8394] hover:text-[#E0E4EE] transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#F0F1F5]">Your Access</h1>
          <p className="text-xs text-[#5A6B82] mt-0.5">KobKlein is completely free for clients</p>
        </div>
      </motion.div>

      {/* Current status card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: isVerified
            ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))"
            : isPending
              ? "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(245,158,11,0.03))"
              : "linear-gradient(135deg, rgba(13,158,138,0.10), rgba(13,158,138,0.03))",
          border: `1px solid ${
            isVerified ? "rgba(16,185,129,0.25)"
            : isPending ? "rgba(245,158,11,0.20)"
            : "rgba(13,158,138,0.15)"
          }`,
        }}
      >
        <div className="p-5 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: isVerified
                ? "rgba(16,185,129,0.15)"
                : isPending ? "rgba(245,158,11,0.12)"
                : "rgba(13,158,138,0.12)",
            }}
          >
            {isVerified
              ? <CheckCircle2 className="h-7 w-7 text-[#10B981]" />
              : isPending
                ? <ShieldCheck className="h-7 w-7 text-amber-400" />
                : <Lock className="h-7 w-7 text-[#0D9E8A]" />}
          </div>
          <div className="flex-1">
            <p
              className="text-base font-black"
              style={{ color: isVerified ? "#10B981" : isPending ? "#FBBF24" : "#F0F1F5" }}
            >
              {isVerified ? "Fully Verified" : isPending ? "Verification Pending" : "Free Access"}
            </p>
            <p className="text-xs text-[#5A6B82] mt-1 leading-relaxed">
              {isVerified
                ? "You have full access to all KobKlein features including virtual cards."
                : isPending
                  ? "Your identity verification is being reviewed. Usually takes 1–2 business days."
                  : "Core features are always free. Verify your identity to unlock everything else."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Always-free features */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl bg-[#0E1829] border border-[#0D9E8A]/[0.12] overflow-hidden"
      >
        <div className="h-0.5 bg-gradient-to-r from-[#0D9E8A]/60 via-[#0D9E8A]/20 to-transparent" />
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0D9E8A]/10 border border-[#0D9E8A]/15 flex items-center justify-center">
              <Zap className="h-4 w-4 text-[#0D9E8A]" />
            </div>
            <div>
              <p className="text-sm font-black text-[#F0F1F5]">Always Free</p>
              <p className="text-[10px] text-[#3A4558]">No subscription, no hidden fees — ever</p>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {FREE_FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.10 + i * 0.04 }}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-[#0D9E8A]/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-3.5 w-3.5 text-[#0D9E8A]" />
                </div>
                <p className="text-sm text-[#B8BCC8] flex-1">{f.label}</p>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0D9E8A] shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Verification-unlocked features */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#0E1829",
          border: isVerified ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {isVerified && (
          <div className="h-0.5 bg-gradient-to-r from-[#10B981]/60 via-[#10B981]/20 to-transparent" />
        )}
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: isVerified ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)" }}
            >
              <ShieldCheck className={`h-4 w-4 ${isVerified ? "text-[#10B981]" : "text-[#3A4558]"}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-[#F0F1F5]">
                {isVerified ? "Full Access Unlocked ✓" : "Unlock with Free Verification"}
              </p>
              <p className="text-[10px] text-[#3A4558]">
                {isVerified ? "All features active" : "Quick identity check — completely free"}
              </p>
            </div>
            {!isVerified && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#0D9E8A]/10 text-[#0D9E8A] border border-[#0D9E8A]/20 shrink-0">
                FREE
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {VERIFIED_FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isVerified ? "rgba(16,185,129,0.10)" : "rgba(255,255,255,0.04)" }}
                >
                  <f.icon className={`h-3.5 w-3.5 ${isVerified ? "text-[#10B981]" : "text-[#2A3448]"}`} />
                </div>
                <p className={`text-sm flex-1 ${isVerified ? "text-[#B8BCC8]" : "text-[#3A4558]"}`}>{f.label}</p>
                {isVerified
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                  : <Lock className="h-3 w-3 text-[#2A3448] shrink-0" />}
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          {!isVerified && !isPending && (
            <motion.button
              onClick={() => router.push("/kyc")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: "linear-gradient(135deg, #0D9E8A, #0A8A78)",
                color: "#F0F1F5",
                boxShadow: "0 6px 20px -6px rgba(13,158,138,0.50)",
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              Start Free Verification
              <ArrowUpRight className="h-4 w-4" />
            </motion.button>
          )}

          {isPending && (
            <div
              className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.15)",
                color: "#FBBF24",
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              Verification under review…
            </div>
          )}
        </div>
      </motion.div>

      {/* Why free note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22 }}
        className="rounded-2xl bg-[#0A1422] border border-white/[0.04] p-5 flex flex-col gap-3"
      >
        <p className="text-[10px] font-black text-[#3A4558] uppercase tracking-widest">Why KobKlein is free for clients</p>
        {[
          "Clients are the heart of KobKlein — we never charge you to use your own money",
          "No subscription fees, no monthly plans, no hidden costs",
          "Verification is free and unlocks the full platform",
          "Revenue comes from merchants and businesses, not from you",
        ].map((text) => (
          <div key={text} className="flex items-start gap-2.5 text-xs text-[#4A5A72] leading-relaxed">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#0D9E8A]/60 shrink-0 mt-0.5" />
            {text}
          </div>
        ))}
      </motion.div>

    </div>
  );
}
