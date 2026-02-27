import Link from "next/link";
import Image from "next/image";
import { Twitter, Instagram, Facebook, Youtube } from "lucide-react";
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
            <div className="flex items-center">
              <Image
                src="/images/logos/footer.png"
                alt="KobKlein Footer Logo"
                width={320}
                height={90}
                className="h-24 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-kob-muted leading-relaxed">{dict.footer.tagline}</p>
            <div className="flex gap-3">
              {[
                { label: "Twitter", icon: Twitter, href: "#" },
                { label: "Instagram", icon: Instagram, href: "#" },
                { label: "Facebook", icon: Facebook, href: "#" },
                { label: "YouTube", icon: Youtube, href: "#" },
              ].map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white/4 flex items-center justify-center text-kob-muted hover:bg-kob-gold/10 hover:text-kob-gold hover:scale-110 transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
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
        <div className="mt-12 mb-6 h-px bg-gradient-to-r from-transparent via-kob-gold/20 to-transparent" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <p className="text-xs text-kob-muted">
            &copy; {year} {dict.footer.copyright}
          </p>
        </div>

        {/* Legal note */}
        <p className="text-xs text-kob-muted/70 leading-relaxed border-t border-white/[0.04] pt-5">
          {dict.footer.legalNote}
        </p>
      </div>
    </footer>
  );
}
