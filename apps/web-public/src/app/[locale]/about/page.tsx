import { getDictionary, type Locale } from "@/i18n";
import { AboutContent } from "@/components/about-content";

export default async function AboutPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const dict = await getDictionary(locale as Locale);

	return <AboutContent dict={dict} locale={locale} />;
}
