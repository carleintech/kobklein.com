"use client";

import { motion, type Variants } from "framer-motion";
import type { Dictionary } from "@/i18n";
import { Download, Send, UserPlus, Wallet } from "lucide-react";

const stepReveal: Variants = {
	hidden: { opacity: 0, y: 40 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.2, ease: "easeOut" as const },
	}),
};

const lineGrow: Variants = {
	hidden: { scaleX: 0 },
	visible: {
		scaleX: 1,
		transition: { duration: 1.2, delay: 0.3, ease: "easeOut" as const },
	},
};

const steps = [
	{ key: "step1", icon: Download },
	{ key: "step2", icon: UserPlus },
	{ key: "step3", icon: Wallet },
	{ key: "step4", icon: Send },
] as const;

export function HowItWorksSection({ dict }: { dict: Dictionary }) {
	return (
		<section id="how-it-works" className="relative py-24 md:py-32 scroll-mt-24">
			{/* Subtle background */}
			<div className="absolute inset-0 bg-kob-navy/40" />

			<div className="relative max-w-7xl mx-auto px-6">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-20"
				>
					<h2 className="text-4xl md:text-5xl font-bold text-kob-text font-serif">
						{dict.howItWorks.title}
					</h2>
					<p className="mt-4 text-lg text-kob-muted">
						{dict.howItWorks.subtitle}
					</p>
					<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
				</motion.div>

				<div className="relative">
					{/* Connecting line (desktop) */}
					<motion.div
						variants={lineGrow}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="hidden md:block absolute top-[52px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px bg-gradient-to-r from-kob-gold/20 via-kob-gold/40 to-kob-gold/20 animate-gradient-shift bg-[length:200%_100%] origin-left"
					/>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
						{steps.map(({ key, icon: Icon }, i) => {
							const step =
								dict.howItWorks[
									key as keyof typeof dict.howItWorks
								];
							if (typeof step === "string") return null;
							return (
								<motion.div
									key={key}
									variants={stepReveal}
									initial="hidden"
									whileInView="visible"
									viewport={{ once: true }}
									custom={i}
									className="text-center relative"
								>
									{/* Step circle */}
									<div className="relative mx-auto w-[52px] h-[52px] rounded-full bg-kob-panel border-2 border-kob-gold/30 flex items-center justify-center mb-6 z-10 shadow-lg shadow-kob-gold/5">
										<Icon className="h-5 w-5 text-kob-gold" />
										{/* Step number */}
										<div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-kob-gold text-kob-black text-xs font-bold flex items-center justify-center shadow-lg">{i + 1}</div>
									</div>

									{/* Mobile connecting line */}
									{i < 3 && (
										<div className="md:hidden absolute left-1/2 top-[52px] w-px h-12 -translate-x-1/2 bg-gradient-to-b from-kob-gold/30 to-transparent" />
									)}

									<span className="text-xs font-bold text-kob-gold tracking-widest uppercase">
										{step.label}
									</span>
									<h3 className="mt-3 text-lg font-semibold text-kob-text">
										{step.title}
									</h3>
									<p className="mt-2 text-sm text-kob-muted leading-relaxed max-w-xs mx-auto">
										{step.description}
									</p>
								</motion.div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}
