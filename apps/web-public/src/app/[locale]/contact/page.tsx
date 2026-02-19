"use client";

import { useState, type FormEvent } from "react";
import {
	Clock,
	Mail,
	MapPin,
	MessageSquare,
	Phone,
	Send,
	ArrowRight,
	CheckCircle2,
	Headphones,
	Building2,
	Shield,
	Zap,
	ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

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

const offices = [
	{
		city: "Virginia Beach",
		country: "United States",
		address: "Headquarters",
		flag: "🇺🇸",
		timezone: "EST",
	},
	{
		city: "Port-au-Prince",
		country: "Haiti",
		address: "Rue Capois, Pétion-Ville",
		flag: "🇭🇹",
		timezone: "EST",
	},
	{
		city: "Montreal",
		country: "Canada",
		address: "Boulevard Saint-Laurent",
		flag: "🇨🇦",
		timezone: "EST",
	},
];

const channels = [
	{
		id: "whatsapp",
		label: "WhatsApp",
		description: "Chat with us instantly",
		response: "< 5 min",
		href: "https://wa.me/15099999999",
		color: "bg-[#25D366]",
		hoverColor: "hover:bg-[#20BD5A]",
		textColor: "text-white",
		icon: (
			<svg
				viewBox="0 0 24 24"
				className="h-6 w-6"
				fill="currentColor"
			>
				<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
			</svg>
		),
	},
	{
		id: "telegram",
		label: "Telegram",
		description: "Message our bot",
		response: "Instant",
		href: "https://t.me/kobklein",
		color: "bg-[#0088CC]",
		hoverColor: "hover:bg-[#0077B5]",
		textColor: "text-white",
		icon: (
			<svg
				viewBox="0 0 24 24"
				className="h-6 w-6"
				fill="currentColor"
			>
				<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
			</svg>
		),
	},
	{
		id: "email",
		label: "Email",
		description: "Detailed inquiries",
		response: "< 24 hrs",
		href: "mailto:support@kobklein.com",
		color: "bg-kob-gold",
		hoverColor: "hover:bg-kob-goldLight",
		textColor: "text-kob-black",
		icon: <Mail className="h-6 w-6" />,
	},
	{
		id: "phone",
		label: "Call Us",
		description: "Speak to an agent",
		response: "Business hours",
		href: "tel:+15099999999",
		color: "bg-kob-panel",
		hoverColor: "hover:bg-kob-navy",
		textColor: "text-kob-gold",
		icon: <Phone className="h-6 w-6" />,
	},
];

const faqItems = [
	{
		q: "How do I reset my PIN or password?",
		a: 'Open the KobKlein app, tap "Forgot PIN" on the login screen, and follow the SMS verification steps. You\'ll receive a new code within seconds.',
	},
	{
		q: "What are your transfer fees?",
		a: "Domestic P2P transfers are free. International remittances are $1.99 flat per transfer, with the best available FX rates shown in real-time before you confirm.",
	},
	{
		q: "How do I become a K-Agent distributor?",
		a: "Apply through our K-Agent page or WhatsApp us directly. You need a physical location, a smartphone, and initial float capital starting from $100.",
	},
	{
		q: "Is my money safe with KobKlein?",
		a: "Yes. We use AES-256 encryption, real-time fraud detection, and are regulated by BRH (Haiti) and registered with FinCEN (US). All funds are held in segregated custodial accounts.",
	},
	{
		q: "Which countries can I send money to?",
		a: "Currently, you can send money to Haiti from the US, Canada, and France. We're expanding to more Caribbean nations in 2025.",
	},
];

const subjects = [
	{ value: "", label: "Select Subject" },
	{ value: "general", label: "General Inquiry" },
	{ value: "support", label: "Technical Support" },
	{ value: "business", label: "Business / Partnership" },
	{ value: "compliance", label: "Compliance / Legal" },
	{ value: "press", label: "Press / Media" },
	{ value: "agent", label: "K-Agent Program" },
];

export default function ContactPage() {
	const [submitted, setSubmitted] = useState(false);
	const [activeChannel, setActiveChannel] = useState<string | null>(null);
	const [openFaq, setOpenFaq] = useState<number | null>(null);

	function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSubmitted(true);
	}

	return (
		<>
			{/* ═══ Hero ═══ */}
			<section className="relative overflow-hidden min-h-[70vh] flex flex-col justify-center">
				<div className="absolute inset-0 bg-kob-black" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,168,76,0.14),transparent)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_70%,rgba(201,168,76,0.06),transparent)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_20%_60%,rgba(14,139,120,0.05),transparent)]" />
				<div className="absolute inset-0 gold-dust" />

				<div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
					<motion.div
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={0}
					>
						<span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-kob-gold/5 text-kob-gold border border-kob-gold/25 backdrop-blur-sm">
							<Headphones className="h-4 w-4" />
							We&apos;re Here to Help
						</span>
					</motion.div>

					<motion.h1
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={1}
						className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl font-bold text-kob-text mt-8 mb-6 leading-[1.1] tracking-tight"
					>
						Get in{" "}
						<span className="gradient-gold-text">
							Touch
						</span>
					</motion.h1>

					<motion.p
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={2}
						className="text-xl text-kob-body font-light max-w-2xl mx-auto mb-10"
					>
						Have questions? We&apos;re
						available on WhatsApp, Telegram,
						email, and phone. Pick your
						preferred channel.
					</motion.p>

					{/* Quick Channel Buttons */}
					<motion.div
						variants={fadeUp}
						initial="hidden"
						animate="visible"
						custom={3}
						className="flex flex-wrap justify-center gap-3"
					>
						{channels.map((ch) => (
							<a
								key={ch.id}
								href={ch.href}
								target={
									ch.id ===
										"whatsapp" ||
									ch.id ===
										"telegram"
										? "_blank"
										: undefined
								}
								rel={
									ch.id ===
										"whatsapp" ||
									ch.id ===
										"telegram"
										? "noopener noreferrer"
										: undefined
								}
								onMouseEnter={() =>
									setActiveChannel(
										ch.id
									)
								}
								onMouseLeave={() =>
									setActiveChannel(
										null
									)
								}
								className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm ${ch.color} ${ch.textColor} ${ch.hoverColor} shadow-lg hover:scale-[1.03] hover:shadow-xl transition-all duration-300`}
							>
								{ch.icon}
								{ch.label}
							</a>
						))}
					</motion.div>

					{/* Animated response hint */}
					<AnimatePresence mode="wait">
						{activeChannel && (
							<motion.p
								key={activeChannel}
								initial={{
									opacity: 0,
									y: 8,
								}}
								animate={{
									opacity: 1,
									y: 0,
								}}
								exit={{
									opacity: 0,
									y: -8,
								}}
								transition={{
									duration: 0.2,
								}}
								className="mt-4 text-sm text-kob-gold"
							>
								<Zap className="h-3.5 w-3.5 inline mr-1" />
								{
									channels.find(
										(c) =>
											c.id ===
											activeChannel
									)?.response
								}{" "}
								response time
							</motion.p>
						)}
					</AnimatePresence>
				</div>

				<div className="absolute bottom-0 left-0 right-0 divider-teal-gold" />
			</section>

			{/* ═══ Contact Channels — Expanded Cards ═══ */}
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
							Choose Your{" "}
							<span className="gradient-gold-text">
								Channel
							</span>
						</h2>
						<p className="text-kob-muted text-lg max-w-2xl mx-auto">
							Reach us wherever you&apos;re
							most comfortable. We respond
							fastest on WhatsApp.
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
					>
						{channels.map((ch, i) => (
							<motion.a
								key={ch.id}
								href={ch.href}
								target={
									ch.id ===
										"whatsapp" ||
									ch.id ===
										"telegram"
										? "_blank"
										: undefined
								}
								rel={
									ch.id ===
										"whatsapp" ||
									ch.id ===
										"telegram"
										? "noopener noreferrer"
										: undefined
								}
								variants={scaleIn}
								custom={i}
								className="glass-card p-6 text-center group hover:shadow-lg hover:shadow-kob-gold/5 hover:border-kob-gold/20 transition-all duration-300 cursor-pointer block"
							>
								<div
									className={`w-14 h-14 rounded-2xl ${ch.color} ${ch.textColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
								>
									{ch.icon}
								</div>
								<h3 className="text-base font-semibold text-kob-text mb-1">
									{ch.label}
								</h3>
								<p className="text-xs text-kob-muted mb-3">
									{
										ch.description
									}
								</p>
								<div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-kob-gold/5 border border-kob-gold/15 text-xs text-kob-gold">
									<Zap className="h-3 w-3" />
									{ch.response}
								</div>
							</motion.a>
						))}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Contact Form + Info ═══ */}
			<section className="py-24 md:py-32 bg-kob-black glow-teal-gold">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-16"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
							Send Us a{" "}
							<span className="gradient-gold-text">
								Message
							</span>
						</h2>
						<p className="text-kob-muted text-lg">
							Prefer a detailed inquiry?
							We&apos;ll respond within 24
							hours.
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
						{/* Form — 3 cols */}
						<motion.div
							initial={{
								opacity: 0,
								x: -30,
							}}
							whileInView={{
								opacity: 1,
								x: 0,
							}}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
							className="lg:col-span-3"
						>
							<div className="glass-card p-8 md:p-10">
								<AnimatePresence mode="wait">
									{submitted ? (
										<motion.div
											key="success"
											initial={{
												opacity: 0,
												scale: 0.9,
											}}
											animate={{
												opacity: 1,
												scale: 1,
											}}
											transition={{
												duration: 0.5,
											}}
											className="text-center py-16"
										>
											<div className="w-20 h-20 rounded-full bg-kob-emerald/10 border-2 border-kob-emerald/20 flex items-center justify-center mx-auto mb-6">
												<motion.div
													initial={{
														scale: 0,
													}}
													animate={{
														scale: 1,
													}}
													transition={{
														delay: 0.2,
														type: "spring",
														stiffness: 200,
													}}
												>
													<CheckCircle2 className="h-10 w-10 text-kob-emerald" />
												</motion.div>
											</div>
											<h3 className="text-2xl font-bold text-kob-text mb-2 font-serif-luxury">
												Message
												Sent!
											</h3>
											<p className="text-kob-muted text-sm mb-6">
												We&apos;ll
												get
												back
												to
												you
												within
												24
												hours.
											</p>
											<button
												onClick={() =>
													setSubmitted(
														false
													)
												}
												className="text-sm text-kob-gold hover:text-kob-goldLight transition-colors"
											>
												Send
												another
												message
												→
											</button>
										</motion.div>
									) : (
										<motion.form
											key="form"
											initial={{
												opacity: 1,
											}}
											exit={{
												opacity: 0,
												scale: 0.95,
											}}
											onSubmit={
												handleSubmit
											}
											className="space-y-5"
										>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div>
													<label className="block text-xs text-kob-muted mb-1.5 uppercase tracking-wider">
														Full
														Name
													</label>
													<input
														required
														type="text"
														placeholder="Jean-Pierre Dupont"
														className="w-full px-4 py-3.5 rounded-xl border border-white/6 bg-kob-black/80 text-kob-text text-sm placeholder:text-kob-muted/50 focus:outline-none focus:border-kob-gold/40 focus:ring-1 focus:ring-kob-gold/20 transition-all duration-200"
													/>
												</div>
												<div>
													<label className="block text-xs text-kob-muted mb-1.5 uppercase tracking-wider">
														Email
													</label>
													<input
														required
														type="email"
														placeholder="you@example.com"
														className="w-full px-4 py-3.5 rounded-xl border border-white/6 bg-kob-black/80 text-kob-text text-sm placeholder:text-kob-muted/50 focus:outline-none focus:border-kob-gold/40 focus:ring-1 focus:ring-kob-gold/20 transition-all duration-200"
													/>
												</div>
											</div>
											<div>
												<label className="block text-xs text-kob-muted mb-1.5 uppercase tracking-wider">
													Subject
												</label>
												<select className="w-full px-4 py-3.5 rounded-xl border border-white/6 bg-kob-black/80 text-kob-text text-sm focus:outline-none focus:border-kob-gold/40 focus:ring-1 focus:ring-kob-gold/20 transition-all duration-200 appearance-none">
													{subjects.map(
														(
															s
														) => (
															<option
																key={
																	s.value
																}
																value={
																	s.value
																}
															>
																{
																	s.label
																}
															</option>
														)
													)}
												</select>
											</div>
											<div>
												<label className="block text-xs text-kob-muted mb-1.5 uppercase tracking-wider">
													Message
												</label>
												<textarea
													required
													rows={
														5
													}
													placeholder="Tell us how we can help..."
													className="w-full px-4 py-3.5 rounded-xl border border-white/6 bg-kob-black/80 text-kob-text text-sm placeholder:text-kob-muted/50 focus:outline-none focus:border-kob-gold/40 focus:ring-1 focus:ring-kob-gold/20 transition-all duration-200 resize-none"
												/>
											</div>
											<button
												type="submit"
												className="w-full py-4 rounded-xl bg-kob-gold text-kob-black font-semibold shadow-lg shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 text-sm"
											>
												<Send className="h-4 w-4" />
												Send
												Message
											</button>
										</motion.form>
									)}
								</AnimatePresence>
							</div>
						</motion.div>

						{/* Info — 2 cols */}
						<motion.div
							initial={{
								opacity: 0,
								x: 30,
							}}
							whileInView={{
								opacity: 1,
								x: 0,
							}}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
							className="lg:col-span-2 space-y-8"
						>
							{/* Contact Info */}
							<div className="glass-card p-8">
								<h3 className="text-lg font-semibold text-kob-text mb-6">
									Contact
									Information
								</h3>
								<div className="space-y-5">
									{[
										{
											icon: Mail,
											title: "Email",
											value: "support@kobklein.com",
											href: "mailto:support@kobklein.com",
										},
										{
											icon: Phone,
											title: "Phone",
											value: "+509 2813 XXXX",
											href: "tel:+50928130000",
										},
										{
											icon: MessageSquare,
											title: "WhatsApp",
											value: "+1 (509) 999-9999",
											href: "https://wa.me/15099999999",
										},
										{
											icon: Clock,
											title: "Hours",
											value: "Mon-Fri 8AM-8PM EST",
										},
									].map(
										({
											icon: Icon,
											title,
											value,
											href,
										}) => (
											<div
												key={
													title
												}
												className="flex items-center gap-4 group"
											>
												<div className="w-10 h-10 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0 group-hover:bg-kob-gold/15 group-hover:scale-105 transition-all duration-300">
													<Icon className="h-5 w-5 text-kob-gold" />
												</div>
												<div>
													<div className="text-xs text-kob-muted uppercase tracking-wider mb-0.5">
														{
															title
														}
													</div>
													{href ? (
														<a
															href={
																href
															}
															target={
																href.startsWith(
																	"https"
																)
																	? "_blank"
																	: undefined
															}
															rel={
																href.startsWith(
																	"https"
																)
																	? "noopener noreferrer"
																	: undefined
															}
															className="text-sm text-kob-text hover:text-kob-gold transition-colors"
														>
															{
																value
															}
														</a>
													) : (
														<span className="text-sm text-kob-text">
															{
																value
															}
														</span>
													)}
												</div>
											</div>
										)
									)}
								</div>
							</div>

							{/* Offices */}
							<div className="glass-card p-8">
								<h3 className="text-lg font-semibold text-kob-text mb-6 flex items-center gap-2">
									<Building2 className="h-5 w-5 text-kob-gold" />
									Our Offices
								</h3>
								<div className="space-y-4">
									{offices.map(
										(o) => (
											<div
												key={
													o.city
												}
												className="flex items-center gap-4 p-3 rounded-xl bg-kob-black/40 border border-white/[0.04] hover:border-kob-gold/15 transition-all duration-300 group"
											>
												<span className="text-2xl">
													{
														o.flag
													}
												</span>
												<div className="flex-1">
													<div className="text-sm font-medium text-kob-text group-hover:text-kob-gold transition-colors">
														{
															o.city
														}

														,{" "}
														{
															o.country
														}
													</div>
													<div className="text-xs text-kob-muted flex items-center gap-1">
														<MapPin className="h-3 w-3" />{" "}
														{
															o.address
														}
													</div>
												</div>
												<div className="text-xs text-kob-gold/60 font-mono">
													{
														o.timezone
													}
												</div>
											</div>
										)
									)}
								</div>
							</div>

							{/* Quick promise */}
							<div className="flex items-center gap-3 p-4 rounded-xl border border-kob-gold/15 bg-kob-gold/5">
								<Shield className="h-5 w-5 text-kob-gold shrink-0" />
								<p className="text-xs text-kob-body leading-relaxed">
									Your data is
									encrypted and
									never shared
									with third
									parties. We
									comply with GDPR
									and CCPA.
								</p>
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ FAQ ═══ */}
			<section className="py-24 md:py-32 bg-kob-navy">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mb-16"
					>
						<h2 className="font-serif-luxury text-4xl md:text-5xl font-bold text-kob-text mb-4">
							Frequently{" "}
							<span className="gradient-gold-text">
								Asked
							</span>
						</h2>
						<p className="text-kob-muted text-lg">
							Quick answers before you reach
							out
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="space-y-3"
					>
						{faqItems.map((item, i) => (
							<motion.div
								key={i}
								variants={fadeUp}
								custom={i}
							>
								<button
									onClick={() =>
										setOpenFaq(
											openFaq ===
												i
												? null
												: i
										)
									}
									className="w-full glass-card p-5 text-left group hover:shadow-lg hover:shadow-kob-gold/5 transition-all duration-300"
								>
									<div className="flex items-center justify-between gap-4">
										<h3 className="text-sm font-semibold text-kob-text group-hover:text-kob-gold transition-colors">
											{
												item.q
											}
										</h3>
										<ChevronDown
											className={`h-5 w-5 text-kob-muted shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-kob-gold" : ""}`}
										/>
									</div>

									<AnimatePresence>
										{openFaq ===
											i && (
											<motion.div
												initial={{
													height: 0,
													opacity: 0,
												}}
												animate={{
													height: "auto",
													opacity: 1,
												}}
												exit={{
													height: 0,
													opacity: 0,
												}}
												transition={{
													duration: 0.3,
													ease: "easeInOut",
												}}
												className="overflow-hidden"
											>
												<p className="text-sm text-kob-muted leading-relaxed mt-3 pt-3 border-t border-white/[0.06]">
													{
														item.a
													}
												</p>
											</motion.div>
										)}
									</AnimatePresence>
								</button>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Still Need Help CTA ═══ */}
			<section className="relative py-24 md:py-32 bg-kob-black overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(201,168,76,0.06),transparent)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_30%_70%,rgba(14,139,120,0.04),transparent)]" />

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
							Still Need{" "}
							<span className="gradient-gold-text">
								Help?
							</span>
						</h2>
						<div className="mt-4 mb-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
						<p className="text-kob-muted text-lg mb-10 max-w-xl mx-auto">
							Our support team is available
							24/7 on WhatsApp. Tap below
							to start a conversation
							right now.
						</p>

						<a
							href="https://wa.me/15099999999"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-[#25D366] text-white font-semibold text-lg shadow-xl shadow-[#25D366]/25 hover:bg-[#20BD5A] hover:shadow-[#25D366]/35 hover:scale-[1.02] transition-all duration-300 group"
						>
							<svg
								viewBox="0 0 24 24"
								className="h-6 w-6"
								fill="currentColor"
							>
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
							</svg>
							Chat on WhatsApp
							<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
						</a>

						<div className="mt-8 flex items-center justify-center gap-6 text-sm text-kob-muted">
							<span className="flex items-center gap-2">
								<Zap className="h-3.5 w-3.5 text-kob-gold/60" />
								Avg. reply: 5
								min
							</span>
							<span className="w-px h-4 bg-white/10" />
							<span className="flex items-center gap-2">
								<Clock className="h-3.5 w-3.5 text-kob-gold/60" />
								Available
								24/7
							</span>
							<span className="w-px h-4 bg-white/10" />
							<span className="flex items-center gap-2">
								<Shield className="h-3.5 w-3.5 text-kob-gold/60" />
								End-to-end
								encrypted
							</span>
						</div>
					</motion.div>
				</div>
			</section>
		</>
	);
}
