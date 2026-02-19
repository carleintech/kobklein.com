"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Send,
  CreditCard,
  QrCode,
  ShieldCheck,
  Globe,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Send,
    title: "Instant Transfers",
    desc: "Send money to anyone in Haiti in under 2 seconds. No delays, no friction — just tap and go.",
    accent: "#C9A84C",
  },
  {
    icon: CreditCard,
    title: "K-Card Virtual Visa",
    desc: "Shop online worldwide with your virtual Visa card. Funded instantly from your KobKlein wallet.",
    accent: "#E2CA6E",
  },
  {
    icon: QrCode,
    title: "QR Pay & Scan",
    desc: "Pay merchants by scanning their QR code or generate yours. Contactless, instant, and secure.",
    accent: "#14B8A0",
  },
  {
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    desc: "256-bit AES encryption, biometric auth, and real-time fraud monitoring protect every transaction.",
    accent: "#C9A84C",
  },
  {
    icon: Globe,
    title: "Diaspora Remittance",
    desc: "Receive money from family abroad at the best rates. No hidden fees, no long waits.",
    accent: "#E2CA6E",
  },
  {
    icon: Zap,
    title: "Bill Pay & Top-Up",
    desc: "Pay bills, buy airtime, and manage subscriptions — all from a single dashboard.",
    accent: "#14B8A0",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="relative py-28 lg:py-36 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />
      <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-[#C9A84C]/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-[#0E8B78]/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div ref={ref} className="relative max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium text-[#C9A84C] border border-[#C9A84C]/20 bg-[#C9A84C]/[0.05] mb-6 tracking-wide uppercase"
          >
            Built for Haiti
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F0F1F5] font-serif tracking-tight"
          >
            Everything you need,{" "}
            <span className="bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E] bg-clip-text text-transparent">
              one wallet.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-lg text-[#B8BCC8] max-w-2xl mx-auto"
          >
            From instant transfers to virtual cards, KobKlein puts the
            full power of digital banking in your pocket.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={cardVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                custom={i}
                className="group relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-8 backdrop-blur-sm transition-all duration-500 hover:border-[#C9A84C]/20 hover:shadow-xl hover:shadow-[#C9A84C]/[0.04] hover:-translate-y-1"
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${f.accent}15, ${f.accent}08)`,
                    border: `1px solid ${f.accent}20`,
                  }}
                >
                  <Icon size={22} style={{ color: f.accent }} />
                </div>

                {/* Text */}
                <h3 className="text-lg font-semibold text-[#F0F1F5] mb-2.5">{f.title}</h3>
                <p className="text-sm text-[#7A8394] leading-relaxed">{f.desc}</p>

                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(400px circle at top right, ${f.accent}06, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
