import {
  Heart,
  Lightbulb,
  Lock,
  Users,
  Globe,
  TrendingUp,
  ArrowRight,
  Target,
  Rocket,
  Calendar,
  MapPin,
  Banknote,
} from "lucide-react";

const coreValues = [
  {
    Icon: Heart,
    title: "Trust",
    description:
      "We build trust through transparency, regulatory compliance, and unwavering commitment to safeguarding every gourde and dollar entrusted to us.",
  },
  {
    Icon: Users,
    title: "Accessibility",
    description:
      "Financial services should reach every Haitian, whether in Port-au-Prince or the most remote rural commune. We design for inclusion first.",
  },
  {
    Icon: Lock,
    title: "Security",
    description:
      "Bank-grade encryption, biometric authentication, and real-time fraud detection ensure your money is protected at every step.",
  },
  {
    Icon: Lightbulb,
    title: "Innovation",
    description:
      "We harness cutting-edge fintech to leapfrog legacy banking infrastructure, bringing world-class financial tools to Haiti and the diaspora.",
  },
];

const impactNumbers = [
  { value: "250K+", label: "Users Served", Icon: Users },
  { value: "$180M+", label: "Transactions Processed", Icon: Banknote },
  { value: "12", label: "Countries Connected", Icon: Globe },
  { value: "99.97%", label: "Platform Uptime", Icon: TrendingUp },
];

const timeline = [
  {
    year: "2023",
    title: "Founded",
    description:
      "KobKlein was founded in Virginia Beach with a mission to democratize financial access for every Haitian.",
    Icon: Calendar,
  },
  {
    year: "2024",
    title: "Launch",
    description:
      "Public launch of the KobKlein digital wallet across Haiti, with diaspora remittance corridors to the US and Canada.",
    Icon: Rocket,
  },
  {
    year: "2025",
    title: "Expansion",
    description:
      "Expanding across the Caribbean and strengthening diaspora corridors to Europe, enabling seamless cross-border payments.",
    Icon: MapPin,
  },
];

export default async function MissionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(201,168,76,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-kob-gold/25 bg-kob-gold/5 text-sm text-kob-gold mb-8">
            <Target className="h-4 w-4" />
            Our Purpose
          </div>
          <h1 className="font-serif-luxury text-3xl md:text-5xl lg:text-6xl font-bold text-kob-text mb-6 leading-tight">
            Our Mission &mdash;{" "}
            <span className="gradient-gold-text">
              Empowering Haiti&apos;s Financial Future
            </span>
          </h1>
          <p className="text-lg md:text-xl text-kob-muted max-w-3xl mx-auto leading-relaxed">
            KobKlein exists to bridge the gap between Haiti&apos;s vibrant
            economy and the modern financial infrastructure its people deserve.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 divider-gold" />
      </section>

      {/* Mission Statement */}
      <section className="py-24 bg-kob-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-sovereign p-10 md:p-14 text-center">
            <h2 className="font-serif-luxury text-2xl md:text-3xl font-bold text-kob-text mb-6">
              Financial Inclusion for Every Haitian
            </h2>
            <p className="text-kob-body leading-relaxed text-lg mb-6">
              Over 60% of Haiti&apos;s population remains unbanked, excluded
              from the formal financial system that most of the world takes for
              granted. KobKlein was built to change that. We provide a secure,
              accessible digital wallet that empowers individuals, families, and
              small businesses to send, receive, save, and grow their money
              &mdash; all from a smartphone.
            </p>
            <p className="text-kob-muted leading-relaxed">
              By combining mobile-first design with regulatory compliance and
              deep local expertise, we are building the financial rails that
              connect Haiti to the global economy. No brick-and-mortar branch
              required. No minimum balance. No barriers.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-kob-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif-luxury text-2xl md:text-4xl font-bold text-kob-text mb-4">
              Our Core Values
            </h2>
            <p className="text-kob-muted text-lg max-w-2xl mx-auto">
              Every decision we make is guided by these four principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="text-center card-sovereign shimmer-gold p-8"
              >
                <div className="w-14 h-14 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-5">
                  <Icon className="h-7 w-7 text-kob-gold" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-kob-text">
                  {title}
                </h3>
                <p className="text-sm text-kob-muted leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-24 bg-kob-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif-luxury text-2xl md:text-4xl font-bold text-kob-text mb-6">
                Our Vision for{" "}
                <span className="gradient-gold-text">Tomorrow</span>
              </h2>
              <p className="text-kob-body leading-relaxed mb-6">
                We envision a Caribbean connected by seamless financial
                infrastructure &mdash; where sending money from Miami to
                Port-au-Prince is as simple as sending a text message, and where
                every Haitian entrepreneur has access to the capital they need to
                build their future.
              </p>
              <p className="text-kob-muted leading-relaxed mb-8">
                KobKlein is expanding beyond Haiti to serve the broader
                Caribbean community and its global diaspora. By building
                corridors between Haiti, the Dominican Republic, Jamaica, and
                diaspora hubs in the United States, Canada, and Europe, we are
                creating an interconnected financial ecosystem that keeps
                families and businesses connected across borders.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-kob-gold/20 bg-kob-gold/5 text-sm text-kob-gold">
                  <Globe className="h-3.5 w-3.5" /> Caribbean Expansion
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-kob-gold/20 bg-kob-gold/5 text-sm text-kob-gold">
                  <Users className="h-3.5 w-3.5" /> Diaspora Corridors
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-kob-gold/20 bg-kob-gold/5 text-sm text-kob-gold">
                  <TrendingUp className="h-3.5 w-3.5" /> Merchant Services
                </span>
              </div>
            </div>
            <div className="card-sovereign p-10 text-center">
              <Globe className="h-20 w-20 text-kob-gold/30 mx-auto mb-6" />
              <h3 className="font-serif-luxury text-xl font-bold text-kob-gold-light mb-3">
                Connecting the Caribbean
              </h3>
              <p className="text-kob-muted text-sm leading-relaxed">
                From Port-au-Prince to Brooklyn, from Cap-Ha&iuml;tien to
                Montr&eacute;al &mdash; KobKlein is building the bridges that
                unite Haitian communities worldwide through modern financial
                technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Numbers */}
      <section className="py-24 bg-kob-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif-luxury text-2xl md:text-4xl font-bold text-kob-text mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-kob-muted text-lg max-w-2xl mx-auto">
              Real results for real people across Haiti and the diaspora.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {impactNumbers.map(({ value, label, Icon }) => (
              <div key={label} className="text-center card-sovereign p-8">
                <div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-kob-gold" />
                </div>
                <div className="text-3xl md:text-4xl font-bold gradient-gold-text font-serif-luxury">
                  {value}
                </div>
                <div className="text-sm text-kob-muted mt-2">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-kob-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif-luxury text-2xl md:text-4xl font-bold text-kob-text mb-4">
              Our Journey
            </h2>
            <p className="text-kob-muted text-lg max-w-2xl mx-auto">
              Building Haiti&apos;s financial future, one milestone at a time.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-kob-gold/20 hidden md:block" />

            <div className="space-y-12">
              {timeline.map(({ year, title, description, Icon }) => (
                <div key={year} className="flex gap-6 items-start">
                  <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-full bg-kob-gold/10 border-2 border-kob-gold/30 items-center justify-center relative z-10">
                    <Icon className="h-6 w-6 text-kob-gold" />
                  </div>
                  <div className="card-sovereign p-8 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-bold text-kob-gold bg-kob-gold/10 px-3 py-1 rounded-full">
                        {year}
                      </span>
                      <h3 className="font-serif-luxury text-xl font-bold text-kob-text">
                        {title}
                      </h3>
                    </div>
                    <p className="text-kob-muted leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-kob-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card-sovereign p-12 md:p-16">
            <h2 className="font-serif-luxury text-2xl md:text-4xl font-bold text-kob-text mb-6">
              Join the{" "}
              <span className="gradient-gold-text">Financial Revolution</span>
            </h2>
            <p className="text-kob-muted text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              Be part of the movement that is transforming financial access for
              millions of Haitians at home and abroad. Download KobKlein today
              and experience the future of money.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#download"
                className="btn-gold px-8 py-4 text-lg flex items-center justify-center gap-2 shadow-lg shadow-kob-gold/20"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="/about"
                className="inline-flex items-center justify-center px-8 py-4 text-lg rounded-xl border border-kob-gold/25 text-kob-gold hover:bg-kob-gold/5 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
