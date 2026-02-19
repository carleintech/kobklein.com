import {
  Building2,
  Globe,
  Lock,
  Shield,
  TrendingUp,
  Users,
  Banknote,
  Server,
  Handshake,
  ArrowRight,
  Mail,
  BarChart3,
  Landmark,
} from "lucide-react";
import Link from "next/link";

const platformStats = [
  { value: "100K+", label: "Active Users", Icon: Users },
  { value: "$50M+", label: "Transaction Volume", Icon: Banknote },
  { value: "15+", label: "Countries Served", Icon: Globe },
  { value: "99.9%", label: "Platform Uptime", Icon: TrendingUp },
];

const technologyHighlights = [
  {
    Icon: Lock,
    title: "Bank-Grade Encryption",
    description:
      "AES-256 encryption at rest, TLS 1.3 in transit. All sensitive data encrypted with hardware security modules (HSMs).",
  },
  {
    Icon: BarChart3,
    title: "Double-Entry Ledger",
    description:
      "GAAP-compliant double-entry accounting system ensuring every transaction is balanced and auditable in real-time.",
  },
  {
    Icon: Shield,
    title: "Real-Time Risk Engine",
    description:
      "6-rule risk scoring system with velocity checks, pattern analysis, and automated account freezing for suspicious activity.",
  },
  {
    Icon: Server,
    title: "High-Availability Infrastructure",
    description:
      "Multi-region deployment with automatic failover, horizontal scaling, and 99.9% uptime SLA for mission-critical operations.",
  },
];

const partnerships = [
  {
    title: "Banking Partners",
    description:
      "Correspondent banking relationships for cross-border settlement, multi-currency treasury operations, and regulatory-compliant fund custody.",
    Icon: Landmark,
  },
  {
    title: "Payment Network Integration",
    description:
      "Visa card issuance partnerships for K-Card, real-time payment rail integrations, and interoperability with existing financial infrastructure.",
    Icon: Globe,
  },
  {
    title: "API & Technology Partners",
    description:
      "RESTful API access for enterprise integrations, webhook-based event systems, and white-label solutions for financial institutions.",
    Icon: Server,
  },
  {
    title: "Distribution Network",
    description:
      "K-Agent distributor partnerships across Haiti for cash-in/cash-out operations, with float management and commission structures.",
    Icon: Handshake,
  },
];

export default async function InstitutionalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = locale || "en";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          <Building2 className="h-10 w-10 text-kob-gold mx-auto mb-4" />
          <h1 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
            Institutional Overview
          </h1>
          <p className="text-lg text-kob-muted max-w-2xl mx-auto">
            A comprehensive look at KobKlein for banking partners, regulators, and institutional
            stakeholders.
          </p>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-sovereign p-8 md:p-10">
            <h2 className="font-serif-luxury text-2xl font-bold text-kob-text mb-4">
              Platform Overview
            </h2>
            <div className="space-y-4 text-sm text-kob-body leading-relaxed">
              <p>
                KobKlein is a regulated digital financial platform serving Haiti and the Haitian
                diaspora across 15+ countries. The platform provides digital wallet services,
                instant peer-to-peer transfers (K-Pay), cross-border remittances (K-Link),
                virtual card issuance (K-Card), merchant payment acceptance, and a physical
                cash-in/cash-out distributor network (K-Agent).
              </p>
              <p>
                Founded in Virginia Beach, Virginia, KobKlein is licensed and registered across multiple
                jurisdictions including Haiti (BRH), the United States (FinCEN), Canada (FINTRAC),
                and the European Union (PSD2). The platform processes multi-currency transactions
                with a focus on USD/HTG corridors and serves both retail and business customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 bg-kob-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-2xl font-bold text-kob-text text-center mb-10">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {platformStats.map((s) => (
              <div key={s.label} className="text-center card-sovereign p-6">
                <s.Icon className="h-6 w-6 text-kob-gold/60 mx-auto mb-3" />
                <div className="text-2xl font-bold gradient-gold-text font-serif-luxury">
                  {s.value}
                </div>
                <div className="text-xs text-kob-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif-luxury text-2xl font-bold text-kob-text mb-2">
              Technology Infrastructure
            </h2>
            <p className="text-sm text-kob-muted">
              Enterprise-grade technology built for financial services
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {technologyHighlights.map((t) => (
              <div key={t.title} className="card-sovereign p-6">
                <div className="w-10 h-10 rounded-lg bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-4">
                  <t.Icon className="h-5 w-5 text-kob-gold" />
                </div>
                <h3 className="text-sm font-semibold text-kob-text mb-2">{t.title}</h3>
                <p className="text-xs text-kob-muted leading-relaxed">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regulatory Compliance */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-sovereign p-8 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-6 w-6 text-kob-gold" />
              <h2 className="font-serif-luxury text-2xl font-bold text-kob-text">
                Regulatory Compliance
              </h2>
            </div>
            <div className="space-y-4 text-sm text-kob-body leading-relaxed">
              <p>
                KobKlein maintains a comprehensive compliance program covering AML/CFT, KYC, sanctions
                screening, and transaction monitoring across all operating jurisdictions. Our compliance
                framework is designed to meet or exceed regulatory requirements in each market.
              </p>
              <p>
                Key compliance achievements include 5/5 regulatory examinations passed, 98.5% overall
                compliance score, clean audit results with no material findings, and zero regulatory
                enforcement actions.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {["PCI DSS", "SOC 2", "AML/CFT", "GDPR", "BRH", "FinCEN", "FINTRAC"].map(
                (badge) => (
                  <div
                    key={badge}
                    className="px-3 py-1.5 rounded border border-kob-gold/20 bg-kob-gold/5"
                  >
                    <span className="text-[10px] font-bold text-kob-gold tracking-wider">
                      {badge}
                    </span>
                  </div>
                )
              )}
            </div>
            <div className="mt-6">
              <Link
                href={`/${loc}/compliance`}
                className="inline-flex items-center gap-1.5 text-sm text-kob-gold hover:underline"
              >
                View full compliance details
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Opportunities */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif-luxury text-2xl font-bold text-kob-text mb-2">
              Partnership Opportunities
            </h2>
            <p className="text-sm text-kob-muted">
              Collaborate with KobKlein to serve Haiti&apos;s growing digital economy
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partnerships.map((p) => (
              <div key={p.title} className="card-sovereign shimmer-gold p-6">
                <div className="w-10 h-10 rounded-lg bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-4">
                  <p.Icon className="h-5 w-5 text-kob-gold" />
                </div>
                <h3 className="text-sm font-semibold text-kob-text mb-2">{p.title}</h3>
                <p className="text-xs text-kob-muted leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-kob-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Mail className="h-8 w-8 text-kob-gold/40 mx-auto mb-4" />
          <h2 className="font-serif-luxury text-xl font-bold text-kob-text mb-2">
            Institutional Inquiries
          </h2>
          <p className="text-sm text-kob-muted mb-6">
            For partnership discussions, regulatory inquiries, or institutional due diligence
          </p>
          <a
            href="mailto:institutional@kobklein.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-kob-gold text-kob-black font-semibold hover:bg-kob-gold-light transition-all duration-200 text-sm"
          >
            institutional@kobklein.com
          </a>
        </div>
      </section>
    </>
  );
}
