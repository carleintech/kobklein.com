"use client";

import { motion, type Variants } from "framer-motion";
import type { Dictionary } from "@/i18n";
import { Building, Plane, ShoppingBag, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const cardReveal: Variants = {
	hidden: { opacity: 0, y: 40 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
			delay: i * 0.15,
			ease: "easeOut" as const,
		},
	}),
};

const pillars = [
	{ key: "clients", icon: Users },
	{ key: "distributors", icon: Building },
	{ key: "merchants", icon: ShoppingBag },
	{ key: "diaspora", icon: Plane },
] as const;

export function EcosystemSection({ dict }: { dict: Dictionary }) {
	return (
		<section className="relative py-24 md:py-32">
			<div className="max-w-7xl mx-auto px-6">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-4xl md:text-5xl font-bold text-kob-text font-serif">
						{dict.ecosystem.title}
					</h2>
					<p className="mt-4 text-lg text-kob-muted max-w-3xl mx-auto">
						{dict.ecosystem.subtitle}
					</p>
					<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{pillars.map(({ key, icon: Icon }, i) => {
						const pillar =
							dict.ecosystem[
								key as keyof typeof dict.ecosystem
							];
						if (typeof pillar === "string") return null;
						return (
							<motion.div
								key={key}
								variants={cardReveal}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true }}
								custom={i}
							>
								<Card className="p-8 h-full hover:border-kob-gold/20 transition-all duration-500 group">
									<div className="flex items-start gap-5">
										<div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-kob-gold/10 flex items-center justify-center group-hover:bg-kob-gold/15 transition-colors duration-300">
											<Icon className="h-7 w-7 text-kob-gold" />
										</div>
										<div className="flex-1 min-w-0">
											<span className="text-xs font-bold text-kob-gold/60 tracking-widest">
												{pillar.number}
											</span>
											<h3 className="text-xl font-semibold text-kob-text mt-1">
												{pillar.title}
											</h3>
											<p className="mt-3 text-sm text-kob-muted leading-relaxed">
												{pillar.description}
											</p>
											<ul className="mt-5 grid grid-cols-2 gap-2.5">
												{pillar.features.map(
													(f: string) => (
														<li
															key={f}
															className="flex items-center gap-2 text-xs text-kob-body"
														>
															<span className="w-1.5 h-1.5 rounded-full bg-kob-gold/60 flex-shrink-0" />
															{f}
														</li>
													),
												)}
											</ul>
										</div>
									</div>
								</Card>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
