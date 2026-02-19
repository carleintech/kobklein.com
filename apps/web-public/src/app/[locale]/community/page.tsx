import { Globe, Heart, MessageSquare, Star, Trophy, Users, Zap } from "lucide-react";

const stats = [
  { value: "100K+", label: "Active Users" },
  { value: "15+", label: "Countries" },
  { value: "$50M+", label: "Transferred" },
  { value: "4.8/5", label: "App Rating" },
];

const programs = [
  {
    icon: Trophy,
    title: "K-Ambassador Program",
    description: "Represent KobKlein in your community. Share the mission, earn rewards, and help your neighbors discover financial freedom.",
    badge: "Earn Rewards",
  },
  {
    icon: Users,
    title: "K-Agent Network",
    description: "Become a local cash-in/cash-out point. Bridge digital and physical money while earning commissions on every transaction.",
    badge: "Earn Commissions",
  },
  {
    icon: Zap,
    title: "Developer Community",
    description: "Build on top of the KobKlein API. Create integrations, plugins, and tools that serve the Haitian community.",
    badge: "Build & Integrate",
  },
];

const testimonials = [
  { name: "Marie J.", location: "Miami, FL", text: "KobKlein changed how I send money home. My family gets it instantly. No more Western Union lines." },
  { name: "Jean-Pierre D.", location: "Port-au-Prince", text: "As a K-Agent, I earn commissions every day. It transformed my small business." },
  { name: "Sophie L.", location: "Montreal, QC", text: "Finally, a service that understands the Haitian diaspora. The K-Link family panel is amazing." },
];

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="font-serif-luxury text-4xl md:text-6xl font-bold text-kob-text mb-4">
            Join the KobKlein <span className="gradient-gold-text">Community</span>
          </h1>
          <p className="text-lg text-kob-muted max-w-2xl mx-auto">
            Be part of Haiti&apos;s digital payment revolution. Connect, contribute, and grow with thousands of users worldwide.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-kob-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center card-sovereign p-6">
                <div className="text-3xl font-bold gradient-gold-text font-serif-luxury">{s.value}</div>
                <div className="text-sm text-kob-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Programs */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-3xl font-bold text-center text-kob-text mb-4">Community Programs</h2>
          <p className="text-center text-kob-muted mb-12 max-w-2xl mx-auto">
            Multiple ways to get involved and make an impact
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {programs.map((p) => (
              <div key={p.title} className="card-sovereign shimmer-gold p-8">
                <div className="w-14 h-14 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-5">
                  <p.icon className="h-7 w-7 text-kob-gold" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-kob-emerald/10 text-kob-emerald border border-kob-emerald/20 mb-4">
                  {p.badge}
                </span>
                <h3 className="text-xl font-bold text-kob-text mb-3">{p.title}</h3>
                <p className="text-sm text-kob-muted leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-3xl font-bold text-center text-kob-text mb-12">Voices from the Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card-sovereign p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-kob-gold text-kob-gold" />
                  ))}
                </div>
                <p className="text-sm text-kob-body leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="text-sm">
                  <span className="font-semibold text-kob-text">{t.name}</span>
                  <span className="text-kob-muted ml-2">{t.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social & Events */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">Stay Connected</h2>
          <p className="text-kob-muted mb-8">Follow us on social media and join the conversation</p>
          <div className="flex justify-center gap-4">
            {["Twitter/X", "Instagram", "Facebook", "YouTube", "TikTok"].map((s) => (
              <button
                key={s}
                type="button"
                className="px-5 py-2.5 rounded-xl border border-white/8 text-sm text-kob-body hover:border-kob-gold/30 hover:text-kob-gold transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-12">
            <Globe className="h-8 w-8 text-kob-gold/40 mx-auto mb-3" />
            <p className="text-sm text-kob-muted">Community events coming soon to Port-au-Prince, Miami, Montreal, and Paris</p>
          </div>
        </div>
      </section>
    </>
  );
}
