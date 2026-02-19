"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="relative py-28 lg:py-36 overflow-hidden">
      {/* Top line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div ref={ref} className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#111A30] via-[#0F1626] to-[#0A1128]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,#C9A84C08,transparent)]" />

          {/* Decorative border */}
          <div className="absolute inset-0 rounded-3xl border border-[#C9A84C]/10" />

          {/* Gold corner accents */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-[#C9A84C]/[0.04] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-[#C9A84C]/[0.03] rounded-full blur-3xl" />

          {/* Content */}
          <div className="relative px-8 py-16 sm:px-16 sm:py-20 lg:px-24 lg:py-24 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F0F1F5] font-serif tracking-tight leading-tight"
            >
              Ready to take control of{" "}
              <span className="bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E] bg-clip-text text-transparent">
                your money?
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-5 text-lg text-[#B8BCC8] max-w-xl mx-auto"
            >
              Join thousands of Haitians already using KobKlein for
              fast, secure, and modern digital banking.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/signup"
                className="group relative inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl text-base font-semibold text-[#060D1F] overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#C9A84C]/20"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E]" />
                <span className="absolute inset-0 bg-gradient-to-r from-[#E2CA6E] via-[#F0DC82] to-[#C9A84C] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative flex items-center gap-2">
                  Get Started — It&apos;s Free
                  <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-10 py-4 rounded-2xl text-base font-medium text-[#F0F1F5] border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300"
              >
                I Already Have an Account
              </Link>
            </motion.div>

            {/* Fine print */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 text-xs text-[#7A8394]"
            >
              Free to sign up · No credit card required · Set up in 60 seconds
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
