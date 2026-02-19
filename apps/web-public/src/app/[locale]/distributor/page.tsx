import { getDictionary, type Locale } from "@/i18n";
import { DistributorContent } from "@/components/distributor-content";

export default async function DistributorPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const dict = await getDictionary(locale as Locale);

	return <DistributorContent dict={dict} locale={locale} />;
}
