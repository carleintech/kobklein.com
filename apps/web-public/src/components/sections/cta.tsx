"use client";

import { motion } from "framer-motion";
import type { Dictionary } from "@/i18n";
import { PrimaryButton } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection({ dict }: { dict: Dictionary }) {
	return (
		<section className="relative py-24 md:py-32 overflow-hidden">
			{/* Background effects */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(198,167,86,0.08),transparent)]" />
				<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kob-gold/15 to-transparent" />
				<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kob-gold/15 to-transparent" />
			</div>

			<div className="relative max-w-4xl mx-auto px-6 text-center">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7 }}
				>
					<h2 className="text-4xl md:text-6xl font-bold text-kob-text leading-tight font-serif">
						{dict.cta.title}
					</h2>
					<p className="mt-6 text-lg text-kob-muted max-w-2xl mx-auto">
						{dict.cta.subtitle}
					</p>
					<div className="mt-10">
						<PrimaryButton className="text-lg px-10 py-5 shadow-xl shadow-kob-gold/25 hover:shadow-kob-gold/35 hover:scale-[1.02] transition-all duration-300 group">
							{dict.cta.button}
							<ArrowRight className="inline ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
						</PrimaryButton>
					</div>

					{/* Trust badges */}
					<div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
						{["PCI DSS", "SOC 2", "AML/KYC", "256-bit SSL"].map(
							(badge) => (
								<div
									key={badge}
									className="px-3 py-1.5 rounded-lg border border-kob-gold/15 bg-kob-panel/40"
								>
									<span className="text-[10px] font-bold text-kob-gold/70 tracking-wider uppercase">
										{badge}
									</span>
								</div>
							),
						)}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
