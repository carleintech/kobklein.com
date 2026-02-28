"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, Shield, Zap, Eye, Store } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import type { Dictionary } from "@/i18n";
import HeroBackground from "@/components/HeroBackground";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003";

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

const heroFeatures = [
	{ key: "security" as const, icon: Shield },
	{ key: "instant" as const, icon: Zap },
	{ key: "fees" as const, icon: Eye },
];

export function HeroSection({ dict }: { dict: Dictionary }) {
	const params = useParams<{ locale: string }>();
	const locale = params?.locale ?? "en";

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
			<div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 pt-16 w-full">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
					{/* Left — Text Content */}
					<div className="text-center lg:text-left">
						{/* Badge */}
						<motion.div
							variants={fadeUp}
							initial="hidden"
							animate="visible"
							custom={0}
							className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-kob-teal/30 bg-kob-teal/10 text-kob-teal text-sm font-medium mb-6"
						>
							<span className="w-2 h-2 rounded-full bg-kob-teal animate-pulse" />
							{dict.hero.badge}
						</motion.div>

						{/* Headline */}
						<motion.h1
							variants={fadeUp}
							initial="hidden"
							animate="visible"
							custom={1}
							className="text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide font-serif-luxury gradient-gold-text"
						>
							{dict.hero.title}
						</motion.h1>

						{/* Subtext */}
						<motion.p
							variants={fadeUp}
							initial="hidden"
							animate="visible"
							custom={2}
							className="mt-6 text-lg md:text-xl text-kob-body font-light max-w-xl mx-auto lg:mx-0"
						>
							{dict.hero.subtitle}
						</motion.p>

						{/* CTA buttons */}
						<motion.div
							variants={fadeUp}
							initial="hidden"
							animate="visible"
							custom={3}
							className="mt-10 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
						>
							{/* ── PRIMARY: Join the Pilot Program ── */}
							<Link
								href={`${appUrl}/signup`}
								className="btn-gold-primary"
							>
								{dict.hero.cta}
								<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Link>

							{/* ── SECONDARY: Become a Merchant Partner ── */}
							<Link
								href={`/${locale}/business`}
								className="btn-gold-outline"
							>
								<Store className="h-4 w-4 shrink-0" />
								{dict.hero.ctaSecondary}
							</Link>
						</motion.div>
					</div>

					{/* Right — Hero Image */}
					<motion.div
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={2}
						className="relative hidden lg:flex justify-center items-center"
					>
						<div className="relative w-full max-w-lg animate-float">
							{/* Glow effect behind image */}
							<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,139,120,0.20),transparent_70%)] animate-pulse-gold" />
							<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(198,167,86,0.10),transparent_60%)] translate-y-8" />
							<div className="absolute -inset-4 rounded-3xl border border-kob-gold/10 bg-gradient-to-br from-kob-teal/5 to-kob-gold/5 backdrop-blur-sm" />
							<Image
								src="/images/hero/hero-card-glow.png"
								alt="KobKlein digital payments"
								width={600}
								height={500}
								sizes="(max-width: 1024px) 100vw, 50vw"
								className="relative z-10 drop-shadow-2xl"
								priority
							/>
						</div>
					</motion.div>
				</div>

				{/* Feature blocks */}
				<motion.div
					variants={fadeUp}
					initial="hidden"
					animate="visible"
					custom={4}
					className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
				>
					{heroFeatures.map(({ key, icon: Icon }) => (
						<div key={key} className="text-center group">
							<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-kob-teal/10 border border-kob-teal/20 flex items-center justify-center group-hover:bg-kob-teal/20 transition-colors duration-300">
								<Icon className="w-7 h-7 text-kob-teal" />
							</div>
							<h3 className="text-lg font-semibold text-kob-text mb-2">
								{dict.hero.features[key].title}
							</h3>
							<p className="text-kob-muted text-sm">
								{dict.hero.features[key].description}
							</p>
						</div>
					))}
				</motion.div>

				{/* Stats */}
				<div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
					{stats.map((stat, i) => (
						<motion.div
							key={stat.label}
							variants={statReveal}
							initial="hidden"
							animate="visible"
							custom={i}
							className="text-center"
						>
							<div className="text-2xl md:text-3xl font-bold gradient-gold-text">
								{stat.value}
							</div>
							<div className="text-xs text-kob-muted mt-1 uppercase tracking-widest">
								{stat.label}
							</div>
						</motion.div>
					))}
				</div>
			</div>

			{/* Smooth transition gradient */}
			<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-kob-black pointer-events-none" />
		</section>
	);
}
