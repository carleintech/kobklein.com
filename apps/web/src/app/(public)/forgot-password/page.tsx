"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserSupabase } from "@/lib/supabase";
import { ArrowLeft, Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const INPUT_CLASS =
  "w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#F0F1F5] text-sm placeholder:text-[#7A8394]/60 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C]/40 focus:bg-white/[0.05] transition-all duration-300";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createBrowserSupabase();
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (sbError) throw sbError;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
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
            "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(201,168,76,0.04) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-3xl p-8 border relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />

          <AnimatePresence mode="wait">
            {sent ? (
              /* ── Success state ── */
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-5 py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </motion.div>

                <div>
                  <h2 className="text-xl font-black text-[#F0F1F5]">Check your email</h2>
                  <p className="text-sm text-[#7A8394] mt-2 leading-relaxed">
                    We sent a password reset link to{" "}
                    <span className="text-[#C9A84C] font-medium">{email}</span>.
                    Check your inbox and follow the instructions.
                  </p>
                </div>

                <div className="w-full rounded-xl bg-[#0A1422] border border-white/[0.05] p-4">
                  <p className="text-xs text-[#5A6B82] leading-relaxed">
                    Didn't receive it? Check your spam folder or{" "}
                    <button
                      onClick={() => setSent(false)}
                      className="text-[#C9A84C] hover:text-[#E2CA6E] underline underline-offset-2 transition-colors"
                    >
                      try a different email
                    </button>
                    .
                  </p>
                </div>

                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm
                             bg-white/[0.04] border border-white/[0.08] text-[#B8BCC8]
                             hover:bg-white/[0.07] hover:text-[#F0F1F5] transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </motion.div>
            ) : (
              /* ── Form state ── */
              <motion.div key="form" className="space-y-6">
                {/* Back link */}
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-[#5A6B82] hover:text-[#C9A84C] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>

                {/* Header */}
                <div>
                  <div
                    className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
                      border: "1px solid rgba(201,168,76,0.2)",
                    }}
                  >
                    <Mail className="h-6 w-6 text-[#C9A84C]" />
                  </div>
                  <h1 className="text-2xl font-black text-[#F0F1F5]">Forgot password?</h1>
                  <p className="text-sm text-[#7A8394] mt-1 leading-relaxed">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 p-3.5 rounded-xl"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-300">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#7A8394] mb-1.5 uppercase tracking-wider">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      className={INPUT_CLASS}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || !email.trim()}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl
                               font-bold text-base text-[#060D1F] transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #E2CA6E 0%, #C9A84C 50%, #9F7F2C 100%)",
                      boxShadow: email.trim() ? "0 8px 32px -8px rgba(201,168,76,0.5)" : "none",
                    }}
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                      <>Send reset link</>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
