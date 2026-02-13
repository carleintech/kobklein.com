"use client";

import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Send,
  QrCode,
  CreditCard,
  Users,
  ShieldCheck,
  Coins,
  Smartphone,
  Download,
  Star,
  ChevronDown,
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: Send,
    title: "K-Pay Transfers",
    description:
      "Send money instantly to anyone in Haiti or abroad. Zero fees for wallet-to-wallet transfers with real-time confirmation.",
  },
  {
    icon: QrCode,
    title: "K-Code / K-Scan",
    description:
      "Generate and scan QR codes for instant peer-to-peer payments. No need to share phone numbers or account details.",
  },
  {
    icon: CreditCard,
    title: "K-Card Virtual Card",
    description:
      "Get a virtual Visa card instantly. Shop online at millions of merchants worldwide directly from your KobKlein balance.",
  },
  {
    icon: Users,
    title: "K-Link Family Panel",
    description:
      "Manage family finances together. Send allowances, set spending limits, and track shared expenses from one dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "K-Trust Verification",
    description:
      "Bank-grade identity verification with biometric security. Your funds are protected by multi-layer encryption.",
  },
  {
    icon: Coins,
    title: "Multi-Currency",
    description:
      "Hold HTG, USD, EUR, and CAD in one wallet. Convert between currencies at competitive real-time exchange rates.",
  },
];

export default function AppPage() {
  return (
    <>
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden min-h-[90vh] flex flex-col justify-center">
        <div className="absolute inset-0 bg-kob-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(198,167,86,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(31,111,74,0.08),transparent)]" />
        <div className="absolute inset-0 gold-dust" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-kob-gold/25 bg-kob-gold/5 text-sm text-kob-gold backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kob-gold opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-kob-gold" />
                  </span>
                  Available on iOS &amp; Android
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text leading-[1.1] tracking-tight"
              >
                Download{" "}
                <span className="gradient-gold-text">KobKlein</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="text-xl text-kob-body font-light max-w-lg"
              >
                Your sovereign digital wallet for Haiti and the diaspora.
                Send, receive, save, and spend -- all from the palm of your hand.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  type="button"
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl px-6 py-3 transition-all duration-200"
                >
                  <div className="text-2xl text-kob-text">&#63743;</div>
                  <div className="text-left">
                    <div className="text-xs text-kob-muted">Download on the</div>
                    <div className="text-sm font-semibold text-kob-text">App Store</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl px-6 py-3 transition-all duration-200"
                >
                  <div className="text-2xl text-kob-gold">&#9654;</div>
                  <div className="text-left">
                    <div className="text-xs text-kob-muted">Get it on</div>
                    <div className="text-sm font-semibold text-kob-text">Google Play</div>
                  </div>
                </button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={4}
                className="flex items-center gap-3 text-sm text-kob-muted"
              >
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-kob-gold fill-kob-gold" />
                  ))}
                </div>
                <span>4.9 rating &middot; 50,000+ downloads</span>
              </motion.div>
            </div>

            {/* Right -- Phone mockup */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              custom={2}
              className="flex justify-center"
            >
              <div className="relative w-[280px] h-[560px] rounded-[3rem] border-2 border-kob-gold/20 bg-gradient-to-b from-kob-panel to-kob-black shadow-2xl shadow-kob-gold/10 overflow-hidden">
                {/* Status bar */}
                <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center">
                  <div className="w-24 h-6 rounded-b-2xl bg-kob-black" />
                </div>
                {/* Screen content placeholder */}
                <div className="absolute inset-0 top-14 bottom-4 mx-3 rounded-2xl bg-kob-navy/50 flex flex-col items-center justify-center gap-4 p-6">
                  <div className="w-16 h-16 rounded-2xl bg-kob-gold/10 border border-kob-gold/25 flex items-center justify-center">
                    <span className="text-2xl font-bold text-kob-gold font-serif-luxury">K</span>
                  </div>
                  <div className="text-center">
                    <div className="text-kob-gold text-2xl font-bold font-serif-luxury">$2,450.00</div>
                    <div className="text-kob-muted text-xs mt-1">Available Balance</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 w-full mt-4">
                    {[
                      { icon: Send, label: "Send" },
                      { icon: QrCode, label: "Scan" },
                      { icon: Download, label: "Top Up" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-kob-black/50 border border-white/5">
                        <Icon className="h-5 w-5 text-kob-gold" />
                        <span className="text-[10px] text-kob-muted">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="w-full space-y-2 mt-4">
                    {["K-Pay to Jean M.", "Netflix Subscription", "USD to HTG Convert"].map((tx) => (
                      <div key={tx} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-kob-black/40 border border-white/4">
                        <div className="w-8 h-8 rounded-full bg-kob-gold/10 flex items-center justify-center">
                          <Coins className="h-4 w-4 text-kob-gold/60" />
                        </div>
                        <div className="flex-1">
                          <div className="text-[11px] text-kob-body">{tx}</div>
                          <div className="text-[9px] text-kob-muted">Today</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 divider-gold" />
      </section>

      {/* ---- Features ---- */}
      <section className="py-24 bg-kob-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text">
              Everything You Need in{" "}
              <span className="gradient-gold-text">One App</span>
            </h2>
            <p className="text-kob-muted mt-3 text-lg max-w-2xl mx-auto">
              KobKlein combines powerful financial tools with the elegance and security you deserve.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }, i) => (
              <motion.div
                key={title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={i}
                className="card-sovereign shimmer-gold p-6 group"
              >
                <div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-5 group-hover:bg-kob-gold/15 transition-colors duration-200">
                  <Icon className="h-6 w-6 text-kob-gold" />
                </div>
                <h3 className="text-lg font-semibold text-kob-text mb-2">{title}</h3>
                <p className="text-kob-muted text-sm leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Screenshots / Mockups ---- */}
      <section className="py-24 bg-kob-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text">
              Designed for <span className="gradient-gold-text">Elegance</span>
            </h2>
            <p className="text-kob-muted mt-3 text-lg max-w-2xl mx-auto">
              A beautiful, intuitive interface that makes managing your money a pleasure.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-8">
            {[
              { label: "Dashboard", color: "from-kob-gold/10 to-kob-gold/5" },
              { label: "Send Money", color: "from-kob-emerald/10 to-kob-emerald/5" },
              { label: "K-Card", color: "from-kob-gold/10 to-kob-navy" },
            ].map(({ label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="flex flex-col items-center gap-4"
              >
                <div
                  className={`w-[200px] h-[400px] rounded-[2rem] border border-white/10 bg-gradient-to-b ${color} shadow-xl shadow-black/30 flex items-center justify-center`}
                >
                  <div className="text-center px-4">
                    <Smartphone className="h-10 w-10 text-kob-gold/40 mx-auto mb-3" />
                    <div className="text-sm text-kob-muted">{label}</div>
                  </div>
                </div>
                <span className="text-sm text-kob-body font-medium">{label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Download CTA ---- */}
      <section className="py-24 relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,167,86,0.08),transparent_70%)]" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="font-serif-luxury text-3xl md:text-5xl font-bold text-kob-text">
              Ready to Take Control of{" "}
              <span className="gradient-gold-text">Your Finances</span>?
            </h2>
            <p className="text-lg text-kob-muted max-w-2xl mx-auto">
              Join thousands of Haitians who trust KobKlein for their everyday financial needs.
              Download the app today and experience sovereign digital banking.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <button
                type="button"
                className="btn-gold px-8 py-4 text-lg flex items-center gap-2 shadow-lg shadow-kob-gold/20"
              >
                Download Now
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
              <button
                type="button"
                className="flex items-center gap-3 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl px-6 py-3 transition-all duration-200"
              >
                <div className="text-2xl text-kob-text">&#63743;</div>
                <div className="text-left">
                  <div className="text-xs text-kob-muted">Download on the</div>
                  <div className="text-sm font-semibold text-kob-text">App Store</div>
                </div>
              </button>
              <button
                type="button"
                className="flex items-center gap-3 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl px-6 py-3 transition-all duration-200"
              >
                <div className="text-2xl text-kob-gold">&#9654;</div>
                <div className="text-left">
                  <div className="text-xs text-kob-muted">Get it on</div>
                  <div className="text-sm font-semibold text-kob-text">Google Play</div>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-6">
              {["Free to Download", "No Hidden Fees", "Bank-Grade Security", "24/7 Support"].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-1.5 rounded-full border border-kob-gold/15 text-sm text-kob-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
