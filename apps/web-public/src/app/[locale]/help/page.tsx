"use client";

import {
  Search,
  HelpCircle,
  User,
  CreditCard,
  Shield,
  MapPin,
  ChevronDown,
  ArrowRight,
  Headphones,
  MessageCircle,
  Mail,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useState } from "react";

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
  visible: { transition: { staggerChildren: 0.08 } },
};

const categories = [
  {
    icon: User,
    title: "Account",
    description: "Registration, verification, profile, and account settings.",
  },
  {
    icon: Wallet,
    title: "Payments",
    description: "Sending money, receiving funds, transaction history, and limits.",
  },
  {
    icon: CreditCard,
    title: "K-Card",
    description: "Virtual and physical card issuance, activation, and management.",
  },
  {
    icon: Shield,
    title: "Security",
    description: "PIN management, two-factor authentication, and fraud protection.",
  },
  {
    icon: MapPin,
    title: "K-Agents",
    description: "Finding agents, cash-in/cash-out, and agent services.",
  },
];

const faqItems = [
  {
    question: "How do I create a KobKlein account?",
    answer:
      "Download the KobKlein app from the App Store or Google Play. Tap 'Create Account,' enter your phone number, and complete the identity verification process. You will need a valid government-issued ID and a selfie for KYC verification.",
  },
  {
    question: "What are the transaction limits?",
    answer:
      "Basic verified accounts can send up to 50,000 HTG per transaction and 250,000 HTG per month. Fully verified accounts with enhanced KYC have higher limits of up to 500,000 HTG per transaction. Business accounts have custom limits based on your activity profile.",
  },
  {
    question: "How do I send money to someone in Haiti from abroad?",
    answer:
      "Open the app and tap 'Send Money.' Select the recipient's country (Haiti) and enter their KobKlein phone number or scan their QR code. Enter the amount, review the exchange rate and fees, then confirm with your PIN or biometric authentication.",
  },
  {
    question: "How do I activate my K-Card?",
    answer:
      "Once your physical K-Card arrives, open the KobKlein app, go to 'K-Card' section, and tap 'Activate Card.' Enter the 16-digit card number and the activation code from the mailer. Set your PIN and your card is ready to use at any Visa-accepting merchant.",
  },
  {
    question: "What should I do if I suspect unauthorized activity?",
    answer:
      "Immediately freeze your account by going to Settings > Security > Freeze Account in the app. Then contact our 24/7 support team. You can also lock your K-Card independently from the card management screen. We will investigate and reverse any unauthorized transactions.",
  },
  {
    question: "How do I find a K-Agent near me?",
    answer:
      "Open the app and tap 'K-Agents' on the home screen. The map will show all active K-Agents in your area. You can filter by services offered (cash-in, cash-out, bill payment) and see their operating hours and real-time availability status.",
  },
  {
    question: "What fees does KobKlein charge?",
    answer:
      "KobKlein-to-KobKlein transfers within Haiti are free. International remittances have a transparent flat fee starting at $2.99 depending on the corridor and amount. K-Card transactions have no monthly fees. Cash-out at K-Agents may have a small service fee displayed before you confirm.",
  },
  {
    question: "Can I use KobKlein for business payments?",
    answer:
      "Yes. KobKlein offers business accounts with features like bulk payments, payroll distribution, invoice generation, and payment acceptance via QR code. Apply for a business account in the app under Settings > Upgrade to Business.",
  },
  {
    question: "How long do international transfers take?",
    answer:
      "Most international transfers to Haiti are completed within minutes. Transfers from supported corridors (US, Canada, France, Dominican Republic) are typically instant. Some transfers may take up to 24 hours depending on compliance checks and the originating bank.",
  },
  {
    question: "What do I do if I forget my PIN?",
    answer:
      "Go to Settings > Security > Reset PIN in the app. You will need to verify your identity using biometric authentication or by answering your security questions. A new PIN setup screen will appear. For additional help, contact our support team.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card-sovereign overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="text-kob-text font-medium pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-5 w-5 text-kob-gold" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 text-kob-body text-sm leading-relaxed border-t border-white/5 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpPage() {
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
            <HelpCircle className="h-4 w-4" />
            Help Center
          </motion.div>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text leading-[1.1] tracking-tight"
          >
            How Can We{" "}
            <span className="gradient-gold-text">Help?</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-6 text-xl text-kob-body max-w-2xl mx-auto"
          >
            Find answers to common questions or reach out to our support team
            for personalized assistance.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-10 max-w-2xl mx-auto"
          >
            <div className="glass-sovereign rounded-2xl flex items-center gap-3 px-6 py-4">
              <Search className="h-5 w-5 text-kob-muted flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for answers..."
                className="bg-transparent w-full text-kob-text placeholder:text-kob-muted focus:outline-none text-lg"
                readOnly
              />
            </div>
          </motion.div>
        </div>
        <div className="divider-gold" />
      </section>

      {/* Categories */}
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
              Browse by <span className="gradient-gold-text">Category</span>
            </h2>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6"
          >
            {categories.map((cat, i) => (
              <motion.a
                key={cat.title}
                href="#"
                variants={fadeUp}
                custom={i}
                className="card-sovereign shimmer-gold p-6 text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-kob-gold/10 flex items-center justify-center mx-auto mb-4">
                  <cat.icon className="h-7 w-7 text-kob-gold" />
                </div>
                <h3 className="font-serif-luxury text-lg font-semibold text-kob-text mb-2 group-hover:text-kob-gold transition-colors">
                  {cat.title}
                </h3>
                <p className="text-kob-muted text-xs leading-relaxed">
                  {cat.description}
                </p>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Popular Questions */}
      <section className="bg-kob-black py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text">
              Frequently Asked{" "}
              <span className="gradient-gold-text">Questions</span>
            </h2>
            <p className="mt-4 text-kob-body max-w-xl mx-auto">
              Quick answers to the questions we hear most often.
            </p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {faqItems.map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <FaqItem question={item.question} answer={item.answer} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Support CTA */}
      <section className="bg-kob-navy py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-4">
              Still Need <span className="gradient-gold-text">Help?</span>
            </h2>
            <p className="text-kob-body max-w-xl mx-auto">
              Our support team is available 24/7 to assist you in English, French,
              and Haitian Creole.
            </p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {[
              {
                icon: MessageCircle,
                title: "Live Chat",
                description: "Chat with a support agent in real time from the app or website.",
                cta: "Start Chat",
              },
              {
                icon: Mail,
                title: "Email Support",
                description: "Send us a detailed message and we will respond within 2 hours.",
                cta: "Send Email",
              },
              {
                icon: Headphones,
                title: "Phone Support",
                description: "Speak directly with a support specialist at +509 2813 XXXX.",
                cta: "Call Now",
              },
            ].map((channel, i) => (
              <motion.div
                key={channel.title}
                variants={fadeUp}
                custom={i}
                className="card-sovereign shimmer-gold p-8 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-kob-gold/10 flex items-center justify-center mx-auto mb-5">
                  <channel.icon className="h-7 w-7 text-kob-gold" />
                </div>
                <h3 className="font-serif-luxury text-xl font-semibold text-kob-text mb-2">
                  {channel.title}
                </h3>
                <p className="text-kob-muted text-sm leading-relaxed mb-5">
                  {channel.description}
                </p>
                <a
                  href="#"
                  className="btn-gold inline-flex items-center gap-2 px-6 py-3 text-sm"
                >
                  {channel.cta}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
