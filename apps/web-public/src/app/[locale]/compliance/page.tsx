import { getDictionary, type Locale } from "@/i18n";

export default async function CompliancePage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const dict = await getDictionary(locale as Locale);

	return (
		<section className="py-24 md:py-32">
			<div className="max-w-5xl mx-auto px-6">
				<div className="text-center mb-16">
					<h1 className="text-4xl md:text-5xl font-bold text-kob-text font-serif">
						{dict.compliance.title}
					</h1>
					<p className="mt-4 text-lg text-kob-muted">
						{dict.compliance.subtitle}
					</p>
					<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{(
						["financial", "data", "international", "operational"] as const
					).map((key) => {
						const item = dict.compliance[key];
						return (
							<div
								key={key}
								className="bg-kob-panel/50 rounded-2xl border border-white/[0.04] p-8"
							>
								<h3 className="text-lg font-semibold text-kob-text mb-3">
									{item.title}
								</h3>
								<p className="text-sm text-kob-muted leading-relaxed">
									{item.description}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
