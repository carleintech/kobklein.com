"use client";

import { motion, type Variants } from "framer-motion";
import type { Dictionary } from "@/i18n";
import { Heart, Eye, ShieldCheck, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";

const container: Variants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: "easeOut" as const },
	},
};

const values = [
	{ key: "trust", icon: Heart },
	{ key: "accessibility", icon: Eye },
	{ key: "security", icon: ShieldCheck },
	{ key: "innovation", icon: Rocket },
] as const;

export function MissionSection({ dict }: { dict: Dictionary }) {
	return (
		<section className="relative py-24 md:py-32">
			<div className="absolute inset-0 bg-kob-navy/40" />

			<div className="relative max-w-7xl mx-auto px-6">
				{/* Mission statement */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16 max-w-3xl mx-auto"
				>
					<h2 className="text-4xl md:text-5xl font-bold text-kob-text font-serif">
						{dict.mission.title}
					</h2>
					<p className="mt-3 text-xl text-kob-gold font-light">
						{dict.mission.subtitle}
					</p>
					<p className="mt-6 text-kob-muted leading-relaxed">
						{dict.mission.description}
					</p>
					<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
				</motion.div>

				{/* Values */}
				<motion.div
					variants={container}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true }}
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
				>
					{values.map(({ key, icon: Icon }) => {
						const value =
							dict.mission.values[
								key as keyof typeof dict.mission.values
							];
						if (typeof value === "string") return null;
						return (
							<motion.div key={key} variants={fadeUp}>
								<Card className="text-center p-8 h-full hover:border-kob-gold/20 transition-all duration-500 group">
									<div className="w-12 h-12 rounded-xl bg-kob-gold/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-kob-gold/15 transition-colors duration-300">
										<Icon className="h-6 w-6 text-kob-gold" />
									</div>
									<h3 className="text-lg font-semibold text-kob-text">
										{value.title}
									</h3>
									<p className="mt-2 text-sm text-kob-muted leading-relaxed">
										{value.description}
									</p>
								</Card>
							</motion.div>
						);
					})}
				</motion.div>

				{/* Community photo strip */}
				<motion.div
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8 }}
					className="mb-16 grid grid-cols-3 md:grid-cols-6 gap-3"
				>
					{["a.jpg", "b.png", "c.jpg", "d.jpg", "e.jpg", "f.jpg"].map((img) => (
						<div key={img} className="relative aspect-square rounded-xl overflow-hidden border border-transparent hover:border-kob-gold/30 transition-all duration-300 group">
							<Image
								src={`/images/mission/${img}`}
								alt="KobKlein community"
								fill
								sizes="(max-width: 768px) 33vw, 16vw"
								loading="lazy"
								className="object-cover group-hover:scale-110 transition-transform duration-500"
							/>
							<div className="absolute inset-0 bg-kob-black/30 group-hover:bg-transparent transition-colors duration-300" />
						</div>
					))}
				</motion.div>

				{/* Vision */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="relative rounded-2xl border border-kob-gold/10 bg-gradient-to-br from-kob-panel to-kob-navy p-10 md:p-14 text-center overflow-hidden"
				>
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.05),transparent_70%)]" />
					<div className="relative">
						<h3 className="text-2xl md:text-3xl font-bold text-kob-text font-serif">
							{dict.mission.vision.title}
						</h3>
						<p className="mt-4 text-kob-muted leading-relaxed max-w-2xl mx-auto">
							{dict.mission.vision.description}
						</p>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
