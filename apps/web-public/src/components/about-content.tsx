"use client";

import { motion, type Variants } from "framer-motion";
import type { Dictionary } from "@/i18n";
import { CtaSection } from "@/components/sections/cta";
import Image from "next/image";
import Link from "next/link";
import {
	Heart,
	Lightbulb,
	Lock,
	Users,
	Globe,
	Banknote,
	TrendingUp,
	Building2,
	ArrowRight,
	Landmark,
	MapPin,
	Smartphone,
	Target,
	Eye,
} from "lucide-react";

/* ── Animation variants ── */
const fadeUp: Variants = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: "easeOut" as const },
	},
};

const fadeLeft: Variants = {
	hidden: { opacity: 0, x: -30 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: 0.6, ease: "easeOut" as const },
	},
};

const staggerContainer: Variants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.12 } },
};

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

const slideInLeft: Variants = {
	hidden: { opacity: 0, x: -40 },
	visible: (i: number) => ({
		opacity: 1,
		x: 0,
		transition: {
			duration: 0.6,
			delay: i * 0.18,
			ease: "easeOut" as const,
		},
	}),
};

export function AboutContent({
	dict,
	locale,
}: {
	dict: Dictionary;
	locale: string;
}) {
	const loc = locale || "en";

	const stats = [
		{ Icon: Users, ...dict.about.stats.users },
		{ Icon: Banknote, ...dict.about.stats.transfers },
		{ Icon: Globe, ...dict.about.stats.countries },
		{ Icon: TrendingUp, ...dict.about.stats.uptime },
	];

	const foundingCards = [
		{ icon: MapPin, ...dict.about.founding.problem },
		{ icon: Lightbulb, ...dict.about.founding.solution },
		{ icon: Globe, ...dict.about.founding.reach },
	];

	const values = [
		{ Icon: Heart, key: "trust" as const },
		{ Icon: Users, key: "accessibility" as const },
		{ Icon: Lock, key: "security" as const },
		{ Icon: Lightbulb, key: "innovation" as const },
	];

	const milestones = [
		{ Icon: Building2, ...dict.about.journey.m1 },
		{ Icon: Smartphone, ...dict.about.journey.m2 },
		{ Icon: Globe, ...dict.about.journey.m3 },
		{ Icon: Landmark, ...dict.about.journey.m4 },
	];

	return (
		<>
			{/* ═══ Hero ═══ */}
			<section className="relative overflow-hidden gold-dust">
				{/* Video background */}
				<video
					autoPlay
					muted
					loop
					playsInline
					className="absolute inset-0 w-full h-full object-cover opacity-20"
				>
					<source src="/video/about-hero.mp4" type="video/mp4" />
				</video>
				<div className="absolute inset-0 gradient-sovereign" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,139,120,0.08),transparent_60%)]" />

				<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						{/* Left — Text */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7 }}
							className="text-center lg:text-left"
						>
							<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-kob-teal/10 text-kob-teal border border-kob-teal/30 mb-6 backdrop-blur-sm">
								<span className="w-2 h-2 rounded-full bg-kob-teal animate-pulse" />
								{dict.about.badge}
							</span>
							<h1 className="font-serif-luxury text-4xl md:text-5xl lg:text-6xl font-bold gradient-gold-text leading-tight mb-4">
								{dict.about.title}
							</h1>
							<p className="text-lg text-kob-body max-w-xl mx-auto lg:mx-0">
								{dict.about.subtitle}
							</p>
						</motion.div>

						{/* Right — Hero Image */}
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.8, delay: 0.2 }}
							className="relative flex justify-center items-center"
						>
							<div className="relative w-full max-w-lg animate-float">
								{/* Glass frame */}
								<div className="absolute -inset-4 rounded-3xl border border-kob-gold/10 bg-gradient-to-br from-kob-teal/5 to-kob-gold/5 backdrop-blur-sm" />
								{/* Glow effects */}
								<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,139,120,0.18),transparent_70%)]" />
								<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(198,167,86,0.10),transparent_60%)] translate-y-8 animate-pulse-gold" />
								<Image
									src="/images/hero/about.png"
									alt="KobKlein empowering seamless payments"
									width={600}
									height={450}
									className="relative z-10 drop-shadow-2xl rounded-2xl"
									priority
								/>
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* ═══ Founding Story ═══ */}
			<section className="py-24 md:py-32 bg-kob-navy glow-teal-gold">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
						<motion.div
							variants={fadeLeft}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true }}
						>
							<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-6">
								{dict.about.founding.title}
							</h2>
							<div className="mt-4 w-24 h-0.5 bg-gradient-to-r from-kob-gold via-kob-gold/60 to-transparent mb-8" />
							<div className="space-y-4 text-sm text-kob-body leading-relaxed">
								<p>{dict.about.founding.p1}</p>
								<p>{dict.about.founding.p2}</p>
								<p>{dict.about.founding.p3}</p>
							</div>
						</motion.div>

						<div className="space-y-4">
							{foundingCards.map((item, i) => (
								<motion.div
									key={item.label}
									variants={cardReveal}
									initial="hidden"
									whileInView="visible"
									viewport={{ once: true }}
									custom={i}
								>
									<div className="card-sovereign shimmer-gold p-5 flex gap-4 group hover:border-kob-gold/20 hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
										<div className="w-10 h-10 rounded-lg bg-kob-teal/10 border border-kob-teal/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-kob-teal/15 transition-all duration-300">
											<item.icon className="h-5 w-5 text-kob-teal" />
										</div>
										<div>
											<h3 className="text-sm font-semibold text-kob-text">
												{item.label}
											</h3>
											<p className="text-xs text-kob-muted mt-1">
												{item.text}
											</p>
										</div>
									</div>
								</motion.div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Stats ═══ */}
			<section className="py-20 md:py-28 bg-kob-black">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						variants={staggerContainer}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-2 md:grid-cols-4 gap-6"
					>
						{stats.map((s, i) => (
							<motion.div
								key={s.label}
								variants={cardReveal}
								custom={i}
							>
								<div className="text-center glass-card p-6 hover:scale-105 hover:shadow-lg hover:shadow-kob-gold/10 transition-all duration-300">
									<s.Icon className="h-6 w-6 text-kob-gold/60 mx-auto mb-3 animate-pulse-gold" />
									<div className="text-4xl font-bold gradient-gold-text font-serif-luxury">
										{s.value}
									</div>
									<div className="text-sm text-kob-muted mt-1">
										{s.label}
									</div>
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Mission & Vision ═══ */}
			<section className="py-24 md:py-32 bg-kob-navy glow-teal-gold">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-12"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
							{dict.mission.title}
						</h2>
						<p className="text-kob-muted max-w-2xl mx-auto">
							{dict.mission.description}
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
						<motion.div
							variants={fadeUp}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true }}
						>
							<div className="glass-card shimmer-gold p-8 h-full">
								<div className="w-12 h-12 rounded-xl bg-kob-gold/10 flex items-center justify-center mb-5">
									<Target className="h-6 w-6 text-kob-gold" />
								</div>
								<h3 className="text-lg font-semibold text-kob-text mb-3">
									{dict.mission.title}
								</h3>
								<p className="text-sm text-kob-body leading-relaxed">
									{dict.about.missionCard}
								</p>
							</div>
						</motion.div>
						<motion.div
							variants={fadeUp}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true }}
						>
							<div className="glass-card shimmer-gold p-8 h-full">
								<div className="w-12 h-12 rounded-xl bg-kob-teal/10 flex items-center justify-center mb-5">
									<Eye className="h-6 w-6 text-kob-teal" />
								</div>
								<h3 className="text-lg font-semibold text-kob-text mb-3">
									{dict.mission.vision.title}
								</h3>
								<p className="text-sm text-kob-body leading-relaxed">
									{dict.mission.vision.description}
								</p>
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* ═══ Core Values ═══ */}
			<section className="py-24 md:py-32 bg-kob-black">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-12"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
							{dict.mission.values.title}
						</h2>
						<div className="mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={staggerContainer}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-1 md:grid-cols-2 gap-6"
					>
						{values.map((v, i) => {
							const val = dict.mission.values[v.key];
							if (typeof val === "string") return null;
							return (
								<motion.div
									key={v.key}
									variants={cardReveal}
									custom={i}
								>
									<div className="card-sovereign shimmer-gold p-8 group hover:border-kob-gold/20 hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
										<div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-5 group-hover:bg-kob-gold/15 group-hover:border-kob-gold/30 transition-all duration-300">
											<v.Icon className="h-6 w-6 text-kob-gold" />
										</div>
										<h3 className="text-lg font-semibold text-kob-text mb-2">
											{val.title}
										</h3>
										<p className="text-sm text-kob-muted leading-relaxed">
											{val.description}
										</p>
									</div>
								</motion.div>
							);
						})}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Timeline ═══ */}
			<section className="py-24 md:py-32 bg-kob-navy">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-14"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
							{dict.about.journey.title}
						</h2>
						<p className="text-kob-muted">
							{dict.about.journey.subtitle}
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<div className="space-y-6">
						{milestones.map((m, i) => (
							<motion.div
								key={m.title}
								variants={slideInLeft}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true }}
								custom={i}
							>
								<div className="card-sovereign p-6 flex gap-5 group hover:border-kob-gold/20 hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="flex flex-col items-center flex-shrink-0">
										<div className="relative w-12 h-12 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-kob-gold/15 transition-all duration-300">
											<m.Icon className="h-5 w-5 text-kob-gold" />
											{/* Step number */}
											<div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-kob-gold text-kob-black text-[10px] font-bold flex items-center justify-center shadow-lg">
												{i + 1}
											</div>
										</div>
										{i < milestones.length - 1 && (
											<div className="w-px flex-1 mt-2 bg-gradient-to-b from-kob-gold/30 via-kob-teal/20 to-transparent animate-gradient-shift bg-[length:100%_200%]" />
										)}
									</div>
									<div className="pt-1">
										<span className="inline-flex items-center px-3 py-0.5 rounded-full bg-kob-gold/10 text-kob-gold border border-kob-gold/20 text-xs font-medium">
											{m.year}
										</span>
										<h3 className="text-base font-semibold text-kob-text mt-2">
											{m.title}
										</h3>
										<p className="text-sm text-kob-muted mt-1 leading-relaxed">
											{m.description}
										</p>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ═══ Team Preview ═══ */}
			<section className="relative py-24 md:py-32 bg-kob-black overflow-hidden">
				{/* Decorative particles */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="absolute w-1 h-1 rounded-full bg-kob-gold/40"
							style={{
								left: `${25 + i * 25}%`,
								animation: `particle-float ${10 + i * 2}s linear infinite`,
								animationDelay: `${-i * 3}s`,
							}}
						/>
					))}
				</div>

				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7 }}
					className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
				>
					<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
						{dict.about.team.title}
					</h2>
					<div className="mt-2 mb-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					<p className="text-kob-muted mb-10 max-w-xl mx-auto">
						{dict.about.team.subtitle}
					</p>
					<Link
						href={`/${loc}/team`}
						className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-kob-gold text-kob-black font-semibold shadow-lg shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.02] transition-all duration-300 group"
					>
						{dict.about.team.cta}
						<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
					</Link>
				</motion.div>
			</section>

			{/* ═══ CTA ═══ */}
			<CtaSection dict={dict} />
		</>
	);
}
