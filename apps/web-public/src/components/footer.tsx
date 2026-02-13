import Link from "next/link";
import type { Dictionary, Locale } from "@/i18n";

export function Footer({ dict, locale }: { dict: Dictionary; locale?: Locale }) {
  const year = new Date().getFullYear();
  const loc = locale ?? "en";

  return (
    <footer className="bg-kob-navy border-t border-white/4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-kob-gold flex items-center justify-center">
                <span className="text-kob-black font-bold text-sm">K</span>
              </div>
              <span className="text-xl font-semibold text-kob-text tracking-tight">
                KobKlein
              </span>
            </div>
            <p className="text-sm text-kob-muted leading-relaxed">{dict.footer.tagline}</p>
            <div className="flex gap-3">
              {[
                { label: "X", href: "#" },
                { label: "IG", href: "#" },
                { label: "FB", href: "#" },
                { label: "YT", href: "#" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="w-9 h-9 rounded-full bg-white/4 flex items-center justify-center text-kob-muted hover:bg-kob-gold/10 hover:text-kob-gold transition-all duration-200"
                >
                  <span className="text-xs font-bold">{s.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-kob-text mb-5 uppercase tracking-wider">
              {dict.footer.product}
            </h3>
            <ul className="space-y-3 text-sm text-kob-muted">
              <li><Link href={`/${loc}/how-it-works`} className="hover:text-kob-gold transition-colors duration-200">{dict.footer.howItWorks}</Link></li>
              <li><Link href={`/${loc}/card`} className="hover:text-kob-gold transition-colors duration-200">K-Card</Link></li>
              <li><Link href={`/${loc}/app`} className="hover:text-kob-gold transition-colors duration-200">{dict.nav.download}</Link></li>
              <li><Link href={`/${loc}/help`} className="hover:text-kob-gold transition-colors duration-200">{dict.footer.faq}</Link></li>
              <li><Link href={`/${loc}/diaspora`} className="hover:text-kob-gold transition-colors duration-200">Diaspora</Link></li>
              <li><Link href={`/${loc}/fx-calculator`} className="hover:text-kob-gold transition-colors duration-200">FX Calculator</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-kob-text mb-5 uppercase tracking-wider">
              {dict.footer.company}
            </h3>
            <ul className="space-y-3 text-sm text-kob-muted">
              <li><Link href={`/${loc}/about`} className="hover:text-kob-gold transition-colors duration-200">{dict.footer.about}</Link></li>
              <li><Link href={`/${loc}/careers`} className="hover:text-kob-gold transition-colors duration-200">{dict.footer.careers}</Link></li>
              <li><Link href={`/${loc}/team`} className="hover:text-kob-gold transition-colors duration-200">Team</Link></li>
              <li><Link href={`/${loc}/contact`} className="hover:text-kob-gold transition-colors duration-200">{dict.footer.contact}</Link></li>
              <li><Link href={`/${loc}/institutional`} className="hover:text-kob-gold transition-colors duration-200">Institutional</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-kob-text mb-5 uppercase tracking-wider">
              {dict.footer.legal}
            </h3>
            <ul className="space-y-3 text-sm text-kob-muted">
              <li><Link href={`/${loc}/terms`} className="hover:text-kob-gold transition-colors duration-200">{dict.footer.terms}</Link></li>
              <li><Link href={`/${loc}/privacy`} className="hover:text-kob-gold transition-colors duration-200">{dict.footer.privacy}</Link></li>
              <li><Link href={`/${loc}/compliance`} className="hover:text-kob-gold transition-colors duration-200">{dict.footer.compliance}</Link></li>
              <li><Link href={`/${loc}/security`} className="hover:text-kob-gold transition-colors duration-200">Security</Link></li>
              <li><Link href={`/${loc}/risk-disclosure`} className="hover:text-kob-gold transition-colors duration-200">Risk Disclosure</Link></li>
              <li><Link href={`/${loc}/acceptable-use`} className="hover:text-kob-gold transition-colors duration-200">Acceptable Use</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 mb-8 h-px bg-gradient-to-r from-transparent via-kob-gold/20 to-transparent" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-kob-muted">
            &copy; {year} {dict.footer.copyright}
          </p>
          <div className="flex items-center gap-3">
            {["PCI", "SOC", "AML"].map((badge) => (
              <div
                key={badge}
                className="px-2 py-1 rounded border border-kob-gold/20 flex items-center justify-center"
              >
                <span className="text-[9px] font-bold text-kob-gold tracking-wider">{badge}</span>
              </div>
            ))}
            <span className="text-xs text-kob-muted ml-1">Bank-Grade Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
