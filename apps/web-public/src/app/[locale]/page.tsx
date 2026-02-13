import { getDictionary, type Locale } from "@/i18n";
import { HeroSection } from "@/components/sections/hero";
import { FeaturesSection } from "@/components/sections/features";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { EcosystemSection } from "@/components/sections/ecosystem";
import { ComparisonSection } from "@/components/sections/comparison";
import { KCardSection } from "@/components/sections/kcard";
import { MissionSection } from "@/components/sections/mission";
import { CtaSection } from "@/components/sections/cta";

export default async function HomePage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const dict = await getDictionary(locale as Locale);

	return (
		<>
			<HeroSection dict={dict} />
			<FeaturesSection />
			<HowItWorksSection dict={dict} />
			<EcosystemSection dict={dict} />
			<ComparisonSection dict={dict} />
			<KCardSection dict={dict} />
			<MissionSection dict={dict} />
			<CtaSection dict={dict} />
		</>
	);
}
