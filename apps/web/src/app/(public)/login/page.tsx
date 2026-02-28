"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  DollarSign,
  Eye,
  EyeOff,
  Fingerprint,
  Gem,
  Globe,
  Lock,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";

/* ── Deterministic floating particles ── */
const PARTICLES = [
  { size: 3, x: 12, y: 20, opacity: 0.15, delay: 0, dur: 4.5 },
  { size: 2.5, x: 85, y: 15, opacity: 0.2, delay: 1.2, dur: 5.2 },
  { size: 4, x: 45, y: 80, opacity: 0.12, delay: 2.5, dur: 3.8 },
  { size: 2, x: 70, y: 55, opacity: 0.18, delay: 0.8, dur: 6 },
  { size: 3.5, x: 25, y: 65, opacity: 0.14, delay: 3, dur: 4.2 },
  { size: 2.8, x: 90, y: 75, opacity: 0.16, delay: 1.5, dur: 5.5 },
  { size: 3.2, x: 55, y: 10, opacity: 0.22, delay: 0.3, dur: 4.8 },
  { size: 2.3, x: 8, y: 90, opacity: 0.13, delay: 2.1, dur: 5.8 },
];

const FEATURES = [
  { icon: Shield, label: "Military-grade security" },
  { icon: Zap,    label: "Instant transfers" },
  { icon: Globe,  label: "Global network" },
  { icon: Gem,    label: "Zero hidden fees" },
];

const STATS = [
  { icon: Users, value: "10K+", label: "Users" },
  { icon: DollarSign, value: "$2M+", label: "Transferred" },
  { icon: CheckCircle, value: "99.9%", label: "Uptime" },
];

const INPUT_CLASS =
  "w-full px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#F0F1F5] text-sm placeholder:text-[#7A8394]/60 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C]/40 focus:bg-white/[0.05] transition-all duration-300 backdrop-blur-sm";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.1 * i, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060D1F] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const notice = searchParams.get("notice");

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [gLoading, setGLoading]       = useState(false);

  async function handleGoogle() {
    setGLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      // Use skipBrowserRedirect so we can detect "provider not enabled" before navigation
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (oauthError || !data?.url) {
        setError("Google sign-in isn't enabled yet. Please sign in with your email and password.");
        setGLoading(false);
        return;
      }
      window.location.href = data.url;
      // Browser navigates away — no need to setGLoading(false)
    } catch {
      setError("Google sign-in failed. Please use your email and password instead.");
      setGLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserSupabase();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      trackEvent("Login");
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      {/* ═══ ANIMATED BACKGROUND ═══ */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/web-bg.png"
          alt=""
          fill
          className="object-cover object-center scale-[1.02]"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#060D1F]/95 via-[#060D1F]/85 to-[#060D1F]/70" />
        <div className="absolute inset-0 bg-[#060D1F]/20 mix-blend-multiply" />
      </div>

      {/* Animated gradient orbs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[5%] w-[500px] h-[500px] bg-[#C9A84C]/[0.04] rounded-full blur-[150px] pointer-events-none z-0"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#1F6F4A]/[0.04] rounded-full blur-[130px] pointer-events-none z-0"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[50%] left-[50%] w-[300px] h-[300px] bg-[#C9A84C]/[0.02] rounded-full blur-[100px] pointer-events-none z-0"
      />

      {/* Gold dust particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
          <div
            key={`${p.x}-${p.y}`}
            className="absolute rounded-full bg-[#C9A84C] animate-pulse"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}
      </div>

      {/* ═══ CONTENT GRID ═══ */}
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* ─── LEFT: Branding Panel (desktop only) ─── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          className="hidden lg:flex flex-col justify-center px-12 xl:px-20 py-16"
        >
          <Link href="/">
            <Image
              src="/images/kobklein-logo.png"
              alt="KobKlein"
              width={160}
              height={160}
              className="h-20 w-auto mb-10 hover:scale-105 transition-transform duration-300"
              priority
            />
          </Link>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-4xl xl:text-5xl font-bold font-serif text-[#F0F1F5] leading-[1.1] mb-4"
          >
            Welcome Back to{" "}
            <span className="bg-gradient-to-r from-[#C9A84C] via-[#E2CA6E] to-[#C9A84C] bg-clip-text text-transparent">
              KobKlein
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-base text-[#B8BCC8] max-w-md mb-10 leading-relaxed"
          >
            Sign in to your account and continue your journey with
            KobKlein — Haiti&apos;s most trusted digital payment platform.
          </motion.p>

          {/* Features */}
          <div className="space-y-4 mb-10">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3 + i}
                className="flex items-center gap-3 group"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#C9A84C]/[0.08] border border-[#C9A84C]/15 flex items-center justify-center group-hover:bg-[#C9A84C]/[0.15] group-hover:border-[#C9A84C]/30 transition-all duration-300">
                  <f.icon className="h-4 w-4 text-[#C9A84C]" />
                </div>
                <span className="text-sm text-[#B8BCC8] group-hover:text-[#F0F1F5] transition-colors duration-300">{f.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={7}
            className="flex items-center gap-6 mb-10"
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`flex items-center gap-2.5 ${i > 0 ? "border-l border-white/[0.08] pl-6" : ""}`}
              >
                <s.icon className="h-4 w-4 text-[#C9A84C]/70" />
                <div>
                  <div className="text-lg font-bold text-[#F0F1F5]">
                    {s.value}
                  </div>
                  <div className="text-[10px] text-[#7A8394] uppercase tracking-wider">
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Trust badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={8}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] w-fit"
          >
            <Lock className="h-3.5 w-3.5 text-[#1F6F4A]" />
            <span className="text-xs text-[#7A8394]">
              256-bit encrypted • Military-grade security
            </span>
          </motion.div>
        </motion.div>

        {/* ─── RIGHT: Form Panel ─── */}
        <div className="flex items-center justify-center px-4 sm:px-8 pt-20 pb-12 lg:pt-16 lg:pb-16">
          {/* Mobile-only compact branding */}
          <div className="lg:hidden absolute top-6 left-4 flex items-center gap-2">
            <Link href="/">
              <Image
                src="/images/kobklein-logo.png"
                alt="KobKlein"
                width={80}
                height={80}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="w-full max-w-md"
          >
            {/* ═══ GLASSMORPHIC CARD ═══ */}
            <div className="relative rounded-3xl overflow-hidden">
              {/* Card border glow */}
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-[#C9A84C]/20 via-white/[0.06] to-[#C9A84C]/10" />

              {/* Card content */}
              <div className="relative rounded-3xl bg-[#111A30]/80 backdrop-blur-2xl p-8 sm:p-10">
                {/* Top accent line */}
                <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />

                {/* Icon + heading */}
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border border-[#C9A84C]/20 flex items-center justify-center"
                  >
                    <Fingerprint className="h-6 w-6 text-[#C9A84C]" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold font-serif text-[#F0F1F5]">
                      Sign In
                    </h2>
                    <p className="text-sm text-[#7A8394]">
                      Access your KobKlein account
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Auth callback notices */}
                  {notice === "password_reset" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-4 py-3 rounded-xl bg-[#1F6F4A]/15 border border-[#1F6F4A]/30 text-sm text-emerald-400 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      Password updated successfully — sign in with your new password.
                    </motion.div>
                  )}
                  {notice === "confirmed" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-4 py-3 rounded-xl bg-[#1F6F4A]/15 border border-[#1F6F4A]/30 text-sm text-emerald-400 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      Email confirmed! Your account is ready — sign in below.
                    </motion.div>
                  )}
                  {notice === "link_expired" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      That confirmation link has expired. Sign in to receive a new one.
                    </motion.div>
                  )}
                  {notice === "link_invalid" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      That link is no longer valid. Please sign in or request a new confirmation email.
                    </motion.div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-xs font-medium text-[#B8BCC8] tracking-wide"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@example.com"
                      className={INPUT_CLASS}
                      autoComplete="email"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="block text-xs font-medium text-[#B8BCC8] tracking-wide"
                      >
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-[11px] text-[#C9A84C]/80 hover:text-[#C9A84C] font-medium transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${INPUT_CLASS} pr-11`}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#7A8394] hover:text-[#B8BCC8] hover:bg-white/[0.05] transition-all"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

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
                          Sign In to Your Account
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>

                {/* Trust indicators */}
                <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-[#7A8394]">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-[#1F6F4A]" />
                    <span>Encrypted</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-[#1F6F4A]" />
                    <span>Bank-grade</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-[#C9A84C]" />
                    <span>Instant</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#111A30] px-4 text-[10px] text-[#7A8394]/60 uppercase tracking-widest">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Google — active */}
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={gLoading}
                    className="group/social flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-[#B8BCC8] text-xs font-medium hover:bg-white/[0.06] hover:border-white/[0.14] hover:text-[#F0F1F5] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {gLoading ? (
                      <div className="h-4 w-4 border-2 border-[#7A8394]/30 border-t-[#7A8394] rounded-full animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <title>Google</title>
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    Google
                  </button>

                  {/* Facebook — coming soon */}
                  <button
                    type="button"
                    disabled
                    className="group/social flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[#7A8394] text-xs font-medium opacity-40 cursor-not-allowed transition-all"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <title>Facebook</title>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>

                  {/* Apple — coming soon */}
                  <button
                    type="button"
                    disabled
                    className="group/social flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[#7A8394] text-xs font-medium opacity-40 cursor-not-allowed transition-all"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <title>Apple</title>
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Apple
                  </button>
                </div>

                {/* Create account */}
                <p className="mt-6 text-center text-sm text-[#7A8394]">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-[#C9A84C] hover:text-[#E2CA6E] font-semibold transition-colors"
                  >
                    Create one now
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
