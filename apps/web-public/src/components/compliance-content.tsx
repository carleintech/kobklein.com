"use client";

import {
	Shield,
	Award,
	CheckCircle2,
	FileCheck,
	Scale,
	Globe,
	Lock,
	Mail,
	Landmark,
	BadgeCheck,
	ArrowRight,
} from "lucide-react";
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

const frameworkIcons = [Scale, Lock, Globe, Shield] as const;

const licenses = [
	{
		jurisdiction: "Haiti",
		body: "Banque de la R\u00e9publique d\u2019Ha\u00efti (BRH)",
		type: "Electronic Money Institution License",
		reference: "BRH Circular 117",
		Icon: Landmark,
	},
	{
		jurisdiction: "United States",
		body: "FinCEN",
		type: "Money Services Business Registration",
		reference: "MSB Registration",
		Icon: FileCheck,
	},
	{
		jurisdiction: "Canada",
		body: "FINTRAC",
		type: "Money Services Business Registration",
		reference: "FINTRAC MSB",
		Icon: BadgeCheck,
	},
	{
		jurisdiction: "European Union",
		body: "National Competent Authority",
		type: "Payment Service Directive Compliance",
		reference: "PSD2 / EMD2",
		Icon: Globe,
	},
];

const amlProcedures = [
	{
		title: "Customer Due Diligence",
		description:
			"Multi-tier KYC verification from basic phone number validation to full identity document verification, proof of address, and enhanced due diligence for high-risk profiles.",
	},
	{
		title: "Transaction Monitoring",
		description:
			"Real-time risk engine with 6 scoring rules analyzing velocity, amounts, patterns, reversals, and geographic risk. Automated alerts and account freezing at risk score 90+.",
	},
	{
		title: "Suspicious Activity Reporting",
		description:
			"Automated detection and filing of Suspicious Activity Reports (SARs) with relevant financial intelligence units. Complete audit trail for all flagged transactions.",
	},
	{
		title: "Sanctions Screening",
		description:
			"Continuous screening against OFAC SDN, UN Security Council, EU Consolidated, and other international sanctions lists. Real-time screening on all transactions.",
	},
];

const badges = ["PCI DSS", "SOC 2", "AML/CFT", "GDPR"];

/* ── Types ── */

interface ComplianceContentProps {
	dict: any;
	locale: string;
}

export function ComplianceContent({ dict }: ComplianceContentProps) {
	const frameworkKeys = [
		"financial",
		"data",
		"international",
		"operational",
	] as const;
	const metricKeys = [
		"examinations",
		"score",
		"audit",
		"actions",
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
						<div className="w-14 h-14 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-6">
							<Shield className="h-7 w-7 text-kob-gold" />
						</div>
					</motion.div>

					<motion.h1
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={1}
						className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text mb-6 leading-[1.1] tracking-tight"
					>
						{dict.compliance.title.replace(
							"Framework",
							""
						)}
						<span className="gradient-gold-text">
							Framework
						</span>
					</motion.h1>

					<motion.p
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={2}
						className="text-xl text-kob-body font-light max-w-2xl mx-auto"
					>
						{dict.compliance.subtitle}
					</motion.p>

					<motion.div
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={3}
						className="mt-8 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent"
					/>
				</div>

				<div className="absolute bottom-0 left-0 right-0 divider-teal-gold" />
			</section>

			{/* ═══ Regulatory Framework ═══ */}
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
							Regulatory{" "}
							<span className="gradient-gold-text">
								Framework
							</span>
						</h2>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-1 md:grid-cols-2 gap-6"
					>
						{frameworkKeys.map((key, i) => {
							const item =
								dict.compliance[key];
							const Icon = frameworkIcons[i];
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
												item.title
											}
										</h3>
										<p className="text-sm text-kob-muted leading-relaxed">
											{
												item.description
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

			{/* ═══ Licenses & Registrations ═══ */}
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
							{dict.compliance.licensesTitle
								.replace(
									"Registrations",
									""
								)}
							<span className="gradient-gold-text">
								Registrations
							</span>
						</h2>
						<p className="text-kob-muted text-lg">
							Licensed and registered across
							all operating jurisdictions
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
						{licenses.map((l, i) => (
							<motion.div
								key={l.jurisdiction}
								variants={fadeUp}
								custom={i}
							>
								<div className="glass-card p-8 h-full group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="flex items-start gap-4">
										<div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center flex-shrink-0 group-hover:bg-kob-gold/15 group-hover:scale-110 transition-all duration-300">
											<l.Icon className="h-6 w-6 text-kob-gold" />
										</div>
										<div>
											<div className="flex items-center gap-2 mb-1.5">
												<h3 className="text-base font-semibold text-kob-text">
													{
														l.jurisdiction
													}
												</h3>
												<CheckCircle2 className="h-4 w-4 text-kob-emerald" />
											</div>
											<p className="text-sm text-kob-gold font-medium mb-1">
												{
													l.body
												}
											</p>
											<p className="text-sm text-kob-muted">
												{
													l.type
												}
											</p>
											<p className="text-xs text-kob-muted mt-1.5 opacity-60">
												{
													l.reference
												}
											</p>
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

			{/* ═══ Compliance Metrics ═══ */}
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
							Compliance{" "}
							<span className="gradient-gold-text">
								Metrics
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
						{metricKeys.map((key, i) => {
							const metric =
								dict.compliance.metrics[
									key
								];
							return (
								<motion.div
									key={key}
									variants={scaleIn}
									custom={i}
								>
									<div className="glass-card p-6 text-center hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
										<div className="text-3xl md:text-4xl font-bold gradient-gold-text font-serif-luxury mb-3">
											{
												metric.value
											}
										</div>
										<div className="text-xs text-kob-muted leading-relaxed">
											{
												metric.label
											}
										</div>
									</div>
								</motion.div>
							);
						})}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ AML/KYC Program ═══ */}
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
							AML/KYC{" "}
							<span className="gradient-gold-text">
								Program
							</span>
						</h2>
						<p className="text-kob-muted text-lg">
							Comprehensive anti-money
							laundering and know-your-customer
							procedures
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
						{amlProcedures.map((proc, i) => (
							<motion.div
								key={proc.title}
								variants={fadeUp}
								custom={i}
							>
								<div className="glass-card p-8 h-full group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="flex items-center gap-3 mb-4">
										<div className="w-10 h-10 rounded-lg bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center group-hover:bg-kob-gold/15 group-hover:scale-110 transition-all duration-300">
											<Lock className="h-5 w-5 text-kob-gold" />
										</div>
										<h3 className="text-base font-semibold text-kob-text">
											{
												proc.title
											}
										</h3>
									</div>
									<p className="text-sm text-kob-muted leading-relaxed">
										{
											proc.description
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

			{/* ═══ Compliance Badges ═══ */}
			<section className="py-20 md:py-28 bg-kob-navy">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<div className="w-14 h-14 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-6">
							<Award className="h-7 w-7 text-kob-gold" />
						</div>
						<h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-8">
							Certified{" "}
							<span className="gradient-gold-text">
								Standards
							</span>
						</h2>
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="flex flex-wrap justify-center gap-4 mb-6"
					>
						{badges.map((badge, i) => (
							<motion.div
								key={badge}
								variants={scaleIn}
								custom={i}
							>
								<div className="px-6 py-3 rounded-xl border border-kob-gold/20 bg-kob-gold/5 hover:border-kob-gold/30 hover:bg-kob-gold/8 transition-all duration-300 cursor-default">
									<span className="text-sm font-bold text-kob-gold tracking-wider">
										{badge}
									</span>
								</div>
							</motion.div>
						))}
					</motion.div>

					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{
							duration: 0.6,
							delay: 0.4,
						}}
						className="text-sm text-kob-muted"
					>
						Compliant with international security
						and financial standards
					</motion.p>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Contact CTA ═══ */}
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
						<div className="w-14 h-14 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-6">
							<Mail className="h-7 w-7 text-kob-gold" />
						</div>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
							Compliance{" "}
							<span className="gradient-gold-text">
								Inquiries
							</span>
						</h2>
						<div className="mt-4 mb-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
						<p className="text-kob-muted text-lg mb-10 max-w-xl mx-auto">
							For regulatory questions, audit
							requests, or compliance-related
							matters
						</p>
						<a
							href="mailto:compliance@kobklein.com"
							className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-kob-gold text-kob-black font-semibold text-lg shadow-xl shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.02] transition-all duration-300 group"
						>
							compliance@kobklein.com
							<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
						</a>
					</motion.div>
				</div>
			</section>
		</>
	);
}
