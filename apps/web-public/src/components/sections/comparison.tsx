"use client";

import { motion } from "framer-motion";
import type { Dictionary } from "@/i18n";
import { Check } from "lucide-react";

export function ComparisonSection({ dict }: { dict: Dictionary }) {
	const rows = [
		{
			label: dict.comparison.usToHaiti,
			fee: "$1.99",
			note: dict.comparison.note,
			isFree: false,
		},
		{
			label: dict.comparison.p2p,
			fee: dict.comparison.free,
			note: null,
			isFree: true,
		},
		{
			label: dict.comparison.cashOut,
			fee: "$0.99",
			note: dict.comparison.note,
			isFree: false,
		},
		{
			label: dict.comparison.onlinePurchase,
			fee: "$0.49",
			note: dict.comparison.note,
			isFree: false,
		},
	];

	return (
		<section className="relative py-24 md:py-32">
			<div className="absolute inset-0 bg-kob-navy/40" />

			<div className="relative max-w-3xl mx-auto px-6">
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
					<p className="mt-4 text-lg text-kob-muted max-w-xl mx-auto">
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
					<table className="w-full text-sm">
						<caption className="sr-only">
							KobKlein transparent pricing
						</caption>
						<thead>
							<tr className="bg-kob-panel/80">
								<th scope="col" className="text-left px-6 py-4 text-kob-muted font-medium">
									{dict.comparison.route}
								</th>
								<th scope="col" className="px-6 py-4 font-bold text-right relative">
									<div className="absolute inset-0 bg-kob-gold/[0.06]" />
									<span className="relative text-kob-gold font-semibold">
										{dict.comparison.kobklein}
									</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row, i) => (
								<tr
									key={row.label}
									className={
										i % 2 === 0
											? "bg-kob-black/30"
											: "bg-kob-panel/30"
									}
								>
									<th scope="row" className="px-6 py-4 text-kob-body font-medium text-left">
										{row.label}
									</th>
									<td className="px-6 py-4 text-right relative">
										<div className="absolute inset-0 bg-kob-gold/[0.06]" />
										<span
											className={`relative font-semibold inline-flex items-center justify-end gap-1.5 ${row.isFree ? "text-kob-emerald" : "text-kob-gold"}`}
										>
											{row.isFree && (
												<Check className="h-4 w-4" />
											)}
											{row.fee}
											{row.note && (
												<span className="text-kob-muted text-xs font-normal ml-1">
													({row.note})
												</span>
											)}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</motion.div>

				{/* Disclaimer */}
				<motion.p
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.4 }}
					className="mt-5 text-xs text-kob-muted text-center leading-relaxed"
				>
					{dict.comparison.disclaimer}
				</motion.p>
			</div>
		</section>
	);
}
