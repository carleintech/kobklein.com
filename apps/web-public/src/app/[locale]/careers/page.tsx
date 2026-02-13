import { Briefcase, Heart, Lightbulb, Shield, Users, Zap, MapPin, Clock } from "lucide-react";

const values = [
  { icon: Lightbulb, title: "Innovation", description: "We build the future of finance with cutting-edge technology tailored for Haiti." },
  { icon: Heart, title: "Impact", description: "Every feature we ship directly improves lives for millions of Haitians." },
  { icon: Users, title: "Inclusion", description: "We design for everyone — banked, unbanked, urban, rural, local and diaspora." },
  { icon: Shield, title: "Integrity", description: "Transparency and trust are non-negotiable in everything we do." },
];

const positions = [
  { title: "Senior Backend Engineer", team: "Engineering", location: "Remote / Port-au-Prince", type: "Full-time" },
  { title: "Mobile Developer (React Native)", team: "Engineering", location: "Remote", type: "Full-time" },
  { title: "Compliance Officer", team: "Legal & Compliance", location: "Port-au-Prince", type: "Full-time" },
  { title: "Head of Product", team: "Product", location: "Remote / Miami", type: "Full-time" },
  { title: "UX/UI Designer", team: "Design", location: "Remote", type: "Full-time" },
  { title: "K-Agent Operations Manager", team: "Operations", location: "Port-au-Prince", type: "Full-time" },
  { title: "DevOps / Infrastructure Engineer", team: "Engineering", location: "Remote", type: "Full-time" },
  { title: "Customer Support Lead (Kreyòl/French)", team: "Support", location: "Port-au-Prince", type: "Full-time" },
];

const benefits = [
  "Competitive salary + equity",
  "Remote-first culture",
  "Health insurance",
  "Unlimited PTO",
  "Learning & development budget",
  "Annual team retreats",
  "Latest equipment provided",
  "Impact-driven mission",
];

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,167,86,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-kob-gold/20 bg-kob-gold/5 text-sm text-kob-gold mb-6">
            <Briefcase className="h-4 w-4" /> We&apos;re Hiring
          </div>
          <h1 className="font-serif-luxury text-4xl md:text-6xl font-bold text-kob-text mb-4">
            Join the <span className="gradient-gold-text">Revolution</span>
          </h1>
          <p className="text-lg text-kob-muted max-w-2xl mx-auto">
            Help us build the financial infrastructure that Haiti deserves. We&apos;re looking for passionate people who want to make a real difference.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-3xl font-bold text-center text-kob-text mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="card-sovereign p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="h-6 w-6 text-kob-gold" />
                </div>
                <h3 className="text-lg font-semibold text-kob-text mb-2">{v.title}</h3>
                <p className="text-sm text-kob-muted">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-3xl font-bold text-center text-kob-text mb-4">Open Positions</h2>
          <p className="text-center text-kob-muted mb-12">Find your role in Haiti&apos;s fintech revolution</p>
          <div className="space-y-4">
            {positions.map((pos) => (
              <div key={pos.title} className="card-sovereign p-6 flex flex-col md:flex-row md:items-center gap-4 group hover:border-kob-gold/20">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-kob-text group-hover:text-kob-gold transition-colors">{pos.title}</h3>
                  <p className="text-sm text-kob-muted">{pos.team}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-kob-muted">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {pos.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {pos.type}</span>
                </div>
                <button type="button" className="btn-outline-gold px-5 py-2 text-sm shrink-0">Apply</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-3xl font-bold text-center text-kob-text mb-12">Benefits & Perks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((b) => (
              <div key={b} className="card-sovereign p-4 text-center">
                <Zap className="h-5 w-5 text-kob-gold mx-auto mb-2" />
                <p className="text-sm font-medium text-kob-body">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-kob-black text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">Don&apos;t See Your Role?</h2>
          <p className="text-kob-muted mb-8">Send us your resume and tell us how you&apos;d contribute to Haiti&apos;s digital financial future.</p>
          <button type="button" className="btn-gold px-8 py-3 text-lg">Send Your Resume</button>
        </div>
      </section>
    </>
  );
}
