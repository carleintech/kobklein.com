"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Shield,
  Fingerprint,
  Eye,
  Lock,
  Server,
  BadgeCheck,
} from "lucide-react";

const trustPoints = [
  {
    icon: Shield,
    title: "256-bit AES Encryption",
    desc: "Military-grade encryption protects every transaction and personal data point.",
  },
  {
    icon: Fingerprint,
    title: "Biometric Authentication",
    desc: "Face ID, Touch ID, and PIN verification for every sensitive action.",
  },
  {
    icon: Eye,
    title: "Real-Time Monitoring",
    desc: "AI-powered fraud detection watches your account 24/7, flagging suspicious activity instantly.",
  },
  {
    icon: Lock,
    title: "Zero-Knowledge Architecture",
    desc: "Your financial data is encrypted end-to-end. Even we can't read your transaction details.",
  },
  {
    icon: Server,
    title: "Redundant Infrastructure",
    desc: "Multi-region servers with 99.99% uptime guarantee. Your money is always accessible.",
  },
  {
    icon: BadgeCheck,
    title: "Regulatory Compliant",
    desc: "Fully licensed and compliant with Haitian financial regulations and international standards.",
  },
];

export function SecuritySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="security" className="relative py-28 lg:py-36 overflow-hidden">
      {/* Top line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Ambient */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#C9A84C]/[0.015] rounded-full blur-[150px] pointer-events-none" />

      <div ref={ref} className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium text-[#C9A84C] border border-[#C9A84C]/20 bg-[#C9A84C]/[0.05] mb-6 tracking-wide uppercase"
          >
            Enterprise Security
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F0F1F5] font-serif tracking-tight"
          >
            Your money deserves{" "}
            <span className="bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E] bg-clip-text text-transparent">
              fortress-level
            </span>{" "}
            protection.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-lg text-[#B8BCC8] max-w-2xl mx-auto"
          >
            We built KobKlein with the same security infrastructure
            trusted by leading financial institutions worldwide.
          </motion.p>
        </div>

        {/* Trust Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustPoints.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.08 * i }}
                className="group flex gap-4 p-6 rounded-2xl border border-white/[0.04] hover:border-[#C9A84C]/10 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#C9A84C]/[0.07] border border-[#C9A84C]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon size={20} className="text-[#C9A84C]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F0F1F5] mb-1.5">{t.title}</h3>
                  <p className="text-sm text-[#7A8394] leading-relaxed">{t.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust stat bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { value: "99.99%", label: "Uptime" },
            { value: "0", label: "Data Breaches" },
            { value: "< 50ms", label: "Auth Latency" },
            { value: "SOC 2", label: "Compliance" },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center py-6 rounded-2xl border border-white/[0.04] bg-white/[0.015]"
            >
              <div className="text-2xl lg:text-3xl font-bold text-[#C9A84C] tabular-nums">{s.value}</div>
              <div className="text-xs text-[#7A8394] font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
