import {
  Globe,
  Heart,
  Clock,
  DollarSign,
  ArrowRight,
  Users,
  Smartphone,
  Send,
  Star,
  Shield,
  Repeat,
  CalendarClock,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import Link from "next/link";

const feeComparison = [
  { provider: "Western Union", fee: "$12.00", speed: "1-3 days", rate: "Poor" },
  { provider: "MoneyGram", fee: "$9.99", speed: "1-2 days", rate: "Average" },
  { provider: "Remitly", fee: "$3.99", speed: "3-5 days", rate: "Average" },
  { provider: "KobKlein", fee: "$1.99", speed: "Instant", rate: "Best", highlight: true },
];

const features = [
  {
    Icon: Users,
    title: "K-Link Family Panel",
    description:
      "Add family members to your panel with emoji avatars, favorites, and one-tap quick send. See who needs support at a glance.",
  },
  {
    Icon: Repeat,
    title: "Recurring Transfers",
    description:
      "Set up weekly, biweekly, or monthly scheduled transfers. Your family receives consistent support without you lifting a finger.",
  },
  {
    Icon: Clock,
    title: "Instant Delivery",
    description:
      "Money arrives in seconds, not days. Your family can use the funds immediately via their KobKlein wallet or cash out at any K-Agent.",
  },
  {
    Icon: Shield,
    title: "Bank-Grade Security",
    description:
      "Every transfer is protected by AES-256 encryption, real-time risk scoring, and OTP verification for high-value transactions.",
  },
  {
    Icon: DollarSign,
    title: "Best FX Rates",
    description:
      "Competitive real-time USD/HTG, CAD/HTG, and EUR/HTG exchange rates. See exactly what your family receives before you send.",
  },
  {
    Icon: CalendarClock,
    title: "Transaction History",
    description:
      "Full audit trail of every transfer. Track delivery status, view receipts, and manage your sending history in one place.",
  },
];

const steps = [
  {
    number: "01",
    title: "Download KobKlein",
    description: "Free on iOS and Android. Create your account in under 2 minutes with just your phone number.",
    Icon: Smartphone,
  },
  {
    number: "02",
    title: "Add Your Family",
    description: "Build your K-Link family panel. Add parents, siblings, children — anyone you support back home.",
    Icon: Heart,
  },
  {
    number: "03",
    title: "Send Money Home",
    description: "Tap send, enter the amount, confirm. Your family receives it instantly in their KobKlein wallet.",
    Icon: Send,
  },
];

const testimonials = [
  {
    name: "Marie J.",
    location: "Miami, FL",
    text: "I used to pay $12 every time I sent money home through Western Union. Now I send money to my mother every week for $1.99. She gets it instantly.",
  },
  {
    name: "Jean-Pierre D.",
    location: "Montreal, QC",
    text: "The recurring transfer feature changed everything. My parents receive support every month without me having to remember. It just works.",
  },
  {
    name: "Sophie L.",
    location: "Paris, France",
    text: "The K-Link family panel lets me see all my family in one place. I can send to my sister, my aunt, my cousins — all with one tap.",
  },
];

const diasporaCities = [
  "Miami", "New York", "Boston", "Montreal", "Paris", "Brooklyn",
  "Fort Lauderdale", "Newark", "Chicago", "Orlando",
];

export default async function DiasporaPage({
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,167,86,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-kob-gold/10 text-kob-gold border border-kob-gold/20 mb-6">
            For the Haitian Diaspora
          </span>
          <h1 className="font-serif-luxury text-4xl md:text-6xl font-bold text-kob-text mb-4">
            Send Money Home. <span className="gradient-gold-text">Instantly.</span>
          </h1>
          <p className="text-lg text-kob-muted max-w-2xl mx-auto mb-8">
            The fastest, cheapest way to support your family in Haiti. $1.99 flat fee.
            Instant delivery. Best exchange rates.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href={`/${loc}/app`}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-kob-gold text-kob-black font-semibold hover:bg-kob-gold-light transition-all duration-200"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${loc}/fx-calculator`}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/10 text-kob-body hover:border-kob-gold/30 hover:text-kob-gold transition-all duration-200"
            >
              Check Exchange Rates
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">
              Sending Money Home Shouldn&apos;t Cost a Fortune
            </h2>
            <p className="text-kob-muted max-w-2xl mx-auto">
              The Haitian diaspora sends over $4 billion in remittances annually. Legacy services
              charge excessive fees and take days to deliver. KobKlein changes everything.
            </p>
          </div>

          {/* Fee Comparison Table */}
          <div className="card-sovereign overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-6 py-4 text-kob-muted font-medium">Provider</th>
                    <th className="text-left px-6 py-4 text-kob-muted font-medium">Fee (US → Haiti, $200)</th>
                    <th className="text-left px-6 py-4 text-kob-muted font-medium">Speed</th>
                    <th className="text-left px-6 py-4 text-kob-muted font-medium">FX Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {feeComparison.map((row) => (
                    <tr
                      key={row.provider}
                      className={`border-b border-white/[0.04] ${
                        row.highlight ? "bg-kob-gold/5" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className={row.highlight ? "font-semibold text-kob-gold" : "text-kob-text"}>
                          {row.provider}
                        </span>
                        {row.highlight && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-kob-emerald inline ml-2" />
                        )}
                      </td>
                      <td className={`px-6 py-4 ${row.highlight ? "text-kob-gold font-semibold" : "text-kob-body"}`}>
                        {row.fee}
                      </td>
                      <td className={`px-6 py-4 ${row.highlight ? "text-kob-gold font-semibold" : "text-kob-body"}`}>
                        {row.speed}
                      </td>
                      <td className={`px-6 py-4 ${row.highlight ? "text-kob-gold font-semibold" : "text-kob-body"}`}>
                        {row.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">
              Built for <span className="gradient-gold-text">Diaspora Families</span>
            </h2>
            <p className="text-kob-muted">
              Every feature designed to make supporting your family easier
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-sovereign p-6">
                <div className="w-10 h-10 rounded-lg bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-4">
                  <f.Icon className="h-5 w-5 text-kob-gold" />
                </div>
                <h3 className="text-sm font-semibold text-kob-text mb-2">{f.title}</h3>
                <p className="text-xs text-kob-muted leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">
              Send Money in 3 Simple Steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="card-sovereign shimmer-gold p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-4">
                  <step.Icon className="h-5 w-5 text-kob-gold" />
                </div>
                <span className="text-xs font-medium text-kob-gold">STEP {step.number}</span>
                <h3 className="text-base font-semibold text-kob-text mt-2 mb-2">{step.title}</h3>
                <p className="text-xs text-kob-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-3xl font-bold text-center text-kob-text mb-12">
            Voices from the Diaspora
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card-sovereign p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-kob-gold text-kob-gold" />
                  ))}
                </div>
                <p className="text-sm text-kob-body leading-relaxed mb-4">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="text-sm">
                  <span className="font-semibold text-kob-text">{t.name}</span>
                  <span className="text-kob-muted ml-2">{t.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diaspora Cities */}
      <section className="py-16 bg-kob-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Globe className="h-8 w-8 text-kob-gold/40 mx-auto mb-4" />
          <h2 className="font-serif-luxury text-xl font-bold text-kob-text mb-6">
            Serving Haitians Everywhere
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {diasporaCities.map((city) => (
              <div
                key={city}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/[0.06] text-sm text-kob-muted"
              >
                <MapPin className="h-3 w-3 text-kob-gold/60" />
                {city}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">
            Your Family Is Waiting
          </h2>
          <p className="text-kob-muted mb-8">
            Join thousands of diaspora members who already send money home with KobKlein.
            $1.99 flat fee. Instant delivery. Best rates.
          </p>
          <Link
            href={`/${loc}/app`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-kob-gold text-kob-black font-semibold text-lg hover:bg-kob-gold-light transition-all duration-200"
          >
            Start Sending Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
