"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createBrowserSupabase } from "@/lib/supabase";
import { USER_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type UserRole } from "@/lib/types/roles";
import { Users, Globe, ShoppingBag, Briefcase, ChevronRight, Loader2, AlertCircle } from "lucide-react";

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  client: Users,
  diaspora: Globe,
  merchant: ShoppingBag,
  distributor: Briefcase,
};

const ROLE_COLORS: Record<UserRole, { icon: string; border: string; bg: string; glow: string }> = {
  client:      { icon: "#0D9E8A", border: "rgba(13,158,138,0.3)",  bg: "rgba(13,158,138,0.08)",  glow: "rgba(13,158,138,0.15)"  },
  diaspora:    { icon: "#C9A84C", border: "rgba(201,168,76,0.3)",  bg: "rgba(201,168,76,0.08)",  glow: "rgba(201,168,76,0.15)"  },
  merchant:    { icon: "#8B5CF6", border: "rgba(139,92,246,0.3)",  bg: "rgba(139,92,246,0.08)",  glow: "rgba(139,92,246,0.15)"  },
  distributor: { icon: "#F97316", border: "rgba(249,115,22,0.3)",  bg: "rgba(249,115,22,0.08)",  glow: "rgba(249,115,22,0.15)"  },
};

export default function ChooseRolePage() {
  const router = useRouter();
  const [selected, setSelected]   = useState<UserRole | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createBrowserSupabase();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: selected },
      });
      if (updateError) throw updateError;
      router.push(`/onboarding/${selected}`);
    } catch (err: any) {
      setError(err.message || "Failed to save your role. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg, #060D1F 0%, #080F1A 50%, #050A15 100%)" }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(13,158,138,0.04) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(13,158,138,0.2), rgba(13,158,138,0.05))",
              border: "1px solid rgba(13,158,138,0.25)",
            }}
          >
            <Users className="h-8 w-8 text-[#0D9E8A]" />
          </div>
          <h1 className="text-3xl font-black text-[#F0F1F5] mb-2">How will you use KobKlein?</h1>
          <p className="text-sm text-[#7A8394] max-w-sm mx-auto leading-relaxed">
            Choose the account type that best fits your needs. You can always contact support to change it later.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {USER_ROLES.map((role, i) => {
            const Icon = ROLE_ICONS[role];
            const colors = ROLE_COLORS[role];
            const isSelected = selected === role;

            return (
              <motion.button
                key={role}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(role)}
                className="relative rounded-2xl p-5 text-left transition-all duration-200 overflow-hidden"
                style={{
                  background: isSelected ? colors.bg : "rgba(255,255,255,0.02)",
                  border: `1.5px solid ${isSelected ? colors.border : "rgba(255,255,255,0.06)"}`,
                  boxShadow: isSelected ? `0 0 24px -4px ${colors.glow}` : "none",
                }}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: colors.icon }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}

                <div
                  className="w-11 h-11 rounded-xl mb-3 flex items-center justify-center"
                  style={{ background: `${colors.icon}18`, border: `1px solid ${colors.border}` }}
                >
                  <Icon className="h-5 w-5" style={{ color: colors.icon }} />
                </div>

                <p className="text-base font-bold text-[#F0F1F5] mb-1">{ROLE_LABELS[role].en}</p>
                <p className="text-xs text-[#5A6B82] leading-relaxed">{ROLE_DESCRIPTIONS[role].en}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Continue button */}
        <motion.button
          onClick={handleContinue}
          disabled={!selected || loading}
          whileHover={{ scale: selected ? 1.01 : 1 }}
          whileTap={{ scale: selected ? 0.99 : 1 }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                     font-bold text-base text-[#060D1F] transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: selected
              ? "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)"
              : "rgba(201,168,76,0.3)",
            boxShadow: selected ? "0 8px 32px -8px rgba(201,168,76,0.5)" : "none",
          }}
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Setting up your account…</>
          ) : (
            <>Continue <ChevronRight className="h-5 w-5" /></>
          )}
        </motion.button>

        <p className="text-center text-xs text-[#3A4558] mt-4">
          By continuing you agree to the KobKlein Terms of Service
        </p>
      </motion.div>
    </div>
  );
}
