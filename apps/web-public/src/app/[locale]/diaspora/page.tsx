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
	Shield,
	Repeat,
	CalendarClock,
	Info,
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

/* ── Data ── */

const features = [
	{
		Icon: Users,
		title: "K-Link Family Dashboard",
		description:
			"Organize recipients inside your dashboard. Saved contacts, transfer history, delivery tracking, and activity transparency — all in one place.",
	},
	{
		Icon: Repeat,
		title: "Scheduled Support",
		description:
			"Set up weekly, biweekly, or monthly recurring transfers. Consistent family support, controlled from your dashboard.",
	},
	{
		Icon: Clock,
		title: "Near Real-Time Delivery",
		description:
			"Wallet funding occurs in near real-time, subject to verification status and partner processing conditions. Recipients may access funds digitally or via authorized K-Agents.",
	},
	{
		Icon: Shield,
		title: "Enterprise-Level Security",
		description:
			"Every transfer is protected by AES-256 encryption, real-time risk scoring, and OTP verification for high-value transactions.",
	},
	{
		Icon: DollarSign,
		title: "Transparent FX Rates",
		description:
			"FX rates are displayed transparently before transaction confirmation. Rates reflect current corridor and partner pricing conditions. No hidden markups.",
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
		title: "Create & Verify Your Account",
		description:
			"Complete identity verification to create your secure KobKlein wallet. Approval timelines may vary based on compliance review.",
		Icon: Smartphone,
	},
	{
		number: "02",
		title: "Add Family Recipients",
		description:
			"Build your K-Link family panel. Add parents, siblings, children — organize everyone you support back home.",
		Icon: Heart,
	},
	{
		number: "03",
		title: "Fund Through Licensed Channel",
		description:
			"Send through authorized payment channels. Recipient receives wallet funding — ready to spend digitally or withdraw via authorized K-Agents.",
		Icon: Send,
	},
];

const pricingRows = [
	{ service: "International Transfer (US → Haiti)", fee: "$1.99", note: "Starting from" },
	{ service: "KobKlein-to-KobKlein Transfer", fee: "FREE", isFree: true },
	{ service: "Cash-out at Authorized K-Agent", fee: "$0.99", note: "Starting from" },
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
						Support Home.{" "}
						<span className="gradient-gold-text">
							Digitally. Transparently.
						</span>
					</motion.h1>

					<motion.p
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={2}
						className="text-xl text-kob-body font-light max-w-2xl mx-auto mb-10"
					>
						KobKlein is building structured digital payment infrastructure to connect diaspora support directly to Haitian wallets and merchant networks. Transparent pricing. Compliance-first. Designed for reliability.
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
							Join the Pilot Program
							<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
						</Link>
						<Link
							href={`/${loc}/fx-calculator`}
							className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl border border-white/10 text-kob-body font-medium hover:border-kob-gold/30 hover:text-kob-gold hover:bg-kob-gold/5 transition-all duration-300"
						>
							View FX Rates
						</Link>
					</motion.div>
				</div>

				<div className="absolute bottom-0 left-0 right-0 divider-teal-gold" />
			</section>

			{/* ═══ Why KobKlein — Transparent Pricing ═══ */}
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
							Why{" "}
							<span className="gradient-gold-text">
								KobKlein Exists
							</span>
						</h2>
						<p className="text-kob-muted max-w-2xl mx-auto text-lg">
							The Haitian diaspora sends billions annually in support to family and community. Much of that flows through high-fee, cash-based systems. KobKlein is designed to reduce that cost and increase digital purchasing power.
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					{/* Transparent Pricing Table */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="glass-card overflow-hidden"
					>
						<div className="px-6 py-5 border-b border-white/[0.06]">
							<h3 className="text-base font-semibold text-kob-text">Transparent Pricing. No Surprises.</h3>
							<p className="text-sm text-kob-muted mt-1">Traditional remittance providers may charge higher fees depending on location and payout method.</p>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-white/[0.06]">
										<th className="text-left px-6 py-4 text-kob-muted font-medium text-xs uppercase tracking-wider">
											Service
										</th>
										<th className="text-right px-6 py-4 text-kob-gold font-semibold text-xs uppercase tracking-wider">
											KobKlein
										</th>
									</tr>
								</thead>
								<tbody>
									{pricingRows.map((row, i) => (
										<tr
											key={row.service}
											className={i % 2 === 0 ? "bg-kob-black/20" : ""}
										>
											<td className="px-6 py-4 text-kob-body font-medium">{row.service}</td>
											<td className={`px-6 py-4 text-right font-semibold ${row.isFree ? "text-kob-emerald" : "text-kob-gold"}`}>
												{row.fee}
												{row.note && <span className="text-kob-muted text-xs font-normal ml-1">({row.note})</span>}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="px-6 py-4 border-t border-white/[0.04]">
							<p className="text-xs text-kob-muted">Final pricing subject to corridor and partner processing costs. All fees displayed before transaction confirmation.</p>
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
							Every feature designed to make supporting your family more transparent and reliable
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
							How It{" "}
							<span className="gradient-gold-text">
								Works
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

					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className="mt-8 text-xs text-kob-muted text-center"
					>
						Processing times may vary depending on jurisdiction, verification status, and licensed partner availability.
					</motion.p>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Corridor Availability ═══ */}
			<section className="py-20 md:py-28 bg-kob-black glow-teal-gold">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<div className="w-14 h-14 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-6">
							<Info className="h-7 w-7 text-kob-gold" />
						</div>
						<h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-6">
							Corridor{" "}
							<span className="gradient-gold-text">
								Availability
							</span>
						</h2>
						<div className="glass-card p-8 text-left space-y-4">
							<p className="text-sm text-kob-body leading-relaxed">
								KobKlein operates under a partner-based financial services structure and is preparing for phased corridor activation. Transfer speed, pricing, and availability depend on regulatory approvals and licensed processing partners.
							</p>
							<p className="text-sm text-kob-body leading-relaxed">
								Cross-border money transmission is subject to jurisdiction-specific regulatory requirements. Corridor availability will be announced as regulatory approvals and partner authorizations are confirmed.
							</p>
							<p className="text-xs text-kob-muted leading-relaxed border-t border-white/[0.06] pt-4">
								Before initiating any transfer, users will be shown the applicable fee, FX rate, and estimated delivery timeframe for their specific corridor.
							</p>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ CTA ═══ */}
			<section className="relative py-24 md:py-32 bg-kob-navy overflow-hidden">
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
								Get Started?
							</span>
						</h2>
						<div className="mt-4 mb-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
						<p className="text-kob-muted text-lg mb-10 max-w-xl mx-auto">
							Join the KobKlein pilot program. Create a verified wallet and connect your family to Haiti&apos;s digital payment infrastructure.
						</p>
						<Link
							href={`/${loc}/app`}
							className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-kob-gold text-kob-black font-semibold text-lg shadow-xl shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.02] transition-all duration-300 group"
						>
							Join the Pilot Program
							<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
						</Link>
					</motion.div>
				</div>
			</section>
		</>
	);
}
