"use client";

import {
	Download,
	UserPlus,
	Wallet,
	CreditCard,
	ArrowRight,
	User,
	Globe,
	Store,
	MapPin,
	Shield,
	Lock,
	FileCheck,
	Fingerprint,
	Smartphone,
	CheckCircle,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";

/* ── Animation Variants ── */

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 30 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" },
	}),
};

const stagger: Variants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.1 } },
};

const slideIn: Variants = {
	hidden: { opacity: 0, x: -40 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: 0.6, ease: "easeOut" },
	},
};

const slideInRight: Variants = {
	hidden: { opacity: 0, x: 40 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { duration: 0.6, ease: "easeOut" },
	},
};

const scaleIn: Variants = {
	hidden: { opacity: 0, scale: 0.9 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { duration: 0.5, ease: "easeOut" },
	},
};

/* ── Data ── */

const steps = [
	{
		icon: Download,
		number: "01",
		title: "Download the App",
		description:
			"Get KobKlein from the App Store or Google Play. The app is lightweight, low-bandwidth optimized, and multilingual (Kreyòl, French, English).",
		details: [
			"Available on iOS 15+ and Android 8+",
			"Optimized for emerging market connectivity",
			"Secure cloud-based infrastructure",
			"Offline balance viewing capability",
		],
	},
	{
		icon: UserPlus,
		number: "02",
		title: "Create & Verify Your Wallet",
		description:
			"Secure onboarding using identity verification aligned with AML/KYC standards. Approval timelines may vary based on compliance review.",
		details: [
			"Phone-based registration",
			"Government ID verification",
			"Biometric confirmation",
			"Tiered limits based on verification level",
		],
	},
	{
		icon: Wallet,
		number: "03",
		title: "Fund via Licensed Partner",
		description:
			"Users may fund wallets through authorized financial and distribution partners. Availability may vary by region and regulatory approval.",
		details: [
			"Bank transfer (via partner institutions)",
			"Authorized K-Agent cash-in",
			"Wallet-to-wallet transfers",
			"Diaspora funding through licensed payment corridors",
		],
	},
	{
		icon: CreditCard,
		number: "04",
		title: "Pay, Transfer, or Withdraw",
		description:
			"KobKlein enables secure digital transactions within its ecosystem. Future card-based purchasing is subject to licensed partner approval.",
		details: [
			"QR-based merchant payments",
			"Instant wallet-to-wallet transfers",
			"Authorized cash-out via K-Agents",
			"K-Card online purchasing (subject to partner approval)",
		],
	},
];

const userTypes = [
	{
		icon: User,
		title: "Individuals",
		description:
			"Manage your daily finances with a secure digital wallet. Pay for groceries, utilities, school fees, and more without carrying cash. Earn rewards on every transaction.",
		features: [
			"Free P2P transfers",
			"Bill payment",
			"Savings goals",
			"Transaction history",
		],
	},
	{
		icon: Globe,
		title: "Diaspora",
		description:
			"Send structured support to family in Haiti through licensed payment channels. Transparent pricing displayed before confirmation. Near real-time wallet delivery, subject to verification and partner processing.",
		features: [
			"Transparent fee structure",
			"Near real-time delivery",
			"FX rate shown before confirmation",
			"Scheduled transfers",
		],
	},
	{
		icon: Store,
		title: "Merchants",
		description:
			"Accept digital payments with no expensive hardware. Generate QR codes, track sales in real time, and receive structured settlement to your KobKlein wallet.",
		features: [
			"QR code acceptance",
			"Transaction reporting",
			"Merchant dashboard",
			"Structured settlement",
		],
	},
	{
		icon: MapPin,
		title: "Authorized K-Agents",
		description:
			"Become an authorized KobKlein distribution partner and earn commissions on managed cash-in and cash-out transactions within your community.",
		features: [
			"Commission earnings",
			"Agent dashboard",
			"Compliance training",
			"Float management tools",
		],
	},
];

const techFeatures = [
	{
		icon: Lock,
		title: "End-to-End Encryption",
		description:
			"All data is encrypted in transit with TLS 1.3 and at rest with AES-256. Your financial data never travels unprotected.",
	},
	{
		icon: Fingerprint,
		title: "Biometric Authentication",
		description:
			"Secure every transaction with fingerprint or face recognition. Combined with PIN backup for maximum security and convenience.",
	},
	{
		icon: FileCheck,
		title: "Regulatory Compliance",
		description:
			"KobKlein operates under a partner-based financial services model designed to align with applicable regulatory frameworks. AML/KYC procedures are integrated throughout the platform.",
	},
	{
		icon: Shield,
		title: "Fraud Prevention",
		description:
			"AI-powered transaction monitoring detects suspicious activity in real time. Automatic alerts and account freezing protect your funds 24/7.",
	},
];

export default function HowItWorksPage() {
	return (
		<>
			{/* ═══ Hero ═══ */}
			<section className="relative overflow-hidden bg-kob-black gold-dust">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,168,76,0.10),transparent)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_30%_80%,rgba(14,139,120,0.06),transparent)]" />
				<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-28 text-center">
					<motion.div
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={0}
						className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-kob-gold/25 bg-kob-gold/5 text-sm text-kob-gold mb-8 backdrop-blur-sm"
					>
						<Smartphone className="h-4 w-4" />
						Simple &amp; Secure
					</motion.div>
					<motion.h1
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={1}
						className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text leading-[1.1] tracking-tight"
					>
						How{" "}
						<span className="gradient-gold-text">KobKlein</span>{" "}
						Works
					</motion.h1>
					<motion.p
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={2}
						className="mt-6 text-xl text-kob-body max-w-2xl mx-auto"
					>
						From download to your first payment in minutes. A
						seamless financial experience designed for Haiti and the
						Haitian diaspora.
					</motion.p>
					<motion.div
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={3}
						className="mt-8 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent"
					/>
				</div>
				<div className="divider-teal-gold" />
			</section>

			{/* ═══ 4-Step Process ═══ */}
			<section className="bg-kob-navy py-24 md:py-32 glow-teal-gold">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						variants={fadeUp}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						custom={0}
						className="text-center mb-20"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text">
							Get Started in{" "}
							<span className="gradient-gold-text">
								4 Simple Steps
							</span>
						</h2>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<div className="space-y-20">
						{steps.map((step, i) => {
							const isEven = i % 2 === 1;
							return (
								<div
									key={step.number}
									className="grid lg:grid-cols-2 gap-12 items-center"
								>
									{/* Text side */}
									<motion.div
										variants={
											isEven ? slideInRight : slideIn
										}
										initial="hidden"
										whileInView="visible"
										viewport={{ once: true }}
										className={
											isEven ? "lg:order-2" : ""
										}
									>
										<div className="flex items-center gap-4 mb-6">
											<div className="relative w-16 h-16 rounded-2xl bg-kob-gold/10 flex items-center justify-center border border-kob-gold/20 group-hover:bg-kob-gold/15 transition-all duration-300">
												<step.icon className="h-8 w-8 text-kob-gold" />
												{/* Step badge */}
												<div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-kob-gold text-kob-black text-xs font-bold flex items-center justify-center shadow-lg shadow-kob-gold/30">
													{i + 1}
												</div>
											</div>
											<div>
												<span className="text-kob-gold font-mono text-sm tracking-wider">
													STEP {step.number}
												</span>
												<h3 className="font-serif-luxury text-2xl font-bold text-kob-text">
													{step.title}
												</h3>
											</div>
										</div>
										<p className="text-kob-body leading-relaxed mb-6">
											{step.description}
										</p>
										<ul className="space-y-3">
											{step.details.map((detail, j) => (
												<li
													key={j}
													className="flex items-center gap-3 text-kob-body text-sm"
												>
													<CheckCircle className="h-4 w-4 text-kob-gold/70 flex-shrink-0" />
													{detail}
												</li>
											))}
										</ul>
									</motion.div>

									{/* Visual side */}
									<motion.div
										variants={scaleIn}
										initial="hidden"
										whileInView="visible"
										viewport={{ once: true }}
										className={
											isEven ? "lg:order-1" : ""
										}
									>
										<div className="glass-card p-12 flex items-center justify-center group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-500">
											<div className="text-center">
												<div className="text-8xl font-serif-luxury font-bold gradient-gold-text opacity-20 mb-4 group-hover:opacity-30 transition-opacity duration-500">
													{step.number}
												</div>
												<div className="w-20 h-20 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-kob-gold/15 transition-all duration-300">
													<step.icon className="h-10 w-10 text-kob-gold/60 group-hover:text-kob-gold transition-colors duration-300" />
												</div>
											</div>
										</div>
									</motion.div>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ For Different Users ═══ */}
			<section className="bg-kob-black py-24 md:py-32">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						variants={fadeUp}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						custom={0}
						className="text-center mb-16"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text">
							Built for{" "}
							<span className="gradient-gold-text">
								Everyone
							</span>
						</h2>
						<p className="mt-4 text-kob-body max-w-xl mx-auto">
							Whether you are managing daily expenses, sending
							money home, running a business, or serving your
							community, KobKlein works for you.
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
					>
						{userTypes.map((type, i) => (
							<motion.div
								key={type.title}
								variants={fadeUp}
								custom={i}
							>
								<div className="card-sovereign shimmer-gold p-8 h-full group hover:border-kob-gold/20 hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-5 group-hover:bg-kob-gold/15 group-hover:scale-110 transition-all duration-300">
										<type.icon className="h-6 w-6 text-kob-gold" />
									</div>
									<h3 className="font-serif-luxury text-xl font-semibold text-kob-text mb-3">
										{type.title}
									</h3>
									<p className="text-kob-body text-sm leading-relaxed mb-5">
										{type.description}
									</p>
									<ul className="space-y-2">
										{type.features.map((feature, j) => (
											<li
												key={j}
												className="flex items-center gap-2 text-kob-muted text-xs"
											>
												<span className="w-1.5 h-1.5 rounded-full bg-kob-gold/60 flex-shrink-0" />
												{feature}
											</li>
										))}
									</ul>
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Technology Section ═══ */}
			<section className="bg-kob-navy py-24 md:py-32 glow-teal-gold">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						variants={fadeUp}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						custom={0}
						className="text-center mb-16"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text">
							Powered by{" "}
							<span className="gradient-gold-text">
								Trust &amp; Technology
							</span>
						</h2>
						<p className="mt-4 text-kob-body max-w-xl mx-auto">
							Enterprise-level security architecture protecting every
							transaction, every account, every day.
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid sm:grid-cols-2 gap-6"
					>
						{techFeatures.map((feature, i) => (
							<motion.div
								key={feature.title}
								variants={fadeUp}
								custom={i}
							>
								<div className="glass-card p-8 flex items-start gap-5 group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center flex-shrink-0 group-hover:bg-kob-gold/15 group-hover:scale-110 transition-all duration-300">
										<feature.icon className="h-6 w-6 text-kob-gold" />
									</div>
									<div>
										<h3 className="font-serif-luxury text-lg font-semibold text-kob-text mb-2">
											{feature.title}
										</h3>
										<p className="text-kob-body text-sm leading-relaxed">
											{feature.description}
										</p>
									</div>
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Get Started CTA ═══ */}
			<section className="relative bg-kob-black py-24 md:py-32 overflow-hidden">
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

				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						variants={fadeUp}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						custom={0}
						className="glass-card p-12 md:p-16 text-center relative overflow-hidden"
					>
						<div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(201,168,76,0.06),transparent)]" />
						<div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_50%,rgba(14,139,120,0.04),transparent)]" />
						<div className="relative z-10">
							<div className="w-16 h-16 rounded-2xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-6">
								<Smartphone className="h-8 w-8 text-kob-gold" />
							</div>
							<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
								Ready to Get Started?
							</h2>
							<div className="mt-2 mb-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
							<p className="text-kob-body max-w-xl mx-auto mb-10">
								Join the KobKlein pilot program and be part of
								building Haiti&apos;s digital payment infrastructure.
								Simple. Structured. Secure.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<a
									href="#"
									className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-kob-gold text-kob-black font-semibold text-lg shadow-xl shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.02] transition-all duration-300 group justify-center"
								>
									Download the App
									<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
								</a>
								<a
									href="#"
									className="btn-outline-gold px-10 py-4 text-lg flex items-center gap-2 justify-center"
								>
									Contact Sales
								</a>
							</div>
						</div>
					</motion.div>
				</div>
			</section>
		</>
	);
}
