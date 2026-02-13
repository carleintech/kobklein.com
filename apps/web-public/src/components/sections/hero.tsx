"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Dictionary } from "@/i18n";
import HeroBackground from "@/components/HeroBackground";

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 30 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.7, delay: i * 0.15, ease: "easeOut" as const },
	}),
};

const statReveal: Variants = {
	hidden: { opacity: 0, scale: 0.8 },
	visible: (i: number) => ({
		opacity: 1,
		scale: 1,
		transition: {
			duration: 0.5,
			delay: 0.8 + i * 0.1,
			ease: "easeOut" as const,
		},
	}),
};

export function HeroSection({ dict }: { dict: Dictionary }) {
	const stats = [
		{ value: dict.hero.stats.users, label: dict.hero.stats.usersLabel },
		{
			value: dict.hero.stats.transfers,
			label: dict.hero.stats.transfersLabel,
		},
		{
			value: dict.hero.stats.countries,
			label: dict.hero.stats.countriesLabel,
		},
		{ value: dict.hero.stats.uptime, label: dict.hero.stats.uptimeLabel },
	];

	return (
		<section className="relative min-h-[85vh] section-dark flex items-start">
			<HeroBackground />

			{/* Content */}
			<div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 pt-16 text-center">
				{/* Headline */}
				<motion.h1
					variants={fadeUp}
					initial="hidden"
					animate="visible"
					custom={0}
					className="text-4xl md:text-5xl leading-tight tracking-wide font-serif mb-2"
				>
					{dict.hero.title}
				</motion.h1>

				{/* Subtext */}
				<motion.p
					variants={fadeUp}
					initial="hidden"
					animate="visible"
					custom={1}
					className="mt-6 text-xl md:text-2xl text-kob-body font-light max-w-3xl mx-auto"
				>
					{dict.hero.subtitle}
				</motion.p>

				{/* CTA buttons */}
				<motion.div
					variants={fadeUp}
					initial="hidden"
					animate="visible"
					custom={2}
					className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
				>
					<button className="h-12 px-8 py-3 rounded-xl bg-slate-900 border border-kob-gold text-kob-gold text-base font-medium tracking-wide hover:bg-kob-gold/10 hover:shadow-lg hover:shadow-kob-gold/20 transition-all duration-300 flex items-center gap-2 group">
						{dict.hero.cta}
						<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
					</button>
					<button className="h-12 px-8 py-3 rounded-xl bg-slate-900 border border-kob-gold text-kob-gold text-base font-medium tracking-wide hover:bg-kob-gold/10 hover:shadow-lg hover:shadow-kob-gold/20 transition-all duration-300">
						{dict.hero.ctaSecondary}
					</button>
				</motion.div>

				{/* Feature blocks */}
				<motion.div
					variants={fadeUp}
					initial="hidden"
					animate="visible"
					custom={3}
					className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
				>
					<div className="text-center">
						<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-kob-gold/10 flex items-center justify-center">
							<div className="w-8 h-8 rounded-full bg-kob-gold"></div>
						</div>
						<h3 className="text-lg font-semibold text-kob-text mb-2">Bank-Grade Security</h3>
						<p className="text-kob-muted text-sm">Enterprise-level encryption and compliance standards</p>
					</div>

					<div className="text-center">
						<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-kob-gold/10 flex items-center justify-center">
							<div className="w-8 h-8 rounded-full bg-kob-gold"></div>
						</div>
						<h3 className="text-lg font-semibold text-kob-text mb-2">Instant Processing</h3>
						<p className="text-kob-muted text-sm">Real-time transactions with immediate confirmation</p>
					</div>

					<div className="text-center">
						<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-kob-gold/10 flex items-center justify-center">
							<div className="w-8 h-8 rounded-full bg-kob-gold"></div>
						</div>
						<h3 className="text-lg font-semibold text-kob-text mb-2">Zero Hidden Fees</h3>
						<p className="text-kob-muted text-sm">Transparent pricing with no surprise charges</p>
					</div>
				</motion.div>
			</div>

			{/* Smooth transition gradient */}
			<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-kob-black pointer-events-none" />
		</section>
	);
}
