import { getDictionary, locales, type Locale } from "@/i18n";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip-to-content link — visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-kob-gold focus:text-kob-black focus:font-semibold focus:text-sm focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar dict={dict} locale={locale as Locale} />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer dict={dict} locale={locale as Locale} />
    </div>
  );
}
