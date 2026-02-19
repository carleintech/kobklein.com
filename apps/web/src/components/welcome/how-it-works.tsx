"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, Wallet, ArrowLeftRight, Sparkles } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    desc: "Sign up in under 60 seconds with your phone number. No bank account required — just you.",
  },
  {
    icon: Wallet,
    step: "02",
    title: "Fund Your Wallet",
    desc: "Add money via bank transfer, mobile money, diaspora remittance, or cash through any KobKlein agent.",
  },
  {
    icon: ArrowLeftRight,
    step: "03",
    title: "Send & Receive",
    desc: "Transfer money instantly to anyone in Haiti. Pay merchants, split bills, or send to family.",
  },
  {
    icon: Sparkles,
    step: "04",
    title: "Unlock More",
    desc: "Get your K-Card virtual Visa, set up recurring payments, and access premium features as you grow.",
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="relative py-28 lg:py-36 overflow-hidden">
      {/* Decorative line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-[#0E8B78]/[0.03] rounded-full blur-[150px] pointer-events-none" />

      <div ref={ref} className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium text-[#14B8A0] border border-[#14B8A0]/20 bg-[#14B8A0]/[0.05] mb-6 tracking-wide uppercase"
          >
            Simple & Fast
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F0F1F5] font-serif tracking-tight"
          >
            Up and running in{" "}
            <span className="bg-gradient-to-r from-[#14B8A0] to-[#0E8B78] bg-clip-text text-transparent">
              minutes.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-lg text-[#B8BCC8] max-w-2xl mx-auto"
          >
            Four simple steps to financial freedom. No paperwork, no
            branches, no waiting.
          </motion.p>
        </div>

        {/* Steps Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 * i }}
                className="group relative"
              >
                {/* Connector line (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(100%+4px)] w-[calc(100%-40px)] h-[1px]">
                    <div className="w-full h-full bg-gradient-to-r from-[#C9A84C]/30 to-[#C9A84C]/5" />
                  </div>
                )}

                {/* Card */}
                <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-all duration-500 hover:border-[#C9A84C]/15 hover:bg-white/[0.04]">
                  {/* Step number */}
                  <span className="absolute top-6 right-6 text-5xl font-bold text-white/[0.03] select-none font-serif">
                    {s.step}
                  </span>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C9A84C]/10 to-[#C9A84C]/5 border border-[#C9A84C]/10 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110">
                    <Icon size={22} className="text-[#C9A84C]" />
                  </div>

                  <h3 className="text-base font-semibold text-[#F0F1F5] mb-2">{s.title}</h3>
                  <p className="text-sm text-[#7A8394] leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
