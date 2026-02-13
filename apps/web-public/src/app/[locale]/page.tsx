import { getDictionary, type Locale } from "@/i18n";
import { HeroSection } from "@/components/sections/hero";
import { FeaturesSection } from "@/components/sections/features";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { EcosystemSection } from "@/components/sections/ecosystem";
import { ComparisonSection } from "@/components/sections/comparison";
import { KCardSection } from "@/components/sections/kcard";
import { MissionSection } from "@/components/sections/mission";
import { CtaSection } from "@/components/sections/cta";

const BASE_URL = "https://kobklein.com";

const websiteJsonLd = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: "KobKlein",
	url: BASE_URL,
	description:
		"The sovereign digital financial platform for Haiti and the Haitian diaspora.",
	potentialAction: {
		"@type": "SearchAction",
		target: `${BASE_URL}/en/help?q={search_term_string}`,
		"query-input": "required name=search_term_string",
	},
};

const appJsonLd = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "KobKlein",
	applicationCategory: "FinanceApplication",
	operatingSystem: "iOS, Android",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
	description:
		"Digital wallet for instant transfers, payments, and remittances. Designed for Haiti and the Haitian diaspora worldwide.",
	featureList: [
		"K-Pay instant transfers",
		"K-Card virtual Visa card",
		"K-Link diaspora family panel",
		"K-Agent cash-in/cash-out network",
		"K-Code & K-Scan QR payments",
	],
};

export default async function HomePage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const dict = await getDictionary(locale as Locale);

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
			/>
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
