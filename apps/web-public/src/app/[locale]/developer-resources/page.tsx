"use client";

import {
  Code2,
  Webhook,
  Box,
  FlaskConical,
  ArrowRight,
  Terminal,
  BookOpen,
  Headphones,
  Layers,
  Shield,
  Zap,
  Copy,
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

const apiFeatures = [
  {
    icon: Code2,
    title: "REST API",
    description:
      "Full-featured RESTful API with predictable resource-oriented URLs, JSON request/response bodies, and standard HTTP status codes.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description:
      "Real-time event notifications for transactions, account updates, and compliance events delivered to your endpoint with retry logic.",
  },
  {
    icon: Box,
    title: "SDKs",
    description:
      "Official client libraries for Node.js, Python, PHP, and Java. Get started in minutes with idiomatic wrappers around every API endpoint.",
  },
  {
    icon: FlaskConical,
    title: "Sandbox Environment",
    description:
      "Fully isolated test environment with simulated transactions, test credentials, and mock data so you can build confidently before going live.",
  },
];

const integrationSteps = [
  {
    step: "01",
    title: "Create Your Developer Account",
    description:
      "Sign up at developers.kobklein.com and obtain your API keys. You will receive both test and production key pairs.",
  },
  {
    step: "02",
    title: "Explore the Sandbox",
    description:
      "Use your test keys to make API calls against our sandbox. Simulate deposits, transfers, and K-Card payments with zero risk.",
  },
  {
    step: "03",
    title: "Build Your Integration",
    description:
      "Use our SDKs or call the REST API directly. Configure webhooks to receive real-time updates about transaction states.",
  },
  {
    step: "04",
    title: "Go Live",
    description:
      "Submit your integration for review. Once approved, swap test keys for production keys and start processing real transactions.",
  },
];

const curlExample = `curl -X POST https://api.kobklein.com/v1/transfers \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "HTG",
    "recipient": "+509 3456 7890",
    "description": "Invoice #1042"
  }'`;

export default function DeveloperResourcesPage() {
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
            <Terminal className="h-4 w-4" />
            Developer Platform
          </motion.div>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text leading-[1.1] tracking-tight"
          >
            Build with{" "}
            <span className="gradient-gold-text">KobKlein</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-6 text-xl text-kob-body max-w-2xl mx-auto"
          >
            Integrate payments, transfers, and financial services into your
            application with our powerful API and developer tools.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="#docs"
              className="btn-gold px-8 py-4 text-lg flex items-center gap-2 justify-center"
            >
              <BookOpen className="h-5 w-5" />
              Read the Docs
            </a>
            <a
              href="#sandbox"
              className="btn-outline-gold px-8 py-4 text-lg flex items-center gap-2 justify-center"
            >
              <FlaskConical className="h-5 w-5" />
              Try Sandbox
            </a>
          </motion.div>
        </div>
        <div className="divider-gold" />
      </section>

      {/* API Features */}
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
              Everything You Need to{" "}
              <span className="gradient-gold-text">Integrate</span>
            </h2>
            <p className="mt-4 text-kob-body max-w-2xl mx-auto">
              Our developer platform provides comprehensive tools for building
              financial applications on the KobKlein infrastructure.
            </p>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {apiFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                className="card-sovereign shimmer-gold p-8"
              >
                <div className="w-12 h-12 rounded-xl bg-kob-gold/10 flex items-center justify-center mb-5">
                  <feature.icon className="h-6 w-6 text-kob-gold" />
                </div>
                <h3 className="font-serif-luxury text-xl font-semibold text-kob-text mb-3">
                  {feature.title}
                </h3>
                <p className="text-kob-body text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Code Sample */}
      <section className="bg-kob-black py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
            >
              <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-6">
                Simple, Powerful{" "}
                <span className="gradient-gold-text">API</span>
              </h2>
              <p className="text-kob-body mb-6 leading-relaxed">
                Send money, check balances, issue K-Cards, and manage accounts
                with clean, well-documented endpoints. Every response is
                consistent JSON with clear error codes.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Shield, text: "Authenticated with API keys and OAuth 2.0" },
                  { icon: Zap, text: "Average response time under 200ms" },
                  { icon: Layers, text: "Versioned API with backward compatibility" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-kob-body">
                    <item.icon className="h-5 w-5 text-kob-gold flex-shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              className="relative"
            >
              <div className="card-sovereign overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2 text-kob-muted text-sm">
                    <Terminal className="h-4 w-4" />
                    cURL
                  </div>
                  <button className="flex items-center gap-1.5 text-xs text-kob-gold hover:text-kob-gold-light transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
                <pre className="p-5 text-sm text-kob-body overflow-x-auto leading-relaxed">
                  <code>{curlExample}</code>
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Integration Steps */}
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
              Get Started in{" "}
              <span className="gradient-gold-text">4 Steps</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {integrationSteps.map((step, i) => (
              <motion.div
                key={step.step}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="relative"
              >
                <div className="text-5xl font-serif-luxury font-bold text-kob-gold/15 mb-3">
                  {step.step}
                </div>
                <h3 className="font-serif-luxury text-lg font-semibold text-kob-text mb-2">
                  {step.title}
                </h3>
                <p className="text-kob-body text-sm leading-relaxed">
                  {step.description}
                </p>
                {i < integrationSteps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-8 -right-4 h-5 w-5 text-kob-gold/30" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Links */}
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
              <span className="gradient-gold-text">Documentation</span> &amp; Resources
            </h2>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: BookOpen, title: "API Reference", desc: "Complete endpoint documentation with request/response examples." },
              { icon: Box, title: "SDK Guides", desc: "Step-by-step setup guides for Node.js, Python, PHP, and Java." },
              { icon: Webhook, title: "Webhook Events", desc: "Full list of events, payload schemas, and retry policies." },
              { icon: Shield, title: "Security Best Practices", desc: "Key rotation, IP whitelisting, and PCI compliance guidance." },
              { icon: FlaskConical, title: "Sandbox Recipes", desc: "Pre-built test scenarios for common integration patterns." },
              { icon: Layers, title: "Changelog", desc: "Track API versions, deprecations, and new feature releases." },
            ].map((item, i) => (
              <motion.a
                key={item.title}
                href="#"
                variants={fadeUp}
                custom={i}
                className="card-sovereign shimmer-gold p-6 flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-lg bg-kob-gold/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-kob-gold" />
                </div>
                <div>
                  <h3 className="text-kob-text font-semibold mb-1 group-hover:text-kob-gold transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-kob-muted text-sm">{item.desc}</p>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Developer Support CTA */}
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
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(198,167,86,0.06),transparent)]" />
            <div className="relative z-10">
              <Headphones className="h-12 w-12 text-kob-gold mx-auto mb-6" />
              <h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-4">
                Need Help with Your Integration?
              </h2>
              <p className="text-kob-body max-w-xl mx-auto mb-8">
                Our developer relations team is here to help. Get priority
                support, architecture reviews, and dedicated onboarding
                assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="#"
                  className="btn-gold px-8 py-4 text-lg flex items-center gap-2 justify-center"
                >
                  Contact Developer Support
                  <ArrowRight className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="btn-outline-gold px-8 py-4 text-lg flex items-center gap-2 justify-center"
                >
                  Join Developer Discord
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
