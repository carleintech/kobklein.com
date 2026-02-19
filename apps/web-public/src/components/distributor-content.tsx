"use client";

import {
	ArrowRight,
	DollarSign,
	Users,
	HeadphonesIcon,
	TrendingUp,
	MapPin,
	Smartphone,
	CheckCircle2,
	Handshake,
	Banknote,
	Store,
	Clock,
	Shield,
} from "lucide-react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";

/* ── Animation Variants ── */

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 30 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: i * 0.12,
			duration: 0.6,
			ease: "easeOut" as const,
		},
	}),
};

const stagger: Variants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn: Variants = {
	hidden: { opacity: 0, scale: 0.9 },
	visible: (i: number) => ({
		opacity: 1,
		scale: 1,
		transition: {
			delay: i * 0.05,
			duration: 0.4,
			ease: "easeOut" as const,
		},
	}),
};

/* ── Data ── */

const benefitIcons = [DollarSign, Users, HeadphonesIcon, TrendingUp] as const;

const howItWorks = [
	{
		number: "01",
		title: "Apply Online",
		description:
			"Fill out a short application. We review your business location, capacity, and community reach.",
		Icon: Smartphone,
	},
	{
		number: "02",
		title: "Get Trained & Equipped",
		description:
			"Receive your K-Agent kit with training materials, signage, and access to the K-Agent dashboard.",
		Icon: Store,
	},
	{
		number: "03",
		title: "Start Earning",
		description:
			"Begin processing cash-in and cash-out transactions. Earn commissions on every transaction instantly.",
		Icon: Banknote,
	},
];

const stats = [
	{ value: "5-8%", label: "Commission per Transaction" },
	{ value: "2 min", label: "Average Transaction Time" },
	{ value: "24/7", label: "Dashboard & Support" },
	{ value: "500+", label: "Active K-Agents" },
];

const requirements = [
	"Valid business registration or government ID",
	"Physical location accessible to customers",
	"Smartphone with internet access",
	"Initial float capital (starting from $100)",
	"Commitment to serve the community",
];

/* ── Types ── */

interface DistributorContentProps {
	dict: any;
	locale: string;
}

export function DistributorContent({
	dict,
	locale,
}: DistributorContentProps) {
	const benefitKeys = [
		"earn",
		"community",
		"support",
		"grow",
	] as const;

	return (
		<>
			{/* ═══ Hero ═══ */}
			<section className="relative overflow-hidden min-h-[85vh] flex flex-col justify-center">
				<div className="absolute inset-0 bg-kob-black" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,168,76,0.14),transparent)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_70%,rgba(201,168,76,0.06),transparent)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_20%_60%,rgba(14,139,120,0.05),transparent)]" />
				<div className="absolute inset-0 gold-dust" />

				<div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
					<motion.div
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={0}
					>
						<span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-kob-gold/5 text-kob-gold border border-kob-gold/25 backdrop-blur-sm">
							<Handshake className="h-4 w-4" />
							K-Agent Program
						</span>
					</motion.div>

					<motion.h1
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={1}
						className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text mt-8 mb-6 leading-[1.1] tracking-tight"
					>
						{dict.distributor.title.replace(
							"K-Agent",
							""
						)}
						<span className="gradient-gold-text">
							K-Agent
						</span>
					</motion.h1>

					<motion.p
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={2}
						className="text-xl text-kob-gold font-light mb-4"
					>
						{dict.distributor.subtitle}
					</motion.p>

					<motion.p
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={3}
						className="text-lg text-kob-body font-light max-w-2xl mx-auto mb-10"
					>
						{dict.distributor.description}
					</motion.p>

					<motion.div
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={4}
						className="flex flex-col sm:flex-row justify-center gap-4"
					>
						<a
							href="#apply"
							className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-kob-gold text-kob-black font-semibold text-lg shadow-xl shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.02] transition-all duration-300 group"
						>
							{dict.distributor.apply}
							<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
						</a>
						<Link
							href={`/${locale}/how-it-works`}
							className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl border border-white/10 text-kob-body font-medium hover:border-kob-gold/30 hover:text-kob-gold hover:bg-kob-gold/5 transition-all duration-300"
						>
							Learn How It Works
						</Link>
					</motion.div>
				</div>

				<div className="absolute bottom-0 left-0 right-0 divider-teal-gold" />
			</section>

			{/* ═══ Benefits ═══ */}
			<section className="py-24 md:py-32 bg-kob-navy">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-16"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
							Why Become a{" "}
							<span className="gradient-gold-text">
								K-Agent?
							</span>
						</h2>
						<p className="text-kob-muted text-lg max-w-2xl mx-auto">
							Join a network that empowers you
							to earn while serving your
							community
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-1 md:grid-cols-2 gap-6"
					>
						{benefitKeys.map((key, i) => {
							const benefit =
								dict.distributor
									.benefits[key];
							const Icon =
								benefitIcons[i];
							return (
								<motion.div
									key={key}
									variants={fadeUp}
									custom={i}
								>
									<div className="glass-card p-8 h-full group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
										<div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-5 group-hover:bg-kob-gold/15 group-hover:scale-110 transition-all duration-300">
											<Icon className="h-6 w-6 text-kob-gold" />
										</div>
										<h3 className="text-lg font-semibold text-kob-text mb-3">
											{
												benefit.title
											}
										</h3>
										<p className="text-sm text-kob-muted leading-relaxed">
											{
												benefit.description
											}
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

			{/* ═══ Stats ═══ */}
			<section className="py-24 md:py-32 bg-kob-black glow-teal-gold">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-16"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
							K-Agent{" "}
							<span className="gradient-gold-text">
								Network
							</span>
						</h2>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-2 md:grid-cols-4 gap-6"
					>
						{stats.map((stat, i) => (
							<motion.div
								key={stat.label}
								variants={scaleIn}
								custom={i}
							>
								<div className="glass-card p-6 text-center hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="text-3xl md:text-4xl font-bold gradient-gold-text font-serif-luxury mb-3">
										{stat.value}
									</div>
									<div className="text-xs text-kob-muted leading-relaxed">
										{stat.label}
									</div>
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ How It Works ═══ */}
			<section className="py-24 md:py-32 bg-kob-navy">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-16"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
							How to Get{" "}
							<span className="gradient-gold-text">
								Started
							</span>
						</h2>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-1 md:grid-cols-3 gap-8"
					>
						{howItWorks.map((step, i) => (
							<motion.div
								key={step.number}
								variants={scaleIn}
								custom={i}
							>
								<div className="glass-card shimmer-gold p-8 text-center group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="relative w-14 h-14 rounded-full bg-kob-gold/10 border-2 border-kob-gold/30 flex items-center justify-center mx-auto mb-6 group-hover:bg-kob-gold/15 group-hover:scale-110 transition-all duration-300">
										<step.Icon className="h-6 w-6 text-kob-gold" />
										<div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-kob-gold text-kob-black text-xs font-bold flex items-center justify-center shadow-lg">
											{i +
												1}
										</div>
									</div>
									<span className="text-xs font-bold text-kob-gold tracking-widest uppercase">
										STEP{" "}
										{
											step.number
										}
									</span>
									<h3 className="text-lg font-semibold text-kob-text mt-3 mb-3">
										{step.title}
									</h3>
									<p className="text-sm text-kob-muted leading-relaxed">
										{
											step.description
										}
									</p>
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Requirements ═══ */}
			<section className="py-24 md:py-32 bg-kob-black glow-teal-gold">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
						<motion.div
							initial={{ opacity: 0, x: -30 }}
							whileInView={{
								opacity: 1,
								x: 0,
							}}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
						>
							<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
								What You{" "}
								<span className="gradient-gold-text">
									Need
								</span>
							</h2>
							<div className="mt-4 mb-6 w-24 h-0.5 bg-gradient-to-r from-kob-gold via-kob-gold/60 to-transparent" />
							<p className="text-kob-muted text-lg leading-relaxed">
								Becoming a K-Agent is simple.
								If you have a physical
								location and want to serve
								your community, you qualify.
							</p>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, x: 30 }}
							whileInView={{
								opacity: 1,
								x: 0,
							}}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
						>
							<div className="glass-card p-8">
								<div className="space-y-4">
									{requirements.map(
										(req, i) => (
											<motion.div
												key={
													req
												}
												initial={{
													opacity: 0,
													x: 20,
												}}
												whileInView={{
													opacity: 1,
													x: 0,
												}}
												viewport={{
													once: true,
												}}
												transition={{
													delay:
														0.3 +
														i *
															0.1,
													duration: 0.4,
												}}
												className="flex items-center gap-3 text-sm text-kob-body"
											>
												<div className="w-6 h-6 rounded-full bg-kob-emerald/10 border border-kob-emerald/20 flex items-center justify-center shrink-0">
													<CheckCircle2 className="h-3.5 w-3.5 text-kob-emerald" />
												</div>
												{req}
											</motion.div>
										)
									)}
								</div>
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Locations ═══ */}
			<section className="py-20 md:py-28 bg-kob-navy">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<div className="w-14 h-14 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-6">
							<MapPin className="h-7 w-7 text-kob-gold" />
						</div>
						<h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-4">
							K-Agents Needed{" "}
							<span className="gradient-gold-text">
								Everywhere
							</span>
						</h2>
						<p className="text-kob-muted text-lg mb-8 max-w-xl mx-auto">
							We&apos;re expanding across
							Haiti and diaspora communities.
							Your neighborhood could be next.
						</p>
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="flex flex-wrap justify-center gap-3"
					>
						{[
							"Port-au-Prince",
							"Cap-Haïtien",
							"Les Cayes",
							"Gonaïves",
							"Jacmel",
							"Jérémie",
							"Hinche",
							"Petit-Goâve",
							"Miami",
							"Montreal",
							"New York",
							"Paris",
						].map((city, i) => (
							<motion.div
								key={city}
								variants={scaleIn}
								custom={i}
							>
								<div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/[0.08] bg-kob-panel/40 text-sm text-kob-body hover:border-kob-gold/25 hover:text-kob-gold hover:bg-kob-gold/5 transition-all duration-300 cursor-default">
									<MapPin className="h-3.5 w-3.5 text-kob-gold/60" />
									{city}
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Apply CTA ═══ */}
			<section
				id="apply"
				className="relative py-24 md:py-32 bg-kob-black overflow-hidden"
			>
				{/* Decorative glows */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(201,168,76,0.06),transparent)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_30%_70%,rgba(14,139,120,0.04),transparent)]" />

				{/* Gold particles */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					{[...Array(4)].map((_, i) => (
						<div
							key={i}
							className="absolute w-1 h-1 rounded-full bg-kob-gold/40"
							style={{
								left: `${20 + i * 20}%`,
								animation: `particle-float ${9 + i * 2}s linear infinite`,
								animationDelay: `${-i * 2.5}s`,
							}}
						/>
					))}
				</div>

				<div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.7 }}
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
							Ready to{" "}
							<span className="gradient-gold-text">
								Join?
							</span>
						</h2>
						<div className="mt-4 mb-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
						<p className="text-kob-muted text-lg mb-10 max-w-xl mx-auto">
							Start earning today. Apply to
							become a K-Agent and help build
							Haiti&apos;s digital payment
							infrastructure.
						</p>

						<div className="flex flex-col sm:flex-row justify-center gap-4">
							<a
								href={`/${locale}/app`}
								className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-kob-gold text-kob-black font-semibold text-lg shadow-xl shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.02] transition-all duration-300 group"
							>
								{
									dict
										.distributor
										.apply
								}
								<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
							</a>
						</div>

						{/* Trust signals */}
						<div className="mt-10 flex items-center justify-center gap-6 text-sm text-kob-muted">
							{[
								{
									icon: Shield,
									label: "Licensed & Regulated",
								},
								{
									icon: Clock,
									label: "Apply in 5 min",
								},
								{
									icon: DollarSign,
									label: "No Franchise Fees",
								},
							].map(
								({
									icon: Icon,
									label,
								}) => (
									<div
										key={label}
										className="flex items-center gap-2"
									>
										<Icon className="h-4 w-4 text-kob-gold/60" />
										{label}
									</div>
								)
							)}
						</div>
					</motion.div>
				</div>
			</section>
		</>
	);
}
