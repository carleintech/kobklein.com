"use client";

import { motion } from "framer-motion";
import type { Dictionary } from "@/i18n";
import { ArrowRight, Shield, ShieldCheck, Eye, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003";

export function CtaSection({ dict }: { dict: Dictionary }) {
	return (
		<section className="relative py-24 md:py-32 overflow-hidden">
			{/* Background image */}
			<div className="absolute inset-0">
				<Image
					src="/images/cta/signbg.png"
					alt=""
					fill
					sizes="100vw"
					loading="lazy"
					className="object-cover opacity-15"
				/>
				<div className="absolute inset-0 bg-kob-black/85" />
			</div>

			{/* Background effects */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(14,139,120,0.06),transparent)]" />
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_50%,rgba(198,167,86,0.08),transparent)]" />
				<div className="absolute top-0 left-0 right-0 divider-teal-gold" />
				<div className="absolute bottom-0 left-0 right-0 divider-teal-gold" />
			</div>

			{/* Gold particles */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{[...Array(6)].map((_, i) => (
					<div
						key={i}
						className="absolute w-1 h-1 rounded-full bg-kob-gold/40"
						style={{
							left: `${15 + i * 14}%`,
							animation: `particle-float ${8 + i * 2}s linear infinite`,
							animationDelay: `${-i * 2}s`,
						}}
					/>
				))}
			</div>

			<div className="relative max-w-4xl mx-auto px-6 text-center">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.7 }}
				>
					<h2 className="text-4xl md:text-6xl font-bold text-kob-text leading-tight font-serif-luxury">
						{dict.cta.title}
					</h2>
					<p className="mt-6 text-lg text-kob-muted max-w-2xl mx-auto">
						{dict.cta.subtitle}
					</p>
					<div className="mt-10">
						<Link
							href={appUrl}
							className="inline-flex items-center gap-2 text-lg px-10 py-4 rounded-xl bg-kob-gold text-kob-black font-semibold shadow-xl shadow-kob-gold/25 hover:bg-kob-goldLight hover:shadow-kob-gold/35 hover:scale-[1.02] transition-all duration-300 group"
						>
							{dict.cta.button}
							<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
						</Link>
					</div>

					{/* Trust badges */}
					<div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
						{[
						{ label: "PCI DSS", icon: Shield },
						{ label: "SOC 2", icon: ShieldCheck },
						{ label: "AML/KYC", icon: Eye },
						{ label: "256-bit SSL", icon: Lock },
					].map(({ label, icon: Icon }) => (
						<div
							key={label}
							className="flex items-center gap-2 px-4 py-2 rounded-lg border border-kob-teal/15 bg-kob-panel/40 backdrop-blur-sm hover:border-kob-teal/30 transition-colors duration-300"
						>
							<Icon className="h-3.5 w-3.5 text-kob-teal/70" />
							<span className="text-xs font-bold text-kob-teal/70 tracking-wider uppercase">
								{label}
							</span>
						</div>
					))}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
