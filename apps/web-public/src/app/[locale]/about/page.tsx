import { getDictionary, type Locale } from "@/i18n";
import { CtaSection } from "@/components/sections/cta";
import {
  Heart,
  Lightbulb,
  Lock,
  Users,
  Globe,
  Banknote,
  TrendingUp,
  Building2,
  ArrowRight,
  Landmark,
  MapPin,
  Smartphone,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { value: "100K+", label: "Active Users", Icon: Users },
  { value: "$50M+", label: "Transferred", Icon: Banknote },
  { value: "15+", label: "Countries", Icon: Globe },
  { value: "99.9%", label: "Platform Uptime", Icon: TrendingUp },
];

const values = [
  {
    Icon: Heart,
    title: "Trust",
    description:
      "Transparency and accountability in every transaction. We comply with international financial regulations across all operating jurisdictions.",
  },
  {
    Icon: Users,
    title: "Accessibility",
    description:
      "Inclusive services for all Haitians — banked or unbanked, in Port-au-Prince or the most remote commune, at home or abroad in the diaspora.",
  },
  {
    Icon: Lock,
    title: "Security",
    description:
      "Bank-grade encryption, real-time risk scoring, biometric authentication, and a dedicated fraud prevention engine protect every user.",
  },
  {
    Icon: Lightbulb,
    title: "Innovation",
    description:
      "Modern digital tools tailored for Haiti\u2019s future economy — leapfrogging legacy banking with mobile-first technology.",
  },
];

const milestones = [
  {
    year: "2024",
    title: "Founded in Miami",
    description:
      "KobKlein is born from a simple idea: Haitians deserve the same digital financial tools as the rest of the world.",
    Icon: Building2,
  },
  {
    year: "2024",
    title: "Platform Launch",
    description:
      "K-Pay instant transfers, K-Agent distributor network, and the first K-Link family panels go live in Haiti.",
    Icon: Smartphone,
  },
  {
    year: "2025",
    title: "Diaspora Expansion",
    description:
      "Operations expand to serve the Haitian diaspora in the US, Canada, and France with cross-border remittances.",
    Icon: Globe,
  },
  {
    year: "2025",
    title: "K-Card & FX Engine",
    description:
      "Launch of the K-Card virtual Visa and real-time foreign exchange engine for competitive currency conversion.",
    Icon: Landmark,
  },
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const loc = locale || "en";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,167,86,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-kob-gold/10 text-kob-gold border border-kob-gold/20 mb-6">
            Our Story
          </span>
          <h1 className="font-serif-luxury text-4xl md:text-6xl font-bold text-kob-text mb-4">
            About <span className="gradient-gold-text">KobKlein</span>
          </h1>
          <p className="text-lg text-kob-muted max-w-2xl mx-auto">
            Building digital financial sovereignty for Haiti and the Haitian diaspora worldwide.
          </p>
        </div>
      </section>

      {/* Founding Story */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-6">
                Why We Built KobKlein
              </h2>
              <div className="space-y-4 text-sm text-kob-body leading-relaxed">
                <p>
                  Haiti has one of the lowest rates of financial inclusion in the Western Hemisphere.
                  Over 80% of the population remains unbanked, relying on cash for nearly every
                  transaction. Meanwhile, the Haitian diaspora sends over $4 billion in remittances
                  annually — often paying exorbitant fees to legacy transfer services.
                </p>
                <p>
                  KobKlein was founded to change this. We believe every Haitian deserves access to
                  modern, secure, and affordable digital financial tools — whether they live in
                  Port-au-Prince, Miami, Montreal, or Paris.
                </p>
                <p>
                  Our platform bridges the gap between Haiti and its global diaspora, enabling
                  instant transfers, cashless payments, and a path to true financial independence.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                {
                  icon: MapPin,
                  label: "The Problem",
                  text: "80%+ unbanked population, $12+ remittance fees, no digital payment infrastructure",
                },
                {
                  icon: Lightbulb,
                  label: "Our Solution",
                  text: "Mobile-first digital wallet with instant transfers, $1.99 remittances, K-Agent cash network",
                },
                {
                  icon: Globe,
                  label: "Our Reach",
                  text: "Serving Haiti, US, Canada, France, and 15+ countries where Haitians live and work",
                },
              ].map((item) => (
                <div key={item.label} className="card-sovereign p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-kob-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-kob-text">{item.label}</h3>
                    <p className="text-xs text-kob-muted mt-1">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-kob-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center card-sovereign p-6">
                <s.Icon className="h-6 w-6 text-kob-gold/60 mx-auto mb-3" />
                <div className="text-3xl font-bold gradient-gold-text font-serif-luxury">
                  {s.value}
                </div>
                <div className="text-sm text-kob-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">
              {dict.mission.title}
            </h2>
            <p className="text-kob-muted max-w-2xl mx-auto">
              {dict.mission.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="card-sovereign shimmer-gold p-8">
              <h3 className="text-lg font-semibold text-kob-text mb-3">Our Mission</h3>
              <p className="text-sm text-kob-body leading-relaxed">
                To empower every Haitian with digital financial tools that are secure, accessible,
                and affordable — creating a path from cash dependency to true financial sovereignty.
              </p>
            </div>
            <div className="card-sovereign shimmer-gold p-8">
              <h3 className="text-lg font-semibold text-kob-text mb-3">
                {dict.mission.vision.title}
              </h3>
              <p className="text-sm text-kob-body leading-relaxed">
                {dict.mission.vision.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">
              {dict.mission.values.title}
            </h2>
            <div className="mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="card-sovereign p-8">
                <div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-5">
                  <v.Icon className="h-6 w-6 text-kob-gold" />
                </div>
                <h3 className="text-lg font-semibold text-kob-text mb-2">{v.title}</h3>
                <p className="text-sm text-kob-muted leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">
              Our Journey
            </h2>
            <p className="text-kob-muted">Key milestones in the KobKlein story</p>
          </div>
          <div className="space-y-6">
            {milestones.map((m, i) => (
              <div key={m.title} className="card-sovereign p-6 flex gap-5">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center">
                    <m.Icon className="h-5 w-5 text-kob-gold" />
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-px flex-1 bg-kob-gold/10 mt-2" />
                  )}
                </div>
                <div className="pt-1">
                  <span className="text-xs font-medium text-kob-gold">{m.year}</span>
                  <h3 className="text-base font-semibold text-kob-text mt-1">{m.title}</h3>
                  <p className="text-sm text-kob-muted mt-1 leading-relaxed">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Preview */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">
            Meet the Team
          </h2>
          <p className="text-kob-muted mb-8 max-w-xl mx-auto">
            A passionate team of engineers, designers, and financial professionals committed to
            Haiti&apos;s digital transformation.
          </p>
          <Link
            href={`/${loc}/team`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-kob-gold/10 text-kob-gold border border-kob-gold/20 hover:bg-kob-gold/20 transition-all duration-200 text-sm font-medium"
          >
            View Our Team
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <CtaSection dict={dict} />
    </>
  );
}
