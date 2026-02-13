import { ArrowRight, Heart, Users } from "lucide-react";
import Link from "next/link";

const leadership = [
  { name: "Carlens Klein", initials: "CK", title: "Founder & CEO", bio: "Haitian-American fintech visionary with a mission to transform Haiti's financial ecosystem. Background in software engineering and financial services.", color: "bg-kob-gold" },
  { name: "Dr. Stéphanie Villedrouin", initials: "SV", title: "Chief Technology Officer", bio: "Former tech lead at major fintech companies. Expert in distributed systems, mobile payments, and financial infrastructure at scale.", color: "bg-kob-emerald" },
  { name: "Marc-Antoine Baptiste", initials: "MB", title: "Chief Financial Officer", bio: "15+ years in international banking and compliance. Formerly at BRH and PwC. Deep understanding of Haitian financial regulations.", color: "bg-kob-gold-dark" },
  { name: "Fabiola Charles", initials: "FC", title: "Head of Compliance", bio: "Regulatory expert specializing in Caribbean financial services. Ensures KobKlein meets all AML, KYC, and EMI requirements across jurisdictions.", color: "bg-kob-gold" },
  { name: "Daniel Prophète", initials: "DP", title: "Head of Product", bio: "Product leader focused on user experience for emerging markets. Previously built mobile money products serving 10M+ users in Africa.", color: "bg-kob-emerald" },
  { name: "Nathalie Jean-Louis", initials: "NJ", title: "Head of Operations", bio: "Operations expert with deep knowledge of Haiti's informal economy. Manages the K-Agent distribution network across the country.", color: "bg-kob-gold-dark" },
  { name: "Ricardo Toussaint", initials: "RT", title: "Head of Engineering", bio: "Full-stack architect with expertise in high-throughput payment systems. Ensures the KobKlein platform handles millions of transactions securely.", color: "bg-kob-gold" },
  { name: "Guerda Estimé", initials: "GE", title: "Head of Marketing", bio: "Brand strategist with deep roots in the Haitian diaspora community. Leads growth across Miami, Montreal, Paris, and beyond.", color: "bg-kob-emerald" },
];

const cultureValues = [
  "Ayiti avant tout — Haiti comes first in every decision we make",
  "Move fast, stay compliant — innovation within regulatory excellence",
  "Design for everyone — our grandmother in Jérémie must be able to use it",
  "Radical transparency — we build trust through openness",
];

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,167,86,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="font-serif-luxury text-4xl md:text-6xl font-bold text-kob-text mb-4">
            Meet the <span className="gradient-gold-text">Team</span>
          </h1>
          <p className="text-lg text-kob-muted max-w-2xl mx-auto">
            A passionate team of Haitians and allies building the financial infrastructure our country deserves.
          </p>
        </div>
      </section>

      {/* Leadership Grid */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-3xl font-bold text-center text-kob-text mb-12">Leadership</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadership.map((member) => (
              <div key={member.name} className="card-sovereign p-6 text-center group">
                <div className={`w-20 h-20 rounded-full ${member.color} flex items-center justify-center mx-auto mb-4 text-kob-black font-bold text-xl`}>
                  {member.initials}
                </div>
                <h3 className="text-lg font-semibold text-kob-text">{member.name}</h3>
                <p className="text-sm text-kob-gold font-medium mb-3">{member.title}</p>
                <p className="text-xs text-kob-muted leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif-luxury text-3xl font-bold text-center text-kob-text mb-4">Our Culture</h2>
          <p className="text-center text-kob-muted mb-12 max-w-2xl mx-auto">
            We&apos;re a remote-first team united by a single mission: financial sovereignty for Haiti.
          </p>
          <div className="space-y-4">
            {cultureValues.map((v) => (
              <div key={v} className="card-sovereign p-5 flex items-center gap-4">
                <Heart className="h-5 w-5 text-kob-gold shrink-0" />
                <p className="text-sm text-kob-body">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-20 bg-kob-navy text-center">
        <div className="max-w-2xl mx-auto px-4">
          <Users className="h-10 w-10 text-kob-gold/40 mx-auto mb-4" />
          <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">Want to Join Us?</h2>
          <p className="text-kob-muted mb-8">We&apos;re always looking for talented people who share our vision.</p>
          <Link href={`/${locale}/careers`} className="btn-gold px-8 py-3 text-lg inline-flex items-center gap-2">
            View Open Positions <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
