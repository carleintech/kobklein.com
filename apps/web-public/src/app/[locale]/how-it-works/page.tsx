"use client";

import {
  Download,
  UserPlus,
  Wallet,
  CreditCard,
  ArrowRight,
  User,
  Globe,
  Store,
  MapPin,
  Shield,
  Lock,
  FileCheck,
  Fingerprint,
  Smartphone,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" },
  }),
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const steps = [
  {
    icon: Download,
    number: "01",
    title: "Download the App",
    description:
      "Get KobKlein from the App Store or Google Play. The app is lightweight, works on any smartphone, and supports English, French, and Haitian Creole.",
    details: [
      "Available on iOS 15+ and Android 8+",
      "Under 30 MB download size",
      "Works on low-bandwidth connections",
      "Offline mode for viewing balances",
    ],
  },
  {
    icon: UserPlus,
    number: "02",
    title: "Sign Up & Verify",
    description:
      "Create your account in under 3 minutes. Our streamlined KYC process uses your government ID and a selfie to verify your identity securely.",
    details: [
      "Phone number registration",
      "Government ID scan via camera",
      "AI-powered selfie verification",
      "Instant or same-day approval",
    ],
  },
  {
    icon: Wallet,
    number: "03",
    title: "Add Funds",
    description:
      "Load your wallet through multiple channels: bank transfer, K-Agent cash deposit, mobile money, or receive funds from the diaspora.",
    details: [
      "Bank transfer from any Haitian bank",
      "Cash deposit at 5,000+ K-Agent locations",
      "Mobile money interoperability",
      "International remittance from 15+ countries",
    ],
  },
  {
    icon: CreditCard,
    number: "04",
    title: "Start Paying",
    description:
      "Pay merchants with QR codes, send money to anyone with a phone number, pay bills, or use your K-Card at any Visa-accepting location worldwide.",
    details: [
      "QR code payments at local merchants",
      "Instant peer-to-peer transfers",
      "Bill payment for utilities and services",
      "K-Card for online and international purchases",
    ],
  },
];

const userTypes = [
  {
    icon: User,
    title: "Individuals",
    description:
      "Manage your daily finances with a secure digital wallet. Pay for groceries, utilities, school fees, and more without carrying cash. Earn rewards on every transaction.",
    features: ["Free P2P transfers", "Bill payment", "Savings goals", "Transaction history"],
  },
  {
    icon: Globe,
    title: "Diaspora",
    description:
      "Send money home to Haiti instantly with the lowest fees in the market. Your family receives funds directly in their KobKlein wallet, ready to spend or withdraw.",
    features: ["Low remittance fees", "Real-time delivery", "Exchange rate lock", "Scheduled transfers"],
  },
  {
    icon: Store,
    title: "Merchants",
    description:
      "Accept digital payments with zero hardware investment. Generate QR codes, track sales in real time, and receive next-day settlement to your bank account.",
    features: ["QR code acceptance", "Sales analytics", "Inventory tools", "Staff accounts"],
  },
  {
    icon: MapPin,
    title: "K-Agents",
    description:
      "Become a KobKlein distribution partner and earn commissions on every cash-in, cash-out, and registration you facilitate. Join our network of 5,000+ agents.",
    features: ["Commission earnings", "Agent dashboard", "Training & support", "Territory exclusivity"],
  },
];

const techFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description:
      "All data is encrypted in transit with TLS 1.3 and at rest with AES-256. Your financial data never travels unprotected.",
  },
  {
    icon: Fingerprint,
    title: "Biometric Authentication",
    description:
      "Secure every transaction with fingerprint or face recognition. Combined with PIN backup for maximum security and convenience.",
  },
  {
    icon: FileCheck,
    title: "Regulatory Compliance",
    description:
      "Licensed by the Banque de la R\u00e9publique d'Ha\u00efti. Fully compliant with AML/CFT regulations, KYC standards, and international data protection laws.",
  },
  {
    icon: Shield,
    title: "Fraud Prevention",
    description:
      "AI-powered transaction monitoring detects suspicious activity in real time. Automatic alerts and account freezing protect your funds 24/7.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-kob-black gold-dust">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(198,167,86,0.10),transparent)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-kob-gold/25 bg-kob-gold/5 text-sm text-kob-gold mb-8"
          >
            <Smartphone className="h-4 w-4" />
            Simple &amp; Secure
          </motion.div>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text leading-[1.1] tracking-tight"
          >
            How <span className="gradient-gold-text">KobKlein</span> Works
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-6 text-xl text-kob-body max-w-2xl mx-auto"
          >
            From download to your first payment in minutes. A seamless financial
            experience designed for Haiti and the Haitian diaspora.
          </motion.p>
        </div>
        <div className="divider-gold" />
      </section>

      {/* 4-Step Process */}
      <section className="bg-kob-navy py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-20"
          >
            <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text">
              Get Started in{" "}
              <span className="gradient-gold-text">4 Simple Steps</span>
            </h2>
          </motion.div>
          <div className="space-y-16">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={0}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  i % 2 === 1 ? "lg:direction-rtl" : ""
                }`}
              >
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-kob-gold/10 flex items-center justify-center border border-kob-gold/20">
                      <step.icon className="h-8 w-8 text-kob-gold" />
                    </div>
                    <div>
                      <span className="text-kob-gold font-mono text-sm">
                        STEP {step.number}
                      </span>
                      <h3 className="font-serif-luxury text-2xl font-bold text-kob-text">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-kob-body leading-relaxed mb-6">
                    {step.description}
                  </p>
                  <ul className="space-y-3">
                    {step.details.map((detail, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-3 text-kob-body text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-kob-gold flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="card-sovereign p-12 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-8xl font-serif-luxury font-bold text-kob-gold/10 mb-4">
                        {step.number}
                      </div>
                      <step.icon className="h-16 w-16 text-kob-gold/40 mx-auto" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Different Users */}
      <section className="bg-kob-black py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text">
              Built for <span className="gradient-gold-text">Everyone</span>
            </h2>
            <p className="mt-4 text-kob-body max-w-xl mx-auto">
              Whether you are managing daily expenses, sending money home,
              running a business, or serving your community, KobKlein works for you.
            </p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {userTypes.map((type, i) => (
              <motion.div
                key={type.title}
                variants={fadeUp}
                custom={i}
                className="card-sovereign shimmer-gold p-8"
              >
                <div className="w-12 h-12 rounded-xl bg-kob-gold/10 flex items-center justify-center mb-5">
                  <type.icon className="h-6 w-6 text-kob-gold" />
                </div>
                <h3 className="font-serif-luxury text-xl font-semibold text-kob-text mb-3">
                  {type.title}
                </h3>
                <p className="text-kob-body text-sm leading-relaxed mb-5">
                  {type.description}
                </p>
                <ul className="space-y-2">
                  {type.features.map((feature, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-kob-muted text-xs"
                    >
                      <div className="w-1 h-1 rounded-full bg-kob-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="bg-kob-navy py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text">
              Powered by{" "}
              <span className="gradient-gold-text">Trust &amp; Technology</span>
            </h2>
            <p className="mt-4 text-kob-body max-w-xl mx-auto">
              Bank-grade security infrastructure protecting every transaction,
              every account, every day.
            </p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-6"
          >
            {techFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                className="card-sovereign p-8 flex items-start gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-kob-gold/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-kob-gold" />
                </div>
                <div>
                  <h3 className="font-serif-luxury text-lg font-semibold text-kob-text mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-kob-body text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Get Started CTA */}
      <section className="bg-kob-black py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="card-sovereign p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(198,167,86,0.06),transparent)]" />
            <div className="relative z-10">
              <Smartphone className="h-12 w-12 text-kob-gold mx-auto mb-6" />
              <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-kob-body max-w-xl mx-auto mb-8">
                Download KobKlein today and join hundreds of thousands of
                Haitians building a better financial future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="#"
                  className="btn-gold px-8 py-4 text-lg flex items-center gap-2 justify-center"
                >
                  Download the App
                  <ArrowRight className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="btn-outline-gold px-8 py-4 text-lg flex items-center gap-2 justify-center"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
