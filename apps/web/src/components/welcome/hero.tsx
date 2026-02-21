"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap, Globe } from "lucide-react";

/* ── Deterministic gold particles ── */
const PARTICLES = [
  { w: 3.2, x: 8, y: 12, o: 0.18, dd: 0.3, dur: 4.2 },
  { w: 2.5, x: 23, y: 67, o: 0.22, dd: 1.1, dur: 5.8 },
  { w: 4.1, x: 45, y: 34, o: 0.16, dd: 2.4, dur: 3.6 },
  { w: 2.8, x: 67, y: 89, o: 0.28, dd: 0.7, dur: 6.1 },
  { w: 3.6, x: 91, y: 23, o: 0.20, dd: 3.2, dur: 4.9 },
  { w: 2.3, x: 15, y: 78, o: 0.32, dd: 1.8, dur: 3.3 },
  { w: 4.8, x: 52, y: 56, o: 0.17, dd: 4.1, dur: 5.5 },
  { w: 3.0, x: 78, y: 11, o: 0.25, dd: 0.5, dur: 6.7 },
  { w: 2.7, x: 35, y: 92, o: 0.19, dd: 2.9, dur: 4.1 },
  { w: 4.4, x: 62, y: 45, o: 0.30, dd: 1.4, dur: 5.2 },
  { w: 3.8, x: 5, y: 51, o: 0.21, dd: 3.7, dur: 3.8 },
  { w: 2.1, x: 88, y: 72, o: 0.26, dd: 0.2, dur: 6.4 },
  { w: 3.4, x: 42, y: 18, o: 0.15, dd: 4.6, dur: 4.7 },
  { w: 4.6, x: 19, y: 41, o: 0.33, dd: 2.1, dur: 5.0 },
  { w: 2.9, x: 73, y: 63, o: 0.23, dd: 1.6, dur: 3.5 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.15 * i, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export function WelcomeHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* ══ Background ══ */}
      <div className="absolute inset-0">
        <Image
          src="/images/web-bg.png"
          alt=""
          fill
          className="object-cover object-center scale-[1.02]"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060D1F] via-[#060D1F]/85 to-[#060D1F]/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060D1F]/60 via-transparent to-[#060D1F]" />
        <div className="absolute inset-0 bg-[#060D1F]/20 mix-blend-multiply" />
      </div>

      {/* Animated gradient orbs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#C9A84C]/[0.05] rounded-full blur-[150px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] bg-[#1F6F4A]/[0.06] rounded-full blur-[130px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[50%] right-[30%] w-[300px] h-[300px] bg-[#C9A84C]/[0.03] rounded-full blur-[100px] pointer-events-none"
      />

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#C9A84C] animate-pulse"
            style={{
              width: `${p.w}px`,
              height: `${p.w}px`,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.o,
              animationDelay: `${p.dd}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}
      </div>

      {/* ══ Content ══ */}
      <div className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* LEFT */}
          <div className="space-y-8">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/[0.06] backdrop-blur-sm"
            >
              <Sparkles size={14} className="text-[#C9A84C]" />
              <span className="text-xs font-medium text-[#C9A84C] tracking-wide uppercase">
                Secure Digital Wallet for Haiti
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#F0F1F5] leading-[1.05] tracking-tight font-serif"
            >
              Lajan dijital ou,{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#C9A84C] via-[#E2CA6E] to-[#C9A84C] bg-clip-text text-transparent">
                  an sekirite.
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                  className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-[#C9A84C] via-[#E2CA6E] to-transparent rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-lg lg:text-xl text-[#B8BCC8] max-w-xl leading-relaxed"
            >
              Send, receive, and manage your money with confidence.
              KobKlein brings modern digital banking to Haiti — fast,
              secure, and built for you.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Link
                href="/signup"
                className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-[#060D1F] overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#C9A84C]/25"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E]" />
                <span className="absolute inset-0 bg-gradient-to-r from-[#E2CA6E] via-[#F0DC82] to-[#C9A84C] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative flex items-center gap-2">
                  Create Free Account
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 rounded-2xl text-base font-medium text-[#F0F1F5] border border-white/[0.08] hover:border-white/[0.16] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 backdrop-blur-sm"
              >
                Sign In
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="flex flex-wrap items-center gap-6 pt-4"
            >
              {[
                { icon: Shield, text: "256-bit Encrypted" },
                { icon: Zap, text: "Instant Transfers" },
                { icon: Globe, text: "24/7 Support" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-[#7A8394]">
                  <Icon size={15} className="text-[#C9A84C]/60" />
                  <span className="text-xs font-medium">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Floating card */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateY: -8 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="relative hidden lg:flex items-center justify-center"
            style={{ perspective: "1200px" }}
          >
            {/* Glow behind card */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-[380px] h-[380px] rounded-full bg-[#C9A84C]/[0.06] blur-[80px]"
              />
            </div>

            {/* Concentric rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="w-[420px] h-[420px] rounded-full border border-dashed border-[#C9A84C]/[0.06]"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                className="absolute w-[350px] h-[350px] rounded-full border border-dashed border-white/[0.04]"
              />
            </div>

            {/* The card */}
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <Image
                src="/images/hero-card-glow.png"
                alt="KobKlein Digital Card"
                width={440}
                height={440}
                style={{ height: "auto" }}
                className="drop-shadow-[0_25px_60px_rgba(201,168,76,0.2)] hover:scale-[1.03] transition-transform duration-700"
                priority
              />
            </motion.div>

            {/* Floating badges around the card */}
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-8 -right-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111A30]/90 backdrop-blur-xl border border-white/[0.08] shadow-xl shadow-black/30"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1F6F4A]/20 flex items-center justify-center">
                <Shield size={16} className="text-[#1F6F4A]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#F0F1F5]">Bank-Grade</div>
                <div className="text-[10px] text-[#7A8394]">Security</div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [5, -5, 5] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-12 -left-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111A30]/90 backdrop-blur-xl border border-white/[0.08] shadow-xl shadow-black/30"
            >
              <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
                <Zap size={16} className="text-[#C9A84C]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#F0F1F5]">&lt; 2 Seconds</div>
                <div className="text-[10px] text-[#7A8394]">Transfer Speed</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#060D1F] to-transparent pointer-events-none" />
    </section>
  );
}
