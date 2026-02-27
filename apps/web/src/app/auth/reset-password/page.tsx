"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserSupabase } from "@/lib/supabase";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

const INPUT_CLASS =
  "w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#F0F1F5] text-sm placeholder:text-[#7A8394]/60 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C]/40 focus:bg-white/[0.05] transition-all duration-300";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060D1F] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword]           = useState("");
  const [confirm, setConfirm]             = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [exchanging, setExchanging]       = useState(true);
  const [error, setError]                 = useState("");
  const [done, setDone]                   = useState(false);

  /* Exchange the one-time code from the email link for a session */
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Invalid or missing reset link. Please request a new one.");
      setExchanging(false);
      return;
    }

    const supabase = createBrowserSupabase();
    supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
      if (err) {
        setError(
          "This reset link has expired or already been used. Please request a new one.",
        );
      }
      setExchanging(false);
    });
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabase();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    /* Sign out so the user logs in fresh with the new password */
    await supabase.auth.signOut();
    setDone(true);
    setTimeout(() => router.push("/login?notice=password_reset"), 2500);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060D1F] px-4">
      {/* Background orbs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-[#C9A84C]/[0.04] rounded-full blur-[130px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] bg-[#1F6F4A]/[0.04] rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image
              src="/images/kobklein-logo.png"
              alt="KobKlein"
              width={80}
              height={80}
              className="h-14 w-auto hover:scale-105 transition-transform duration-300"
              priority
            />
          </Link>
        </div>

        {/* Card */}
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-[#C9A84C]/20 via-white/[0.06] to-[#C9A84C]/10" />
          <div className="relative rounded-3xl bg-[#111A30]/80 backdrop-blur-2xl p-8 sm:p-10">
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />

            {/* ── Success state ── */}
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center py-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#1F6F4A]/15 border border-[#1F6F4A]/30 flex items-center justify-center mb-5">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-[#F0F1F5] mb-2">
                    Password Updated
                  </h2>
                  <p className="text-sm text-[#7A8394] mb-4">
                    Your new password has been saved. Redirecting you to sign in…
                  </p>
                  <div className="w-5 h-5 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
                </motion.div>
              ) : exchanging ? (
                /* ── Exchanging code ── */
                <motion.div
                  key="exchanging"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center text-center py-8"
                >
                  <Loader2 className="h-8 w-8 text-[#C9A84C] animate-spin mb-4" />
                  <p className="text-sm text-[#7A8394]">Verifying your reset link…</p>
                </motion.div>
              ) : error && !password ? (
                /* ── Invalid / expired link ── */
                <motion.div
                  key="invalid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center py-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold font-serif text-[#F0F1F5] mb-2">
                    Link Expired
                  </h2>
                  <p className="text-sm text-[#7A8394] mb-6">{error}</p>
                  <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#A07E2E] text-[#060D1F] text-sm font-bold transition-colors"
                  >
                    Request New Link
                  </Link>
                </motion.div>
              ) : (
                /* ── New password form ── */
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Heading */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border border-[#C9A84C]/20 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-[#C9A84C]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold font-serif text-[#F0F1F5]">
                        Set New Password
                      </h2>
                      <p className="text-sm text-[#7A8394]">
                        Choose a strong password for your account
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}

                    {/* New password */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-[#B8BCC8] tracking-wide">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          className={`${INPUT_CLASS} pr-11`}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#7A8394] hover:text-[#B8BCC8] hover:bg-white/[0.05] transition-all"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-[#B8BCC8] tracking-wide">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          required
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          placeholder="Repeat your new password"
                          className={`${INPUT_CLASS} pr-11`}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#7A8394] hover:text-[#B8BCC8] hover:bg-white/[0.05] transition-all"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Strength hint */}
                    {password.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                              password.length >= level * 3
                                ? password.length >= 12
                                  ? "bg-[#1F6F4A]"
                                  : "bg-[#C9A84C]"
                                : "bg-white/[0.08]"
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-[#7A8394] ml-1">
                          {password.length < 8 ? "Too short" : password.length < 12 ? "Good" : "Strong"}
                        </span>
                      </div>
                    )}

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-[#060D1F] font-bold text-sm tracking-wide overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E]" />
                      <span className="absolute inset-0 bg-gradient-to-r from-[#E2CA6E] via-[#F0DC82] to-[#C9A84C] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="relative flex items-center gap-2">
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-[#060D1F]/30 border-t-[#060D1F] rounded-full animate-spin" />
                        ) : (
                          <>
                            <Lock className="h-4 w-4" />
                            Update Password
                          </>
                        )}
                      </span>
                    </motion.button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-xs text-[#7A8394] hover:text-[#B8BCC8] transition-colors"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Back to Sign In
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
