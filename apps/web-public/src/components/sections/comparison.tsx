"use client";

import { motion } from "framer-motion";
import type { Dictionary } from "@/i18n";
import { Check, X } from "lucide-react";

export function ComparisonSection({ dict }: { dict: Dictionary }) {
	const routes = [
		{
			label: dict.comparison.usToHaiti,
			wu: "$12.99",
			mg: "$9.99",
			kob: "$1.99",
		},
		{
			label: dict.comparison.p2p,
			wu: null,
			mg: null,
			kob: dict.comparison.free,
			kobFree: true,
		},
		{
			label: dict.comparison.cashOut,
			wu: "$5.00",
			mg: "$4.50",
			kob: "$0.99",
		},
		{
			label: dict.comparison.onlinePurchase,
			wu: null,
			mg: null,
			kob: "$0.49",
		},
	];

	return (
		<section className="relative py-24 md:py-32">
			<div className="absolute inset-0 bg-kob-navy/40" />

			<div className="relative max-w-5xl mx-auto px-6">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-4xl md:text-5xl font-bold text-kob-text font-serif">
						{dict.comparison.title}
					</h2>
					<p className="mt-4 text-lg text-kob-muted">
						{dict.comparison.subtitle}
					</p>
					<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="overflow-x-auto rounded-2xl border border-white/[0.06]"
				>
					<table className="w-full text-sm min-w-[500px]">
						<thead>
							<tr className="bg-kob-panel/80">
								<th className="text-left px-6 py-4 text-kob-muted font-medium">
									{dict.comparison.route}
								</th>
								<th className="px-6 py-4 text-kob-muted font-medium text-center">
									{dict.comparison.westernUnion}
								</th>
								<th className="px-6 py-4 text-kob-muted font-medium text-center">
									{dict.comparison.moneyGram}
								</th>
								<th className="px-6 py-4 font-bold text-center relative">
									<div className="absolute inset-0 bg-kob-gold/[0.06]" />
									<span className="relative text-kob-gold font-semibold">
										{dict.comparison.kobklein}
									</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{routes.map((route, i) => (
								<tr
									key={route.label}
									className={
										i % 2 === 0
											? "bg-kob-black/30"
											: "bg-kob-panel/30"
									}
								>
									<td className="px-6 py-4 text-kob-body font-medium">
										{route.label}
									</td>
									<td className="px-6 py-4 text-center text-kob-muted">
										{route.wu ?? (
											<X className="h-4 w-4 mx-auto text-kob-muted/40" />
										)}
									</td>
									<td className="px-6 py-4 text-center text-kob-muted">
										{route.mg ?? (
											<X className="h-4 w-4 mx-auto text-kob-muted/40" />
										)}
									</td>
									<td className="px-6 py-4 text-center relative">
										<div className="absolute inset-0 bg-kob-gold/[0.06]" />
										<span
											className={`relative font-semibold flex items-center justify-center gap-1.5 ${route.kobFree ? "text-kob-emerald" : "text-kob-gold"}`}
										>
											{route.kobFree && (
												<Check className="h-4 w-4" />
											)}
											{route.kob}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</motion.div>
			</div>
		</section>
	);
}
