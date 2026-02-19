"use client";

import {
	Globe,
	Heart,
	Clock,
	DollarSign,
	ArrowRight,
	Users,
	Smartphone,
	Send,
	Star,
	Shield,
	Repeat,
	CalendarClock,
	CheckCircle2,
	MapPin,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

const slideIn: Variants = {
	hidden: { opacity: 0, x: -40 },
	visible: (i: number) => ({
		opacity: 1,
		x: 0,
		transition: {
			delay: i * 0.15,
			duration: 0.5,
			ease: "easeOut" as const,
		},
	}),
};

/* ── Data ── */

const feeComparison = [
	{
		provider: "Western Union",
		fee: "$12.00",
		speed: "1-3 days",
		rate: "Poor",
	},
	{
		provider: "MoneyGram",
		fee: "$9.99",
		speed: "1-2 days",
		rate: "Average",
	},
	{
		provider: "Remitly",
		fee: "$3.99",
		speed: "3-5 days",
		rate: "Average",
	},
	{
		provider: "KobKlein",
		fee: "$1.99",
		speed: "Instant",
		rate: "Best",
		highlight: true,
	},
];

const features = [
	{
		Icon: Users,
		title: "K-Link Family Panel",
		description:
			"Add family members to your panel with emoji avatars, favorites, and one-tap quick send. See who needs support at a glance.",
	},
	{
		Icon: Repeat,
		title: "Recurring Transfers",
		description:
			"Set up weekly, biweekly, or monthly scheduled transfers. Your family receives consistent support without you lifting a finger.",
	},
	{
		Icon: Clock,
		title: "Instant Delivery",
		description:
			"Money arrives in seconds, not days. Your family can use the funds immediately via their KobKlein wallet or cash out at any K-Agent.",
	},
	{
		Icon: Shield,
		title: "Bank-Grade Security",
		description:
			"Every transfer is protected by AES-256 encryption, real-time risk scoring, and OTP verification for high-value transactions.",
	},
	{
		Icon: DollarSign,
		title: "Best FX Rates",
		description:
			"Competitive real-time USD/HTG, CAD/HTG, and EUR/HTG exchange rates. See exactly what your family receives before you send.",
	},
	{
		Icon: CalendarClock,
		title: "Transaction History",
		description:
			"Full audit trail of every transfer. Track delivery status, view receipts, and manage your sending history in one place.",
	},
];

const steps = [
	{
		number: "01",
		title: "Download KobKlein",
		description:
			"Free on iOS and Android. Create your account in under 2 minutes with just your phone number.",
		Icon: Smartphone,
	},
	{
		number: "02",
		title: "Add Your Family",
		description:
			"Build your K-Link family panel. Add parents, siblings, children — anyone you support back home.",
		Icon: Heart,
	},
	{
		number: "03",
		title: "Send Money Home",
		description:
			"Tap send, enter the amount, confirm. Your family receives it instantly in their KobKlein wallet.",
		Icon: Send,
	},
];

const testimonials = [
	{
		name: "Marie J.",
		location: "Miami, FL",
		text: "I used to pay $12 every time I sent money home through Western Union. Now I send money to my mother every week for $1.99. She gets it instantly.",
	},
	{
		name: "Jean-Pierre D.",
		location: "Montreal, QC",
		text: "The recurring transfer feature changed everything. My parents receive support every month without me having to remember. It just works.",
	},
	{
		name: "Sophie L.",
		location: "Paris, France",
		text: "The K-Link family panel lets me see all my family in one place. I can send to my sister, my aunt, my cousins — all with one tap.",
	},
];

const diasporaCities = [
	"Miami",
	"New York",
	"Boston",
	"Montreal",
	"Paris",
	"Brooklyn",
	"Fort Lauderdale",
	"Newark",
	"Chicago",
	"Orlando",
];

export default function DiasporaPage() {
	const params = useParams();
	const loc = (params?.locale as string) || "en";

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
							<Globe className="h-4 w-4" />
							For the Haitian Diaspora
						</span>
					</motion.div>

					<motion.h1
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={1}
						className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text mt-8 mb-6 leading-[1.1] tracking-tight"
					>
						Send Money Home.{" "}
						<span className="gradient-gold-text">
							Instantly.
						</span>
					</motion.h1>

					<motion.p
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={2}
						className="text-xl text-kob-body font-light max-w-2xl mx-auto mb-10"
					>
						The fastest, cheapest way to support your family
						in Haiti. $1.99 flat fee. Instant delivery. Best
						exchange rates.
					</motion.p>

					<motion.div
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={3}
						className="flex flex-col sm:flex-row justify-center gap-4"
					>
						<Link
							href={`/${loc}/app`}
							className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-kob-gold text-kob-black font-semibold text-lg shadow-xl shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.02] transition-all duration-300 group"
						>
							Get Started Free
							<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
						</Link>
						<Link
							href={`/${loc}/fx-calculator`}
							className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl border border-white/10 text-kob-body font-medium hover:border-kob-gold/30 hover:text-kob-gold hover:bg-kob-gold/5 transition-all duration-300"
						>
							Check Exchange Rates
						</Link>
					</motion.div>
				</div>

				<div className="absolute bottom-0 left-0 right-0 divider-teal-gold" />
			</section>

			{/* ═══ The Problem — Fee Comparison ═══ */}
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
							Sending Money Home Shouldn&apos;t Cost a{" "}
							<span className="gradient-gold-text">
								Fortune
							</span>
						</h2>
						<p className="text-kob-muted max-w-2xl mx-auto text-lg">
							The Haitian diaspora sends over $4 billion in
							remittances annually. Legacy services charge
							excessive fees and take days to deliver.
							KobKlein changes everything.
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					{/* Fee Comparison Table */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="glass-card overflow-hidden"
					>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-white/[0.06]">
										<th className="text-left px-6 py-5 text-kob-muted font-medium text-xs uppercase tracking-wider">
											Provider
										</th>
										<th className="text-left px-6 py-5 text-kob-muted font-medium text-xs uppercase tracking-wider">
											Fee (US → Haiti,
											$200)
										</th>
										<th className="text-left px-6 py-5 text-kob-muted font-medium text-xs uppercase tracking-wider">
											Speed
										</th>
										<th className="text-left px-6 py-5 text-kob-muted font-medium text-xs uppercase tracking-wider">
											FX Rate
										</th>
									</tr>
								</thead>
								<tbody>
									{feeComparison.map(
										(row, i) => (
											<motion.tr
												key={
													row.provider
												}
												initial={{
													opacity: 0,
													x: -20,
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
												className={`border-b border-white/[0.04] transition-colors duration-200 ${
													row.highlight
														? "bg-kob-gold/5 hover:bg-kob-gold/8"
														: "hover:bg-white/[0.02]"
												}`}
											>
												<td className="px-6 py-5">
													<span
														className={
															row.highlight
																? "font-semibold text-kob-gold"
																: "text-kob-text"
														}
													>
														{
															row.provider
														}
													</span>
													{row.highlight && (
														<CheckCircle2 className="h-3.5 w-3.5 text-kob-emerald inline ml-2" />
													)}
												</td>
												<td
													className={`px-6 py-5 ${row.highlight ? "text-kob-gold font-semibold" : "text-kob-body"}`}
												>
													{row.fee}
												</td>
												<td
													className={`px-6 py-5 ${row.highlight ? "text-kob-gold font-semibold" : "text-kob-body"}`}
												>
													{
														row.speed
													}
												</td>
												<td
													className={`px-6 py-5 ${row.highlight ? "text-kob-gold font-semibold" : "text-kob-body"}`}
												>
													{row.rate}
												</td>
											</motion.tr>
										)
									)}
								</tbody>
							</table>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Features ═══ */}
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
							Built for{" "}
							<span className="gradient-gold-text">
								Diaspora Families
							</span>
						</h2>
						<p className="text-kob-muted text-lg">
							Every feature designed to make supporting
							your family easier
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
					>
						{features.map((f, i) => (
							<motion.div
								key={f.title}
								variants={fadeUp}
								custom={i}
							>
								<div className="glass-card p-8 h-full group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-5 group-hover:bg-kob-gold/15 group-hover:scale-110 transition-all duration-300">
										<f.Icon className="h-6 w-6 text-kob-gold" />
									</div>
									<h3 className="text-lg font-semibold text-kob-text mb-2">
										{f.title}
									</h3>
									<p className="text-sm text-kob-muted leading-relaxed">
										{f.description}
									</p>
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
							Send Money in{" "}
							<span className="gradient-gold-text">
								3 Simple Steps
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
						{steps.map((step, i) => (
							<motion.div
								key={step.number}
								variants={scaleIn}
								custom={i}
							>
								<div className="glass-card shimmer-gold p-8 text-center group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="relative w-14 h-14 rounded-full bg-kob-gold/10 border-2 border-kob-gold/30 flex items-center justify-center mx-auto mb-6 group-hover:bg-kob-gold/15 group-hover:scale-110 transition-all duration-300">
										<step.Icon className="h-6 w-6 text-kob-gold" />
										{/* Step number badge */}
										<div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-kob-gold text-kob-black text-xs font-bold flex items-center justify-center shadow-lg">
											{i + 1}
										</div>
									</div>
									<span className="text-xs font-bold text-kob-gold tracking-widest uppercase">
										STEP{" "}
										{step.number}
									</span>
									<h3 className="text-lg font-semibold text-kob-text mt-3 mb-3">
										{step.title}
									</h3>
									<p className="text-sm text-kob-muted leading-relaxed">
										{step.description}
									</p>
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Testimonials ═══ */}
			<section className="py-24 md:py-32 bg-kob-black">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-16"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
							Voices from the{" "}
							<span className="gradient-gold-text">
								Diaspora
							</span>
						</h2>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-1 md:grid-cols-3 gap-6"
					>
						{testimonials.map((t, i) => (
							<motion.div
								key={t.name}
								variants={slideIn}
								custom={i}
							>
								<div className="glass-card p-8 h-full group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="flex gap-1 mb-5">
										{Array.from({
											length: 5,
										}).map((_, j) => (
											<Star
												key={j}
												className="h-4 w-4 fill-kob-gold text-kob-gold"
											/>
										))}
									</div>
									<p className="text-sm text-kob-body leading-relaxed mb-6">
										&ldquo;{t.text}
										&rdquo;
									</p>
									<div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
										<div className="w-9 h-9 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center">
											<span className="text-xs font-bold text-kob-gold">
												{t.name.charAt(
													0
												)}
											</span>
										</div>
										<div>
											<span className="block text-sm font-semibold text-kob-text">
												{t.name}
											</span>
											<span className="text-xs text-kob-muted">
												{
													t.location
												}
											</span>
										</div>
									</div>
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Diaspora Cities ═══ */}
			<section className="py-20 md:py-28 bg-kob-navy glow-teal-gold">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<div className="w-14 h-14 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-6">
							<Globe className="h-7 w-7 text-kob-gold" />
						</div>
						<h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-8">
							Serving Haitians{" "}
							<span className="gradient-gold-text">
								Everywhere
							</span>
						</h2>
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="flex flex-wrap justify-center gap-3"
					>
						{diasporaCities.map((city, i) => (
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

			{/* ═══ CTA ═══ */}
			<section className="relative py-24 md:py-32 bg-kob-black overflow-hidden">
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
							Your Family Is{" "}
							<span className="gradient-gold-text">
								Waiting
							</span>
						</h2>
						<div className="mt-4 mb-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
						<p className="text-kob-muted text-lg mb-10 max-w-xl mx-auto">
							Join thousands of diaspora members who
							already send money home with KobKlein.
							$1.99 flat fee. Instant delivery. Best
							rates.
						</p>
						<Link
							href={`/${loc}/app`}
							className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-kob-gold text-kob-black font-semibold text-lg shadow-xl shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.02] transition-all duration-300 group"
						>
							Start Sending Now
							<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
						</Link>
					</motion.div>
				</div>
			</section>
		</>
	);
}
