import { getDictionary, type Locale } from "@/i18n";
import {
  Shield,
  Award,
  CheckCircle2,
  FileCheck,
  Scale,
  Globe,
  Lock,
  Mail,
  Landmark,
  BadgeCheck,
} from "lucide-react";

const licenses = [
  {
    jurisdiction: "Haiti",
    body: "Banque de la R\u00e9publique d\u2019Ha\u00efti (BRH)",
    type: "Electronic Money Institution License",
    reference: "BRH Circular 117",
    Icon: Landmark,
  },
  {
    jurisdiction: "United States",
    body: "FinCEN",
    type: "Money Services Business Registration",
    reference: "MSB Registration",
    Icon: FileCheck,
  },
  {
    jurisdiction: "Canada",
    body: "FINTRAC",
    type: "Money Services Business Registration",
    reference: "FINTRAC MSB",
    Icon: BadgeCheck,
  },
  {
    jurisdiction: "European Union",
    body: "National Competent Authority",
    type: "Payment Service Directive Compliance",
    reference: "PSD2 / EMD2",
    Icon: Globe,
  },
];

const amlProcedures = [
  {
    title: "Customer Due Diligence",
    description:
      "Multi-tier KYC verification from basic phone number validation to full identity document verification, proof of address, and enhanced due diligence for high-risk profiles.",
  },
  {
    title: "Transaction Monitoring",
    description:
      "Real-time risk engine with 6 scoring rules analyzing velocity, amounts, patterns, reversals, and geographic risk. Automated alerts and account freezing at risk score 90+.",
  },
  {
    title: "Suspicious Activity Reporting",
    description:
      "Automated detection and filing of Suspicious Activity Reports (SARs) with relevant financial intelligence units. Complete audit trail for all flagged transactions.",
  },
  {
    title: "Sanctions Screening",
    description:
      "Continuous screening against OFAC SDN, UN Security Council, EU Consolidated, and other international sanctions lists. Real-time screening on all transactions.",
  },
];

export default async function CompliancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,167,86,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <Shield className="h-10 w-10 text-kob-gold mx-auto mb-4" />
          <h1 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
            {dict.compliance.title}
          </h1>
          <p className="text-lg text-kob-muted max-w-2xl mx-auto">
            {dict.compliance.subtitle}
          </p>
          <div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
        </div>
      </section>

      {/* Regulatory Framework */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-2xl font-bold text-kob-text text-center mb-10">
            Regulatory Framework
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(["financial", "data", "international", "operational"] as const).map(
              (key) => {
                const item = dict.compliance[key];
                return (
                  <div
                    key={key}
                    className="card-sovereign p-8"
                  >
                    <h3 className="text-lg font-semibold text-kob-text mb-3">
                      {item.title}
                    </h3>
                    <p className="text-sm text-kob-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* Licenses & Registrations */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif-luxury text-2xl font-bold text-kob-text mb-2">
              {dict.compliance.licensesTitle}
            </h2>
            <p className="text-sm text-kob-muted">
              Licensed and registered across all operating jurisdictions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {licenses.map((l) => (
              <div key={l.jurisdiction} className="card-sovereign p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center flex-shrink-0">
                    <l.Icon className="h-5 w-5 text-kob-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-kob-text">
                        {l.jurisdiction}
                      </h3>
                      <CheckCircle2 className="h-3.5 w-3.5 text-kob-emerald" />
                    </div>
                    <p className="text-xs text-kob-gold font-medium mb-1">{l.body}</p>
                    <p className="text-xs text-kob-muted">{l.type}</p>
                    <p className="text-xs text-kob-muted mt-1 opacity-60">{l.reference}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Metrics */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-2xl font-bold text-kob-text text-center mb-10">
            {dict.compliance.metricsTitle}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(["examinations", "score", "audit", "actions"] as const).map((key) => {
              const metric = dict.compliance.metrics[key];
              return (
                <div key={key} className="text-center card-sovereign p-6">
                  <div className="text-2xl font-bold gradient-gold-text font-serif-luxury mb-2">
                    {metric.value}
                  </div>
                  <div className="text-xs text-kob-muted">{metric.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AML/KYC Program */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif-luxury text-2xl font-bold text-kob-text mb-2">
              AML/KYC Program
            </h2>
            <p className="text-sm text-kob-muted">
              Comprehensive anti-money laundering and know-your-customer procedures
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {amlProcedures.map((proc) => (
              <div key={proc.title} className="card-sovereign p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-kob-gold" />
                  <h3 className="text-sm font-semibold text-kob-text">{proc.title}</h3>
                </div>
                <p className="text-sm text-kob-muted leading-relaxed">{proc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Badges */}
      <section className="py-16 bg-kob-navy">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-4 mb-6">
            {["PCI DSS", "SOC 2", "AML/CFT", "GDPR"].map((badge) => (
              <div
                key={badge}
                className="px-4 py-2 rounded-lg border border-kob-gold/20 bg-kob-gold/5"
              >
                <span className="text-xs font-bold text-kob-gold tracking-wider">
                  {badge}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-kob-muted">
            Compliant with international security and financial standards
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-kob-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Mail className="h-8 w-8 text-kob-gold/40 mx-auto mb-4" />
          <h2 className="font-serif-luxury text-xl font-bold text-kob-text mb-2">
            Compliance Inquiries
          </h2>
          <p className="text-sm text-kob-muted mb-4">
            For regulatory questions, audit requests, or compliance-related matters
          </p>
          <a
            href="mailto:compliance@kobklein.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kob-gold/10 text-kob-gold border border-kob-gold/20 hover:bg-kob-gold/20 transition-all duration-200 text-sm font-medium"
          >
            compliance@kobklein.com
          </a>
        </div>
      </section>
    </>
  );
}
