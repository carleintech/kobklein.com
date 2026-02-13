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
      <Navbar dict={dict} locale={locale as Locale} />
      <main className="flex-1">{children}</main>
      <Footer dict={dict} locale={locale as Locale} />
    </div>
  );
}
