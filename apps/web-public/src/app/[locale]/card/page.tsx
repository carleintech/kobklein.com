"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  CreditCard,
  ShoppingCart,
  Bell,
  Lock,
  Globe,
  Wifi,
  Check,
  ArrowRight,
  Shield,
  Smartphone,
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: CreditCard,
    title: "Virtual Visa Card",
    description:
      "Get a Visa card instantly in your KobKlein app. No bank account required, no credit check, no paperwork.",
  },
  {
    icon: ShoppingCart,
    title: "Online Shopping",
    description:
      "Shop at millions of online merchants worldwide. Use your K-Card anywhere Visa is accepted.",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    description:
      "Receive instant push notifications for every transaction. Always know when and where your card is used.",
  },
  {
    icon: Lock,
    title: "Spending Controls",
    description:
      "Set daily limits, freeze your card instantly, and manage subscriptions -- all from the KobKlein app.",
  },
];

const merchants = [
  "Netflix",
  "Amazon",
  "Spotify",
  "Apple",
  "Google",
  "Uber",
  "Airbnb",
  "PlayStation",
  "Disney+",
  "YouTube Premium",
  "Shopify Stores",
  "And millions more...",
];

export default function CardPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden min-h-[85vh] flex flex-col justify-center">
        <div className="absolute inset-0 bg-kob-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(198,167,86,0.14),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_70%,rgba(198,167,86,0.06),transparent)]" />
        <div className="absolute inset-0 gold-dust" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-kob-gold/25 bg-kob-gold/5 text-sm text-kob-gold backdrop-blur-sm">
                  <CreditCard className="h-4 w-4" />
                  Virtual &amp; Physical Cards
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text leading-[1.1] tracking-tight"
              >
                Introducing{" "}
                <span className="gradient-gold-text">K-Card</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="text-xl text-kob-body font-light max-w-lg"
              >
                Your KobKlein balance, now accepted everywhere.
                A Visa card that connects your digital wallet to the world.
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center gap-2 text-sm text-kob-muted">
                  <Shield className="h-4 w-4 text-kob-gold/60" />
                  Bank-Grade Security
                </div>
                <div className="flex items-center gap-2 text-sm text-kob-muted">
                  <Globe className="h-4 w-4 text-kob-gold/60" />
                  Accepted Worldwide
                </div>
                <div className="flex items-center gap-2 text-sm text-kob-muted">
                  <Wifi className="h-4 w-4 text-kob-gold/60" />
                  Contactless Ready
                </div>
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
                <a
                  href="#waitlist"
                  className="btn-gold px-8 py-4 text-lg inline-flex items-center gap-2 shadow-lg shadow-kob-gold/20"
                >
                  Join the Waitlist
                  <ArrowRight className="h-5 w-5" />
                </a>
              </motion.div>
            </div>

            {/* Right -- Card Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotateY: -8 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="flex justify-center perspective-[1000px]"
            >
              <div className="relative w-full max-w-[420px] aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl shadow-kob-gold/15">
                {/* Card background */}
                <div className="absolute inset-0 bg-gradient-to-br from-kob-panel via-kob-navy to-kob-black" />
                <div className="absolute inset-0 border border-kob-gold/25 rounded-2xl" />

                {/* Gold accent lines */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kob-gold/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kob-gold/20 to-transparent" />

                {/* Holographic effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-kob-gold/5 via-transparent to-kob-gold/5 opacity-60" />

                {/* Chip */}
                <div className="absolute top-8 left-8">
                  <div className="w-12 h-9 rounded-md bg-gradient-to-br from-kob-gold to-kob-gold-dark shadow-inner" />
                </div>

                {/* Contactless symbol */}
                <div className="absolute top-8 left-24">
                  <Wifi className="h-6 w-6 text-kob-gold/40 rotate-90" />
                </div>

                {/* Card number */}
                <div className="absolute bottom-20 left-8 text-kob-body/80 text-xl tracking-[0.25em] font-mono">
                  **** **** **** 4321
                </div>

                {/* Cardholder */}
                <div className="absolute bottom-8 left-8">
                  <div className="text-[10px] text-kob-muted/60 uppercase tracking-wider mb-1">Card Holder</div>
                  <div className="text-kob-body text-sm uppercase tracking-wider">KobKlein Member</div>
                </div>

                {/* Expiry */}
                <div className="absolute bottom-8 right-24">
                  <div className="text-[10px] text-kob-muted/60 uppercase tracking-wider mb-1">Expires</div>
                  <div className="text-kob-body text-sm tracking-wider">12/28</div>
                </div>

                {/* Logo & brand */}
                <div className="absolute top-8 right-8 text-kob-gold/50 text-xs font-medium tracking-wider">
                  K-CARD
                </div>
                <div className="absolute bottom-8 right-8 text-kob-gold font-bold text-2xl font-serif-luxury">
                  K
                </div>

                {/* Visa mark placeholder */}
                <div className="absolute top-10 right-8 mt-6 text-kob-gold/30 text-sm font-bold italic tracking-wider">
                  VISA
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
              Card Features Built for{" "}
              <span className="gradient-gold-text">You</span>
            </h2>
            <p className="text-kob-muted mt-3 text-lg max-w-2xl mx-auto">
              K-Card gives you the power and flexibility of a premium Visa card, backed by your KobKlein wallet.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, description }, i) => (
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

      {/* ---- Supported Merchants ---- */}
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
              Shop at Your Favorite{" "}
              <span className="gradient-gold-text">Brands</span>
            </h2>
            <p className="text-kob-muted mt-3 text-lg max-w-2xl mx-auto">
              K-Card is accepted everywhere Visa is accepted -- online and in-store worldwide.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {merchants.map((merchant, i) => (
              <motion.div
                key={merchant}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="card-sovereign p-4 text-center group hover:border-kob-gold/30 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-kob-gold/5 border border-kob-gold/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-kob-gold/10 transition-colors duration-200">
                  <Smartphone className="h-5 w-5 text-kob-gold/50" />
                </div>
                <span className="text-xs text-kob-body font-medium">{merchant}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Waitlist CTA ---- */}
      <section id="waitlist" className="py-24 bg-kob-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-4">
                Be Among the First to Get{" "}
                <span className="gradient-gold-text">K-Card</span>
              </h2>
              <p className="text-kob-muted text-lg mb-6 leading-relaxed">
                K-Card is rolling out to KobKlein members. Join the waitlist
                to secure your spot and be notified when your card is ready.
              </p>

              <div className="space-y-4">
                {[
                  "Instant virtual card delivered to your app",
                  "Physical card shipped to your address",
                  "No annual fees for early members",
                  "Priority access to premium features",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-kob-body">
                    <div className="w-6 h-6 rounded-full bg-kob-emerald/10 border border-kob-emerald/20 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-kob-emerald" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="card-sovereign p-8"
            >
              <h3 className="text-xl font-bold mb-2 text-kob-text">Join the K-Card Waitlist</h3>
              <p className="text-sm text-kob-muted mb-6">
                Enter your details below and we&apos;ll notify you as soon as K-Card is available for your account.
              </p>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-kob-emerald/10 border border-kob-emerald/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-kob-emerald" />
                  </div>
                  <p className="text-lg font-semibold text-kob-text">You&apos;re on the list!</p>
                  <p className="text-sm text-kob-muted mt-2">
                    We&apos;ll notify you when K-Card is ready for you.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                  className="space-y-4"
                >
                  <input
                    required
                    type="text"
                    placeholder="Full name"
                    className="w-full px-4 py-3 rounded-xl border border-white/6 bg-kob-black text-kob-text text-sm placeholder:text-kob-muted focus:outline-none focus:border-kob-gold/40 transition-colors duration-200"
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email address"
                    className="w-full px-4 py-3 rounded-xl border border-white/6 bg-kob-black text-kob-text text-sm placeholder:text-kob-muted focus:outline-none focus:border-kob-gold/40 transition-colors duration-200"
                  />
                  <input
                    required
                    type="tel"
                    placeholder="Phone number"
                    className="w-full px-4 py-3 rounded-xl border border-white/6 bg-kob-black text-kob-text text-sm placeholder:text-kob-muted focus:outline-none focus:border-kob-gold/40 transition-colors duration-200"
                  />
                  <button type="submit" className="w-full btn-gold py-3 text-sm">
                    Join Waitlist
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
