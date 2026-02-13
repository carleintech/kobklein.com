"use client";

import { motion } from "framer-motion";
import type { Dictionary } from "@/i18n";
import { PrimaryButton } from "@/components/ui/button";
import { Bell, CreditCard, Globe, Zap } from "lucide-react";

const cardFeatures = [
	{ key: "virtual", icon: CreditCard },
	{ key: "instant", icon: Zap },
	{ key: "global", icon: Globe },
	{ key: "control", icon: Bell },
] as const;

export function KCardSection({ dict }: { dict: Dictionary }) {
	return (
		<section className="relative py-24 md:py-32 overflow-hidden">
			<div className="max-w-7xl mx-auto px-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
					{/* Card mockup */}
					<motion.div
						initial={{ opacity: 0, x: -40 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{
							duration: 0.7,
							ease: "easeOut" as const,
						}}
						className="relative"
					>
						<div className="relative aspect-[1.586/1] max-w-md mx-auto">
							{/* Card glow */}
							<div className="absolute inset-4 bg-kob-gold/15 rounded-3xl blur-3xl" />
							{/* Card body */}
							<div className="relative h-full rounded-3xl bg-gradient-to-br from-kob-panel via-kob-navy to-kob-black border border-kob-gold/20 p-8 flex flex-col justify-between overflow-hidden shadow-2xl shadow-black/50">
								{/* Gold accent line */}
								<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-kob-goldDark via-kob-gold to-kob-goldLight" />
								{/* Pattern overlay */}
								<div
									className="absolute inset-0 opacity-[0.04]"
									style={{
										backgroundImage:
											"radial-gradient(circle at 20% 50%, rgba(198,167,86,0.4), transparent 50%), radial-gradient(circle at 80% 20%, rgba(198,167,86,0.3), transparent 40%)",
									}}
								/>

								<div className="relative flex justify-between items-start">
									<div>
										<span className="text-[10px] text-kob-muted tracking-widest uppercase">
											Virtual Card
										</span>
										<div className="mt-1 text-lg font-bold text-kob-text tracking-tight">
											K-Card
										</div>
									</div>
									<div className="text-kob-gold font-bold text-xl tracking-tight font-serif">
										KobKlein
									</div>
								</div>

								<div className="relative">
									<div className="text-xl tracking-[0.25em] text-kob-body/80 font-mono">
										&bull;&bull;&bull;&bull;
										&nbsp;&nbsp;&bull;&bull;&bull;&bull;
										&nbsp;&nbsp;&bull;&bull;&bull;&bull;
										&nbsp;&nbsp;4582
									</div>
									<div className="mt-4 flex gap-8">
										<div>
											<div className="text-[10px] text-kob-muted uppercase tracking-wider">
												Valid Thru
											</div>
											<div className="text-sm text-kob-body mt-0.5">
												12/28
											</div>
										</div>
										<div>
											<div className="text-[10px] text-kob-muted uppercase tracking-wider">
												CVV
											</div>
											<div className="text-sm text-kob-body mt-0.5">
												&bull;&bull;&bull;
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</motion.div>

					{/* Content */}
					<motion.div
						initial={{ opacity: 0, x: 40 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{
							duration: 0.7,
							ease: "easeOut" as const,
						}}
					>
						<h2 className="text-4xl md:text-5xl font-bold text-kob-text font-serif">
							{dict.kcard.title}
						</h2>
						<p className="mt-3 text-xl text-kob-gold font-light">
							{dict.kcard.subtitle}
						</p>
						<p className="mt-4 text-kob-muted leading-relaxed">
							{dict.kcard.description}
						</p>

						<div className="mt-8 grid grid-cols-2 gap-3">
							{cardFeatures.map(({ key, icon: Icon }) => (
								<div
									key={key}
									className="flex items-center gap-3 p-3.5 rounded-xl bg-kob-panel/60 border border-white/[0.04] hover:border-kob-gold/15 transition-colors duration-300"
								>
									<Icon className="h-5 w-5 text-kob-gold flex-shrink-0" />
									<span className="text-sm text-kob-body">
										{
											dict.kcard.features[
												key as keyof typeof dict.kcard.features
											]
										}
									</span>
								</div>
							))}
						</div>

						<PrimaryButton className="mt-8 px-8 py-4 text-base shadow-lg shadow-kob-gold/20">
							{dict.kcard.waitlist}
						</PrimaryButton>

						<p className="mt-4 text-xs text-kob-muted max-w-md leading-relaxed">
							{dict.kcard.faq}
						</p>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
