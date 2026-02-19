"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
	CreditCard,
	Globe,
	QrCode,
	Shield,
	TrendingDown,
	Zap,
} from "lucide-react";
import type { Dictionary } from "@/i18n";

const featureKeys = [
	{ key: "instant" as const, icon: Zap },
	{ key: "security" as const, icon: Shield },
	{ key: "global" as const, icon: Globe },
	{ key: "card" as const, icon: CreditCard },
	{ key: "lowFees" as const, icon: TrendingDown },
	{ key: "kcode" as const, icon: QrCode },
];

export function FeaturesSection({ dict }: { dict: Dictionary }) {
	return (
		<section className="relative py-24 md:py-32">
			{/* Background Image */}
			<div className="absolute inset-0">
				<Image
					src="/images/features/BG.png"
					alt=""
					fill
					sizes="100vw"
					className="object-cover"
					priority
				/>
				<div className="absolute inset-0 bg-kob-black/80" />
			</div>

			<div className="relative max-w-7xl mx-auto px-6">
				{/* Section header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-4xl md:text-5xl font-bold text-white font-serif-luxury">
						{dict.features.title}
					</h2>
					<p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
						{dict.features.subtitle}
					</p>
					<div className="mt-6 mx-auto w-24 divider-teal-gold" />
				</motion.div>

				{/* Feature cards grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{featureKeys.map(({ key, icon: Icon }, index) => (
						<motion.div
							key={key}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: index * 0.1 }}
							viewport={{ once: true }}
							className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border border-white/5 p-6 transition-all duration-300 hover:bg-white/15 hover:border-kob-gold/20 hover:shadow-lg hover:shadow-kob-gold/5"
						>
							<div className="flex items-start gap-4">
								<div className="flex-shrink-0">
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-kob-teal to-kob-gold shadow-lg group-hover:scale-110 transition-transform duration-300">
										<Icon className="h-6 w-6 text-white" />
									</div>
								</div>
								<div className="flex-1">
									<h3 className="mb-2 text-lg font-semibold text-white">
										{dict.features[key].title}
									</h3>
									<p className="text-sm text-white/80 leading-relaxed">
										{dict.features[key].description}
									</p>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
