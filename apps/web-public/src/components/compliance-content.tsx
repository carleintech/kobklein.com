"use client";

import {
	Shield,
	FileCheck,
	Scale,
	Globe,
	Lock,
	Mail,
	ArrowRight,
	AlertCircle,
	Database,
	Eye,
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

const regulatoryAlignment = [
	{
		jurisdiction: "United States",
		description:
			"Operating in alignment with U.S. federal AML/CFT requirements through licensed financial institution partners. Compliance obligations fulfilled through partner frameworks.",
		Icon: FileCheck,
	},
	{
		jurisdiction: "Haiti",
		description:
			"Preparing for phased deployment in coordination with applicable Haitian regulatory frameworks. Regulatory approvals are obtained through authorized partner institutions where required.",
		Icon: Shield,
	},
	{
		jurisdiction: "International Data Standards",
		description:
			"Designed in alignment with international data protection principles. Role-based access controls, encryption at rest and in transit, and data minimization policies applied throughout.",
		Icon: Database,
	},
	{
		jurisdiction: "Card Network & Payment Rules",
		description:
			"Card issuance and payment processing rules are administered through licensed card network partners where applicable. KobKlein does not directly hold card network membership.",
		Icon: Globe,
	},
];

const amlProcedures = [
	{
		title: "Customer Due Diligence",
		description:
			"Multi-tier KYC verification from basic phone number validation to full identity document verification. Enhanced due diligence for higher-risk profiles. Tiered account limits based on verification level.",
	},
	{
		title: "Transaction Monitoring",
		description:
			"Risk-scoring model evaluating velocity patterns, transaction amounts, geographic risk indicators, and behavioral anomalies. Flagged activity is escalated to compliance review through partner frameworks.",
	},
	{
		title: "Suspicious Activity Escalation",
		description:
			"Suspicious activity escalation procedures aligned with applicable partner reporting frameworks. Complete audit trail maintained for all flagged transactions. Reporting obligations fulfilled through licensed partner institutions.",
	},
	{
		title: "Sanctions Screening",
		description:
			"Screening processes aligned with internationally recognized sanctions programs including OFAC, UN Security Council, and EU consolidated lists, conducted in accordance with partner obligations.",
	},
];

const securityStandards = [
	"TLS 1.3 encryption in transit",
	"AES-256 encryption at rest",
	"Multi-factor authentication",
	"Real-time transaction monitoring",
	"Role-based access controls",
	"Audit logging & recordkeeping",
];

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
						Compliance{" "}
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
						Structured. Partner-Based. Regulatory-Aligned.
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

			{/* ═══ Regulatory Framework Pillars ═══ */}
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
						<p className="text-kob-muted text-lg max-w-2xl mx-auto">
							KobKlein is building its platform under a partner-first financial services structure designed to align with applicable regulatory requirements.
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

			{/* ═══ Regulatory Alignment ═══ */}
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
							Regulatory{" "}
							<span className="gradient-gold-text">
								Alignment
							</span>
						</h2>
						<p className="text-kob-muted text-lg max-w-2xl mx-auto">
							KobKlein is preparing for phased deployment in coordination with licensed financial institution partners. Licenses and registrations are obtained directly by authorized partner institutions where required.
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
						{regulatoryAlignment.map((item, i) => (
							<motion.div
								key={item.jurisdiction}
								variants={fadeUp}
								custom={i}
							>
								<div className="glass-card p-8 h-full group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="flex items-start gap-4">
										<div className="w-12 h-12 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center flex-shrink-0 group-hover:bg-kob-gold/15 group-hover:scale-110 transition-all duration-300">
											<item.Icon className="h-6 w-6 text-kob-gold" />
										</div>
										<div>
											<h3 className="text-base font-semibold text-kob-text mb-2">
												{item.jurisdiction}
											</h3>
											<p className="text-sm text-kob-muted leading-relaxed">
												{item.description}
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

			{/* ═══ Compliance Framework Indicators ═══ */}
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
								Framework
							</span>
						</h2>
						<p className="text-kob-muted text-lg">
							Risk-based identity verification and transaction monitoring consistent with international AML/CFT best practices
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

			{/* ═══ Security Architecture ═══ */}
			<section className="py-20 md:py-28 bg-kob-navy">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<div className="w-14 h-14 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mx-auto mb-6">
							<Eye className="h-7 w-7 text-kob-gold" />
						</div>
						<h2 className="font-serif-luxury text-3xl md:text-4xl font-bold text-kob-text mb-4">
							Security{" "}
							<span className="gradient-gold-text">
								Architecture
							</span>
						</h2>
						<p className="text-kob-muted text-sm mb-8">
							Designed in alignment with industry security standards
						</p>
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-6"
					>
						{securityStandards.map((standard, i) => (
							<motion.div
								key={standard}
								variants={scaleIn}
								custom={i}
								className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-kob-panel/30 text-sm text-kob-body"
							>
								<Shield className="h-4 w-4 text-kob-gold/60 flex-shrink-0" />
								{standard}
							</motion.div>
						))}
					</motion.div>

					<motion.div
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{
							duration: 0.6,
							delay: 0.4,
						}}
						className="flex items-start gap-3 p-4 rounded-xl border border-kob-gold/10 bg-kob-gold/5 text-left"
					>
						<AlertCircle className="h-4 w-4 text-kob-gold/60 flex-shrink-0 mt-0.5" />
						<p className="text-xs text-kob-muted leading-relaxed">
							These features describe KobKlein&apos;s security architecture design. KobKlein does not represent that it holds specific third-party certifications (e.g., PCI DSS, SOC 2) unless explicitly documented and disclosed separately.
						</p>
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Important Disclosure ═══ */}
			<section className="py-12 bg-kob-black">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="glass-card p-8"
					>
						<div className="flex items-start gap-4">
							<AlertCircle className="h-5 w-5 text-kob-gold/60 flex-shrink-0 mt-0.5" />
							<div>
								<h3 className="text-sm font-semibold text-kob-text mb-2">Important Disclosure</h3>
								<p className="text-sm text-kob-muted leading-relaxed">
									KobKlein operates under a partner-based financial services model and is currently in pilot deployment phase. Licensing and regulatory approvals are obtained directly by authorized financial institution partners where required. Service availability depends on jurisdiction, regulatory clearance, and partner authorization.
								</p>
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Contact CTA ═══ */}
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
							For regulatory questions, partnership inquiries, or compliance-related matters
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
