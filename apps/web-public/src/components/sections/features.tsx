"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
	CreditCard,
	Globe,
	QrCode,
	Shield,
	TrendingDown,
	Zap,
} from "lucide-react";

const features = [
	{
		title: "K-Pay Instant Transfers",
		description: "Send and receive money in real-time. KobKlein to KobKlein transfers are instant and free under $500.",
		icon: Zap,
	},
	{
		title: "Bank-Grade Security",
		description: "Advanced encryption, fraud prevention by design, and OTP step-up verification for high-value transactions.",
		icon: Shield,
	},
	{
		title: "K-Link Global Network",
		description: "Connect with the Haitian diaspora worldwide. Miami, Montreal, Paris to Port-au-Prince — instant money transfers.",
		icon: Globe,
	},
	{
		title: "K-Card Virtual Card",
		description: "Shop Netflix, Amazon, and more with your KobKlein wallet. Coming soon for verified accounts.",
		icon: CreditCard,
	},
	{
		title: "Lowest Fees Guaranteed",
		description: "K-Pay transfers are free. International remittances at just $1.99. Beat Western Union, MoneyGram, and the rest.",
		icon: TrendingDown,
	},
	{
		title: "K-Code & K-Scan",
		description: "Share a 6-digit rotating code or QR to receive money. No phone number needed. Safe and private.",
		icon: QrCode,
	},
];

export function FeaturesSection() {
	return (
		<section className="relative py-24 md:py-32">
			{/* Background Image */}
			<div className="absolute inset-0">
				<Image
					src="/bg.png"
					alt="Background"
					fill
					className="object-cover"
					priority
				/>
				<div className="absolute inset-0 bg-kob-black/80" />
			</div>

			<div className="relative max-w-7xl mx-auto px-6">
				{/* Section header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-4xl md:text-5xl font-bold text-white font-serif">
						Why KobKlein?
					</h2>
					<p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
						Join millions of Haitians who trust KobKlein for their financial needs. Experience the future of digital banking with our innovative features.
					</p>
					<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
				</motion.div>

				{/* Feature cards grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
								className="group relative overflow-hidden rounded-xl bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:shadow-lg"
							>
								<div className="flex items-start gap-4">
									<div className="flex-shrink-0">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
											<Icon className="h-6 w-6 text-white" />
										</div>
									</div>
									<div className="flex-1">
										<h3 className="mb-2 text-lg font-semibold text-white">
											{feature.title}
										</h3>
										<p className="text-sm text-white/80 leading-relaxed">
											{feature.description}
										</p>
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
