"use client";

import { useState, type FormEvent } from "react";
import { trackEvent } from "@/lib/gtag";
import { motion, type Variants } from "framer-motion";
import {
	CreditCard,
	ShoppingCart,
	Bell,
	Lock,
	Globe,
	Wifi,
	Check,
	ArrowRight,
	Shield,
	Play,
	Plane,
	Package,
	Monitor,
	Coffee,
} from "lucide-react";

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
		transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
	}),
};

/* ── Data ── */

const features = [
	{
		icon: CreditCard,
		title: "Virtual Card Access (via Licensed Issuing Partner)",
		description:
			"Eligible, verified users will be able to access a virtual card inside the KobKlein app through licensed card issuing partners. No traditional bank relationship required from the user. Card availability subject to regulatory and partner approval.",
	},
	{
		icon: ShoppingCart,
		title: "Online & International Purchases",
		description:
			"K-Card is designed to enable e-commerce transactions, subscription services, and international merchant payments. Acceptance depends on the issuing partner's card network and merchant compatibility.",
	},
	{
		icon: Bell,
		title: "Real-Time Notifications",
		description:
			"Receive instant push notifications for every transaction. Always know when and where your card is used, with app-based controls to freeze or adjust limits at any time.",
	},
	{
		icon: Lock,
		title: "Security Controls",
		description:
			"Multi-factor authentication, app-based card freezing, adjustable transaction limits, and real-time monitoring. Security and compliance are foundational to K-Card deployment.",
	},
];

const purchaseCategories = [
	{ name: "Online Retail", icon: Package },
	{ name: "Streaming", icon: Play },
	{ name: "Travel", icon: Plane },
	{ name: "Digital Services", icon: Monitor },
	{ name: "International Merchants", icon: Globe },
	{ name: "Subscriptions", icon: Coffee },
];

export default function CardPage() {
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState("");
	const [waitlistPosition, setWaitlistPosition] = useState<number | null>(
		null
	);

	const API_BASE =
		process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

	async function handleWaitlistSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSubmitting(true);
		setFormError("");

		const form = e.currentTarget;
		const formData = new FormData(form);
		const fullName = formData.get("fullName") as string;
		const phone = formData.get("phone") as string;

		try {
			const res = await fetch(`${API_BASE}/v1/kcard/waitlist`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ fullName, phone }),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || "Submission failed");
			}

			const data = await res.json();
			if (data.alreadyJoined) {
				setFormError("You're already on the waitlist!");
			}
			setWaitlistPosition(data.position);
			setSubmitted(true);
			trackEvent("waitlist_signup", "engagement", "kcard_waitlist", 1);
		} catch (err: any) {
			setFormError(
				err.message || "Something went wrong. Please try again."
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<>
			{/* ═══ Hero ═══ */}
			<section className="relative overflow-hidden min-h-[85vh] flex flex-col justify-center">
				<div className="absolute inset-0 bg-kob-black" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,168,76,0.14),transparent)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_70%,rgba(201,168,76,0.06),transparent)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_20%_60%,rgba(14,139,120,0.05),transparent)]" />
				<div className="absolute inset-0 gold-dust" />

				<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
						{/* Left content */}
						<div className="space-y-8">
							<motion.div
								variants={fadeUp}
								initial="hidden"
								animate="visible"
								custom={0}
							>
								<div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-kob-gold/25 bg-kob-gold/5 text-sm text-kob-gold backdrop-blur-sm">
									<CreditCard className="h-4 w-4" />
									K-Card &mdash; In Development
								</div>
							</motion.div>

							<motion.h1
								variants={fadeUp}
								initial="hidden"
								animate="visible"
								custom={1}
								className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text leading-[1.1] tracking-tight"
							>
								Introducing{" "}
								<span className="gradient-gold-text">
									K-Card
								</span>
							</motion.h1>

							<motion.p
								variants={fadeUp}
								initial="hidden"
								animate="visible"
								custom={2}
								className="text-xl text-kob-body font-light max-w-lg"
							>
								Connecting your KobKlein wallet to global card payment networks through licensed issuing partners &mdash; designed to expand purchasing access for verified users.
							</motion.p>

							<motion.div
								variants={fadeUp}
								initial="hidden"
								animate="visible"
								custom={3}
								className="flex flex-wrap gap-5"
							>
								{[
									{
										icon: Shield,
										label: "Enterprise-Level Security",
									},
									{
										icon: Globe,
										label: "Through Licensed Partners",
									},
									{
										icon: Wifi,
										label: "Contactless Ready",
									},
								].map(({ icon: Icon, label }) => (
									<div
										key={label}
										className="flex items-center gap-2 text-sm text-kob-muted"
									>
										<div className="w-7 h-7 rounded-full bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center">
											<Icon className="h-3.5 w-3.5 text-kob-gold/70" />
										</div>
										{label}
									</div>
								))}
							</motion.div>

							<motion.div
								variants={fadeUp}
								initial="hidden"
								animate="visible"
								custom={4}
							>
								<a
									href="#waitlist"
									className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-kob-gold text-kob-black font-semibold text-lg shadow-xl shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.02] transition-all duration-300 group"
								>
									Join the Interest List
									<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
								</a>
							</motion.div>
						</div>

						{/* Right — Card Visual */}
						<motion.div
							initial={{
								opacity: 0,
								scale: 0.92,
								rotateY: -8,
							}}
							animate={{ opacity: 1, scale: 1, rotateY: 0 }}
							transition={{
								delay: 0.3,
								duration: 0.8,
								ease: "easeOut",
							}}
							className="flex justify-center perspective-[1000px]"
						>
							<div className="relative w-full max-w-[420px] aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl shadow-kob-gold/15">
								{/* Card background */}
								<div className="absolute inset-0 bg-gradient-to-br from-kob-panel via-kob-navy to-kob-black" />
								<div className="absolute inset-0 border border-kob-gold/25 rounded-2xl" />

								{/* Gold accent lines */}
								<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-kob-goldDark via-kob-gold to-kob-goldLight" />
								<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kob-gold/20 to-transparent" />

								{/* Holographic effect */}
								<div className="absolute inset-0 bg-gradient-to-tr from-kob-gold/5 via-transparent to-kob-gold/5 opacity-60" />

								{/* Chip */}
								<div className="absolute top-8 left-8">
									<div className="w-12 h-9 rounded-md bg-gradient-to-br from-kob-gold to-kob-goldDark shadow-inner border border-kob-gold/40" />
								</div>

								{/* Contactless symbol */}
								<div className="absolute top-8 left-24">
									<Wifi className="h-6 w-6 text-kob-gold/40 rotate-90" />
								</div>

								{/* Card number */}
								<div className="absolute bottom-20 left-8 text-kob-body/80 text-xl tracking-[0.25em] font-mono">
									**** **** **** 4321
								</div>

								{/* Cardholder */}
								<div className="absolute bottom-8 left-8">
									<div className="text-[10px] text-kob-muted/60 uppercase tracking-wider mb-1">
										Card Holder
									</div>
									<div className="text-kob-body text-sm uppercase tracking-wider">
										KobKlein Member
									</div>
								</div>

								{/* Expiry */}
								<div className="absolute bottom-8 right-24">
									<div className="text-[10px] text-kob-muted/60 uppercase tracking-wider mb-1">
										Expires
									</div>
									<div className="text-kob-body text-sm tracking-wider">
										12/28
									</div>
								</div>

								{/* Logo & brand */}
								<div className="absolute top-8 right-8 text-kob-gold/50 text-xs font-medium tracking-wider">
									K-CARD
								</div>
								<div className="absolute bottom-8 right-8 text-kob-gold font-bold text-2xl font-serif-luxury">
									K
								</div>
							</div>
						</motion.div>
					</div>
				</div>

				<div className="absolute bottom-0 left-0 right-0 divider-teal-gold" />
			</section>

			{/* ═══ Features ═══ */}
			<section className="py-24 md:py-32 bg-kob-navy glow-teal-gold">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-16"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text">
							Card Features Built for{" "}
							<span className="gradient-gold-text">You</span>
						</h2>
						<p className="text-kob-muted mt-4 text-lg max-w-2xl mx-auto">
							K-Card is designed to expand digital purchasing access for verified KobKlein users &mdash; enabling secure online and international transactions through licensed card network partners.
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
						{features.map(
							({ icon: Icon, title, description }, i) => (
								<motion.div
									key={title}
									variants={fadeUp}
									custom={i}
								>
									<div className="glass-card p-8 h-full group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300">
										<div className="w-14 h-14 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center mb-5 group-hover:bg-kob-gold/15 group-hover:scale-110 transition-all duration-300">
											<Icon className="h-7 w-7 text-kob-gold" />
										</div>
										<h3 className="text-xl font-semibold text-kob-text mb-2">
											{title}
										</h3>
										<p className="text-kob-muted text-sm leading-relaxed">
											{description}
										</p>
									</div>
								</motion.div>
							)
						)}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Purchase Categories ═══ */}
			<section className="py-24 md:py-32 bg-kob-black">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-16"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text">
							Online &amp; International{" "}
							<span className="gradient-gold-text">Purchases</span>
						</h2>
						<p className="text-kob-muted mt-4 text-lg max-w-2xl mx-auto">
							K-Card is intended to enable a wide range of online and international purchase categories, subject to issuing partner&apos;s card network and merchant compatibility.
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
					>
						{purchaseCategories.map((cat, i) => (
							<motion.div
								key={cat.name}
								variants={scaleIn}
								custom={i}
							>
								<div className="card-sovereign shimmer-gold p-4 text-center group hover:border-kob-gold/30 hover:shadow-md hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="w-10 h-10 rounded-full bg-kob-gold/5 border border-kob-gold/15 flex items-center justify-center mx-auto mb-2 group-hover:bg-kob-gold/10 group-hover:scale-110 transition-all duration-300 text-kob-gold/50 group-hover:text-kob-gold/70">
										<cat.icon className="h-5 w-5" />
									</div>
									<span className="text-xs text-kob-body font-medium">
										{cat.name}
									</span>
								</div>
							</motion.div>
						))}
					</motion.div>

					<motion.p
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className="mt-8 text-xs text-kob-muted text-center max-w-2xl mx-auto"
					>
						K-Card services will be offered through licensed financial institution partners and are subject to eligibility, jurisdictional availability, and regulatory approval. Features described are indicative of intended functionality and may vary upon launch.
					</motion.p>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Physical Card ═══ */}
			<section className="py-20 bg-kob-navy">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="glass-card p-8 md:p-10 text-center"
					>
						<h3 className="font-serif-luxury text-2xl font-bold text-kob-text mb-3">
							Physical Card &mdash; Planned Phase
						</h3>
						<p className="text-kob-muted text-sm leading-relaxed">
							A physical version of K-Card is under evaluation for future rollout, pending regulatory clearance, card network approval, issuing bank partnership, and fulfillment logistics. Details will be announced upon formal launch readiness.
						</p>
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Waitlist CTA ═══ */}
			<section
				id="waitlist"
				className="relative py-24 md:py-32 bg-kob-black overflow-hidden"
			>
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

				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
						<motion.div
							initial={{ opacity: 0, x: -30 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
						>
							<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
								Join the{" "}
								<span className="gradient-gold-text">
									K-Card Interest List
								</span>
							</h2>
							<div className="mt-2 mb-6 w-24 h-0.5 bg-gradient-to-r from-kob-gold via-kob-gold/60 to-transparent" />
							<p className="text-kob-muted text-lg mb-8 leading-relaxed">
								K-Card is in active development. Register your interest to be notified when virtual card access becomes available for verified KobKlein users.
							</p>

							<div className="space-y-4">
								{[
									"Virtual card provisioning within the app (upon verification)",
									"No annual fees for early program members",
									"Priority access when K-Card launches",
									"Updates on physical card rollout timeline",
								].map((item) => (
									<div
										key={item}
										className="flex items-center gap-3 text-sm text-kob-body"
									>
										<div className="w-6 h-6 rounded-full bg-kob-emerald/10 border border-kob-emerald/20 flex items-center justify-center shrink-0">
											<Check className="h-3.5 w-3.5 text-kob-emerald" />
										</div>
										{item}
									</div>
								))}
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, x: 30 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
						>
							<div className="glass-card p-8">
								<h3 className="text-xl font-bold mb-2 text-kob-text">
									Register Your Interest
								</h3>
								<p className="text-sm text-kob-muted mb-6">
									Enter your details below and we&apos;ll
									notify you as soon as K-Card is available
									for your account.
								</p>

								{submitted ? (
									<div className="text-center py-12">
										<div className="w-16 h-16 rounded-full bg-kob-emerald/10 border border-kob-emerald/20 flex items-center justify-center mx-auto mb-4">
											<Check className="h-8 w-8 text-kob-emerald" />
										</div>
										<p className="text-lg font-semibold text-kob-text">
											You&apos;re on the list!
										</p>
										<p className="text-sm text-kob-muted mt-2">
											We&apos;ll notify you when K-Card is
											ready for you.
										</p>
										{waitlistPosition && (
											<p className="text-xs text-kob-gold mt-3 font-medium">
												Position #{waitlistPosition}
											</p>
										)}
									</div>
								) : (
									<form
										onSubmit={handleWaitlistSubmit}
										className="space-y-4"
									>
										<input
											name="fullName"
											required
											type="text"
											placeholder="Full name"
											className="w-full px-4 py-3.5 rounded-xl border border-white/6 bg-kob-black/80 text-kob-text text-sm placeholder:text-kob-muted focus:outline-none focus:border-kob-gold/40 focus:ring-1 focus:ring-kob-gold/20 transition-all duration-200"
										/>
										<input
											name="phone"
											required
											type="tel"
											placeholder="Phone number"
											className="w-full px-4 py-3.5 rounded-xl border border-white/6 bg-kob-black/80 text-kob-text text-sm placeholder:text-kob-muted focus:outline-none focus:border-kob-gold/40 focus:ring-1 focus:ring-kob-gold/20 transition-all duration-200"
										/>
										{formError && (
											<p className="text-xs text-kob-danger">
												{formError}
											</p>
										)}
										<button
											type="submit"
											disabled={submitting}
											className="w-full py-3.5 rounded-xl bg-kob-gold text-kob-black font-semibold shadow-lg shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.01] transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100"
										>
											{submitting
												? "Submitting..."
												: "Join Interest List"}
										</button>
									</form>
								)}
							</div>
						</motion.div>
					</div>
				</div>
			</section>
		</>
	);
}
