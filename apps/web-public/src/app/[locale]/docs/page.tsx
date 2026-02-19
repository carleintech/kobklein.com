"use client";

import {
  BookOpen,
  Code2,
  Box,
  Webhook,
  Shield,
  HelpCircle,
  Search,
  ArrowRight,
  Headphones,
  Rocket,
  CreditCard,
  Users,
  FileText,
  Globe,
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
  visible: { transition: { staggerChildren: 0.08 } },
};

const quickLinks = [
  {
    icon: Rocket,
    title: "Getting Started",
    description: "Set up your account, obtain API keys, and make your first API call in under 5 minutes.",
    href: "#",
    tag: "Start Here",
  },
  {
    icon: Code2,
    title: "API Reference",
    description: "Complete documentation for every endpoint, including request parameters and response schemas.",
    href: "#",
    tag: "Reference",
  },
  {
    icon: Box,
    title: "SDKs & Libraries",
    description: "Official client libraries for Node.js, Python, PHP, Java, and community-maintained packages.",
    href: "#",
    tag: "Libraries",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Configure event-driven integrations with real-time notifications for transactions and account events.",
    href: "#",
    tag: "Events",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Authentication methods, encryption standards, PCI compliance, and security best practices.",
    href: "#",
    tag: "Security",
  },
  {
    icon: HelpCircle,
    title: "FAQs",
    description: "Answers to common questions about rate limits, error handling, testing, and deployment.",
    href: "#",
    tag: "Support",
  },
];

const popularGuides = [
  {
    icon: CreditCard,
    title: "Accept Payments with K-Card",
    description: "Integrate K-Card virtual and physical card payments into your POS or e-commerce platform.",
    readTime: "8 min read",
  },
  {
    icon: Globe,
    title: "Diaspora Remittance Integration",
    description: "Build a remittance flow that lets users send money from the US, Canada, or France to Haiti.",
    readTime: "12 min read",
  },
  {
    icon: Users,
    title: "K-Agent Onboarding API",
    description: "Automate agent registration, KYC verification, and territory assignment via the K-Agent API.",
    readTime: "10 min read",
  },
  {
    icon: Shield,
    title: "Implementing 3D Secure",
    description: "Add an extra layer of transaction security with 3D Secure authentication for card payments.",
    readTime: "6 min read",
  },
  {
    icon: FileText,
    title: "Transaction Reconciliation",
    description: "Use the Reports API to pull settlement data, generate statements, and reconcile transactions.",
    readTime: "7 min read",
  },
  {
    icon: Webhook,
    title: "Webhook Signature Verification",
    description: "Verify webhook payloads using HMAC signatures to ensure requests originate from KobKlein.",
    readTime: "5 min read",
  },
];

export default function DocsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-kob-black gold-dust">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,168,76,0.10),transparent)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24 text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-kob-gold/25 bg-kob-gold/5 text-sm text-kob-gold mb-8"
          >
            <BookOpen className="h-4 w-4" />
            Knowledge Base
          </motion.div>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text leading-[1.1] tracking-tight"
          >
            <span className="gradient-gold-text">Documentation</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-6 text-xl text-kob-body max-w-2xl mx-auto"
          >
            Everything you need to integrate, build, and scale with the KobKlein
            platform. From quickstart guides to advanced API references.
          </motion.p>

          {/* Search Placeholder */}
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
                placeholder="Search documentation..."
                className="bg-transparent w-full text-kob-text placeholder:text-kob-muted focus:outline-none text-lg"
                readOnly
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-kob-muted">
                Ctrl K
              </kbd>
            </div>
          </motion.div>
        </div>
        <div className="divider-gold" />
      </section>

      {/* Quick Links Grid */}
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
              Explore by <span className="gradient-gold-text">Topic</span>
            </h2>
            <p className="mt-4 text-kob-body max-w-xl mx-auto">
              Jump directly to the section most relevant to your needs.
            </p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {quickLinks.map((link, i) => (
              <motion.a
                key={link.title}
                href={link.href}
                variants={fadeUp}
                custom={i}
                className="card-sovereign shimmer-gold p-8 group relative"
              >
                <div className="absolute top-4 right-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-kob-gold/10 text-kob-gold border border-kob-gold/20">
                    {link.tag}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-kob-gold/10 flex items-center justify-center mb-5">
                  <link.icon className="h-6 w-6 text-kob-gold" />
                </div>
                <h3 className="font-serif-luxury text-xl font-semibold text-kob-text mb-3 group-hover:text-kob-gold transition-colors">
                  {link.title}
                </h3>
                <p className="text-kob-body text-sm leading-relaxed">
                  {link.description}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-kob-gold text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight className="h-4 w-4" />
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Popular Guides */}
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
              Popular <span className="gradient-gold-text">Guides</span>
            </h2>
            <p className="mt-4 text-kob-body max-w-xl mx-auto">
              Step-by-step tutorials for the most common integration scenarios.
            </p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {popularGuides.map((guide, i) => (
              <motion.a
                key={guide.title}
                href="#"
                variants={fadeUp}
                custom={i}
                className="card-sovereign p-6 group flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-kob-gold/10 flex items-center justify-center">
                    <guide.icon className="h-5 w-5 text-kob-gold" />
                  </div>
                  <span className="text-xs text-kob-muted">{guide.readTime}</span>
                </div>
                <h3 className="font-semibold text-kob-text mb-2 group-hover:text-kob-gold transition-colors">
                  {guide.title}
                </h3>
                <p className="text-kob-muted text-sm leading-relaxed flex-1">
                  {guide.description}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-kob-gold text-sm font-medium">
                  Read Guide <ArrowRight className="h-4 w-4" />
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="bg-kob-navy py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="card-sovereign p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(201,168,76,0.06),transparent)]" />
            <div className="relative z-10">
              <Headphones className="h-12 w-12 text-kob-gold mx-auto mb-6" />
              <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-4">
                Can&apos;t Find What You Need?
              </h2>
              <p className="text-kob-body max-w-xl mx-auto mb-8">
                Our support team is available around the clock to help you with
                technical questions, integration challenges, or account issues.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="#"
                  className="btn-gold px-8 py-4 text-lg flex items-center gap-2 justify-center"
                >
                  Contact Support
                  <ArrowRight className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="btn-outline-gold px-8 py-4 text-lg flex items-center gap-2 justify-center"
                >
                  Community Forum
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
