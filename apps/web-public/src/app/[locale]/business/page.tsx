"use client";

import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Zap,
  QrCode,
  BarChart3,
  Coins,
  Check,
  Store,
  ShieldCheck,
  Clock,
  Globe,
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const benefits = [
  {
    icon: Zap,
    title: "Instant Settlement",
    description:
      "Funds arrive in your merchant account within seconds. No more waiting days for bank transfers to clear.",
  },
  {
    icon: QrCode,
    title: "K-Scan QR Payments",
    description:
      "Generate a unique QR code for your business. Customers scan and pay instantly from their KobKlein wallet.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Analytics",
    description:
      "Real-time sales tracking, customer insights, and revenue reports. Make data-driven decisions for your business.",
  },
  {
    icon: Coins,
    title: "Low Transaction Fees",
    description:
      "Just 1.5% per transaction with no monthly fees, no setup costs, and no hidden charges. Keep more of what you earn.",
  },
];

const steps = [
  {
    number: "01",
    title: "Sign Up & Verify",
    description:
      "Create your merchant account in minutes. Complete K-Trust business verification to unlock full features.",
  },
  {
    number: "02",
    title: "Set Up K-Scan",
    description:
      "Generate your unique business QR code. Print it, display it at your register, or embed it on your website.",
  },
  {
    number: "03",
    title: "Start Accepting Payments",
    description:
      "Customers scan, pay, and you receive funds instantly. Track everything from your merchant dashboard.",
  },
];

const pricingFeatures = [
  "No monthly subscription fees",
  "No setup or activation costs",
  "1.5% per transaction only",
  "Free merchant dashboard",
  "Free K-Scan QR code kit",
  "Multi-currency acceptance",
  "Same-day settlement",
  "Dedicated merchant support",
];

export default function BusinessPage() {
  return (
    <>
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden min-h-[80vh] flex flex-col justify-center">
        <div className="absolute inset-0 bg-kob-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(198,167,86,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_80%,rgba(31,111,74,0.08),transparent)]" />
        <div className="absolute inset-0 gold-dust" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-kob-gold/25 bg-kob-gold/5 text-sm text-kob-gold backdrop-blur-sm">
                <Store className="h-4 w-4" />
                For Merchants &amp; Businesses
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text leading-[1.1] tracking-tight"
            >
              Accept{" "}
              <span className="gradient-gold-text">K-Pay Payments</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-xl text-kob-body font-light max-w-2xl mx-auto"
            >
              Grow your business with Haiti&apos;s most trusted digital payment platform.
              Instant settlement, powerful analytics, and the lowest fees in the market.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2"
            >
              <a
                href="#apply"
                className="btn-gold px-8 py-4 text-lg flex items-center gap-2 shadow-lg shadow-kob-gold/20"
              >
                Apply for Merchant Account
                <ArrowRight className="h-5 w-5" />
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="flex flex-wrap justify-center gap-6 pt-4 text-kob-muted text-sm"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-kob-gold/60" /> Free to Sign Up
              </span>
              <span className="w-px h-4 bg-white/10" />
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-kob-gold/60" /> Instant Settlement
              </span>
              <span className="w-px h-4 bg-white/10" />
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-kob-gold/60" /> Multi-Currency
              </span>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 divider-gold" />
      </section>

      {/* ---- Benefits ---- */}
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
              Why Merchants Choose{" "}
              <span className="gradient-gold-text">KobKlein</span>
            </h2>
            <p className="text-kob-muted mt-3 text-lg max-w-2xl mx-auto">
              Join hundreds of businesses across Haiti already accepting K-Pay payments.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map(({ icon: Icon, title, description }, i) => (
              <motion.div
                key={title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={i}
                className="card-sovereign shimmer-gold p-8 group"
              >
                <div className="w-14 h-14 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-5 group-hover:bg-kob-gold/15 transition-colors duration-200">
                  <Icon className="h-7 w-7 text-kob-gold" />
                </div>
                <h3 className="text-xl font-semibold text-kob-text mb-2">{title}</h3>
                <p className="text-kob-muted text-sm leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- How It Works ---- */}
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
              Get Started in{" "}
              <span className="gradient-gold-text">3 Simple Steps</span>
            </h2>
            <p className="text-kob-muted mt-3 text-lg max-w-2xl mx-auto">
              From sign-up to your first payment in under 24 hours.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ number, title, description }, i) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative card-sovereign p-8 text-center"
              >
                <div className="absolute top-4 right-6 text-5xl font-black text-white/[0.03] select-none font-serif-luxury">
                  {number}
                </div>
                <div className="w-16 h-16 rounded-full bg-kob-gold/10 border border-kob-gold/25 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-kob-gold font-serif-luxury">{number}</span>
                </div>
                <h3 className="text-lg font-bold text-kob-text mb-3">{title}</h3>
                <p className="text-kob-muted text-sm leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Pricing ---- */}
      <section className="py-24 bg-kob-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-4">
                Transparent{" "}
                <span className="gradient-gold-text">Pricing</span>
              </h2>
              <p className="text-kob-muted text-lg mb-8 leading-relaxed">
                No surprises, no hidden fees. Just a simple, fair pricing model
                that helps your business grow.
              </p>

              <div className="card-sovereign p-8 mb-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-kob-gold font-serif-luxury">1.5%</span>
                  <span className="text-kob-muted text-lg">per transaction</span>
                </div>
                <p className="text-sm text-kob-muted">
                  That&apos;s it. No monthly fees, no minimums, no setup costs.
                </p>
              </div>

              <a
                href="#apply"
                className="btn-gold px-8 py-4 text-lg inline-flex items-center gap-2 shadow-lg shadow-kob-gold/20"
              >
                Start Accepting Payments
                <ArrowRight className="h-5 w-5" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="card-sovereign p-8"
            >
              <h3 className="text-xl font-bold text-kob-text mb-6">
                Everything Included
              </h3>
              <ul className="space-y-4">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-kob-body">
                    <div className="w-6 h-6 rounded-full bg-kob-emerald/10 border border-kob-emerald/20 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-kob-emerald" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---- Apply CTA ---- */}
      <section id="apply" className="py-24 relative overflow-hidden gold-dust">
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
              Ready to Grow{" "}
              <span className="gradient-gold-text">Your Business</span>?
            </h2>
            <p className="text-lg text-kob-muted max-w-2xl mx-auto">
              Apply for a KobKlein merchant account today. Our team will review your
              application and get you set up within 24 hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <button
                type="button"
                className="btn-gold px-8 py-4 text-lg flex items-center gap-2 shadow-lg shadow-kob-gold/20"
              >
                Apply Now
                <ArrowRight className="h-5 w-5" />
              </button>
              <a
                href="/contact"
                className="px-8 py-4 text-lg text-kob-gold border border-kob-gold/25 rounded-xl hover:bg-kob-gold/5 transition-colors duration-200"
              >
                Contact Sales
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-6">
              {["Free Sign-Up", "24h Approval", "Dedicated Support", "No Contracts"].map((tag) => (
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
