import { getDictionary, type Locale } from "@/i18n";
import { ComplianceContent } from "@/components/compliance-content";

export default async function CompliancePage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const dict = await getDictionary(locale as Locale);

	return <ComplianceContent dict={dict} locale={locale} />;
}
