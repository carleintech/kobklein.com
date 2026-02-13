import { Star, Quote } from "lucide-react";

const overallStats = [
  { value: "4.8", label: "App Store Rating" },
  { value: "4.7", label: "Google Play Rating" },
  { value: "50K+", label: "Total Reviews" },
  { value: "96%", label: "Would Recommend" },
];

const reviews = [
  { name: "Marie-Claire J.", role: "Diaspora Member", location: "Miami, FL", rating: 5, text: "I used to spend $15 every time I sent money to my mother in Port-au-Prince through Western Union. With KobKlein, it costs $1.99 and arrives instantly. My family is so grateful.", date: "January 2025" },
  { name: "Jean-Pierre D.", role: "K-Agent", location: "Pétion-Ville", rating: 5, text: "Being a K-Agent has transformed my small boutique. I earn commissions on every cash-in and cash-out. My customers love the convenience.", date: "December 2024" },
  { name: "Sophie L.", role: "Student", location: "Montreal, QC", rating: 5, text: "As a student, KobKlein is perfect. I receive money from my parents instantly and the K-Card lets me shop online. No bank account needed!", date: "February 2025" },
  { name: "Ricardo M.", role: "Merchant", location: "Cap-Haïtien", rating: 4, text: "Accepting K-Pay at my restaurant was easy. Customers just scan the QR code. Settlement is instant and the dashboard shows all my sales.", date: "January 2025" },
  { name: "Fabiola T.", role: "Diaspora Member", location: "Paris, France", rating: 5, text: "The K-Link family panel is brilliant. I can see when my family needs support and send money with one tap. It feels like I'm right there with them.", date: "November 2024" },
  { name: "Emmanuel B.", role: "Small Business Owner", location: "Gonaïves", rating: 5, text: "I pay my suppliers and employees through KobKlein now. No more carrying cash across town. It's safer and faster for everyone.", date: "December 2024" },
  { name: "Natasha P.", role: "Freelancer", location: "New York, NY", rating: 4, text: "Getting paid by Haitian clients is so much easier now. They send K-Pay transfers and I receive it instantly. The app is clean and simple.", date: "January 2025" },
  { name: "Pierre-Louis C.", role: "Teacher", location: "Les Cayes", rating: 5, text: "I never had a bank account before KobKlein. Now I receive my salary digitally and can pay for everything from my phone. It changed my life.", date: "February 2025" },
];

export default async function ReviewsPage({
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
          <h1 className="font-serif-luxury text-4xl md:text-6xl font-bold text-kob-text mb-4">
            What Our Users <span className="gradient-gold-text">Say</span>
          </h1>
          <p className="text-lg text-kob-muted max-w-2xl mx-auto">
            Real stories from real users across Haiti and the diaspora
          </p>
        </div>
      </section>

      {/* Overall Stats */}
      <section className="py-16 bg-kob-navy">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {overallStats.map((s) => (
              <div key={s.label} className="text-center card-sovereign p-6">
                <div className="text-3xl font-bold gradient-gold-text font-serif-luxury">{s.value}</div>
                <div className="text-sm text-kob-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-20 bg-kob-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((r) => (
              <div key={r.name} className="card-sovereign p-6 relative">
                <Quote className="absolute top-4 right-4 h-6 w-6 text-kob-gold/10" />
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < r.rating ? "fill-kob-gold text-kob-gold" : "text-kob-muted/30"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-kob-body leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-kob-text">{r.name}</span>
                    <div className="text-xs text-kob-muted">{r.role} &middot; {r.location}</div>
                  </div>
                  <span className="text-xs text-kob-muted">{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-kob-navy text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-serif-luxury text-3xl font-bold text-kob-text mb-4">Ready to Join Them?</h2>
          <p className="text-kob-muted mb-8">Download KobKlein today and experience the difference.</p>
          <button type="button" className="btn-gold px-8 py-3 text-lg">Download the App</button>
        </div>
      </section>
    </>
  );
}
