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
	MoreHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";

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
		title: "Virtual Visa Card",
		description:
			"Get a Visa card instantly in your KobKlein app. No bank account required, no credit check, no paperwork.",
	},
	{
		icon: ShoppingCart,
		title: "Online Shopping",
		description:
			"Shop at millions of online merchants worldwide. Use your K-Card anywhere Visa is accepted.",
	},
	{
		icon: Bell,
		title: "Real-Time Notifications",
		description:
			"Receive instant push notifications for every transaction. Always know when and where your card is used.",
	},
	{
		icon: Lock,
		title: "Spending Controls",
		description:
			"Set daily limits, freeze your card instantly, and manage subscriptions — all from the KobKlein app.",
	},
];

const merchants: { name: string; icon: ReactNode }[] = [
	{
		name: "Netflix",
		icon: (
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
				<path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.913.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z" />
			</svg>
		),
	},
	{
		name: "Amazon",
		icon: (
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
				<path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.493.126.12.19.065.378-.16.566-.024.02-.04.032-.06.048a22.94 22.94 0 01-9.162 2.98 23.14 23.14 0 01-9.592-.985A22.9 22.9 0 01.045 18.02zm6.394-3.373c0-1.167.292-2.148.876-2.95.584-.8 1.357-1.357 2.322-1.67a9.25 9.25 0 011.36-.323c.47-.06 1.17-.1 2.1-.112l1.59-.02V8.88c0-.57-.033-1.003-.098-1.298a1.73 1.73 0 00-.754-1.12c-.312-.214-.744-.322-1.29-.322-.63 0-1.128.14-1.492.424-.363.283-.6.705-.712 1.266l-2.55-.07c.097-.98.517-1.778 1.26-2.392.744-.614 1.83-.92 3.26-.92 1.184 0 2.12.25 2.813.75.69.5 1.1 1.16 1.228 1.978.052.328.078.89.078 1.69v4.842c0 .33.064.583.193.76.128.177.396.363.804.558l-.46.65a5.07 5.07 0 01-.57.296c-.292.124-.613.186-.963.186-.51 0-.93-.158-1.26-.474-.33-.316-.525-.72-.59-1.218-.476.477-1.07.862-1.782 1.152-.712.29-1.418.434-2.12.434-.896 0-1.637-.28-2.222-.838-.586-.557-.878-1.29-.878-2.198zm2.49-.25c0 .47.13.84.387 1.107.258.267.592.4 1.002.4.553 0 1.08-.175 1.585-.524.504-.35.756-.907.756-1.67V12.5c-.784 0-1.392.02-1.82.06-.868.076-1.48.33-1.536.33-.3.29-.374.79-.374 1.507zm8.994 6.048c.06-.218.27-.328.63-.328.13 0 .258.023.39.065a2.5 2.5 0 00.428.133c.37.078.818.157 1.348.24a21 21 0 002.262.195c.605.028 1.07-.048 1.4-.226.33-.178.494-.442.494-.79 0-.06-.014-.18-.043-.354a4.08 4.08 0 00-.122-.424c-.062-.16-.14-.312-.236-.455a1.42 1.42 0 00-.378-.365c.492-.13.85-.336 1.078-.618.227-.282.342-.61.342-.986 0-.246-.053-.47-.158-.672a1.95 1.95 0 00-.407-.533 1.79 1.79 0 00-.576-.356 1.63 1.63 0 00-.656-.137c-.222 0-.436.035-.643.106-.207.07-.382.17-.528.3a1.58 1.58 0 00-.534-.3 1.86 1.86 0 00-.686-.125c-.34 0-.628.065-.865.194-.237.13-.4.3-.488.512z" />
			</svg>
		),
	},
	{
		name: "Spotify",
		icon: (
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
				<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
			</svg>
		),
	},
	{
		name: "Apple",
		icon: (
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
				<path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
			</svg>
		),
	},
	{
		name: "Google",
		icon: (
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
				<path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
			</svg>
		),
	},
	{
		name: "Uber",
		icon: (
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
				<path d="M0 7.97v4.958c0 1.867 1.302 3.101 3 3.101.876 0 1.585-.26 2.072-.744v.593H6.39V7.97H5.07v4.937c0 1.198-.725 1.937-1.852 1.937S1.32 14.106 1.32 12.907V7.97zm10.142 0v.593c-.487-.484-1.196-.744-2.072-.744-1.698 0-3 1.234-3 3.1 0 1.868 1.302 3.101 3 3.101.876 0 1.585-.26 2.072-.744v.593h1.318V7.97zm-1.856 4.937c-1.127 0-1.852-.739-1.852-1.937s.725-1.937 1.852-1.937 1.852.739 1.852 1.937-.725 1.937-1.852 1.937zM17.34 7.819c-1.908 0-3.23 1.234-3.23 3.1 0 1.918 1.373 3.102 3.332 3.102.936 0 1.752-.282 2.382-.834l-.695-.855c-.454.378-.997.574-1.587.574-.946 0-1.674-.498-1.874-1.395h4.442a4.2 4.2 0 00.052-.592c0-1.866-1.26-3.1-3.022-3.1zm-1.672 2.55c.202-.876.856-1.446 1.672-1.446.856 0 1.482.568 1.622 1.446zM24 7.97h-1.318v1.903c0 .15-.014.343-.042.538l-.068.454h.004l-.008.018v.003a1.39 1.39 0 01-.086.169 1.858 1.858 0 01-1.544.84c-.936 0-1.556-.658-1.556-1.695V7.97h-1.318v2.38c0 1.583.856 2.67 2.38 2.67.765 0 1.402-.313 1.84-.836v.684H24z" />
			</svg>
		),
	},
	{
		name: "Airbnb",
		icon: (
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
				<path d="M12.001 18.275c-.768-1.16-1.279-2.197-1.628-3.048a28.486 28.486 0 01-.535-1.508c-.025-.086-.054-.176-.085-.27l-.015-.048c-.298-.96-.637-2.048-.408-3.143.126-.602.49-1.127.975-1.406a1.798 1.798 0 011.694 0c.484.279.849.804.974 1.406.229 1.095-.11 2.183-.407 3.143l-.015.048c-.031.094-.06.184-.085.27a28.49 28.49 0 01-.536 1.508c-.35.851-.86 1.887-1.628 3.048h-.301zM12 20.5c.923-1.403 1.544-2.654 1.928-3.588.211-.513.385-.986.528-1.404.041-.12.077-.235.109-.343l.019-.063c.262-.844.616-1.977.371-3.146a3.04 3.04 0 00-1.629-2.201 2.988 2.988 0 00-2.652 0 3.04 3.04 0 00-1.629 2.2c-.244 1.17.11 2.303.371 3.147l.02.063c.031.108.067.222.108.343.143.418.317.891.528 1.404.384.934 1.005 2.185 1.928 3.588zm0 2.374s-4.635-6.526-4.635-10.025a4.757 4.757 0 019.27 0c0 3.499-4.635 10.025-4.635 10.025z" />
			</svg>
		),
	},
	{
		name: "PlayStation",
		icon: (
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
				<path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.886.49.266.678.945.678 1.634v4.577c2.328 1.15 4.203.19 4.203-2.607 0-2.808-1.263-4.316-4.798-5.163-1.828-.552-3.252-1.053-4.792-1.647zm8.89 12.504c-1.508-.696-3.253-.478-3.253-.478l-5.21 1.752v3.463l5.36-1.903c.593-.213 1.056-.074 1.056.403 0 .478-.463.868-1.056 1.08l-5.36 1.918v2.49l3.253-1.156s3.62-1.292 5.21-2.406c1.588-1.108 1.508-3.862 0-5.163zm-16.55 3.727c-1.588.86-.727 2.655 1.134 3.322l5.437 1.872v-2.49l-3.49-1.224c-.593-.2-1.056-.581-1.056-1.06 0-.477.463-.613 1.056-.403l3.49 1.21v-2.437s-2.283-.328-4.203.453c-.572.233-1.458.744-2.368 1.227z" />
			</svg>
		),
	},
	{
		name: "Disney+",
		icon: (
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
				<path d="M2.056 6.834c-.112.224-.168.504-.168.784 0 1.96 3.024 3.528 6.776 3.528.728 0 1.456-.056 2.128-.168-.392.728-.84 1.4-1.344 1.96-1.904-.392-3.36-1.176-3.36-1.176s.056.336.168.672c.112.28.28.616.504.896.336.448.784.84 1.288 1.12-.448.336-.952.616-1.456.84-2.576 1.064-4.816.728-5.04.224-.168-.392.784-1.288 2.52-2.128.224-.112.504-.224.784-.336-.168-.168-.336-.336-.504-.504C2.336 10.81.992 8.57.992 6.834c0-.392.056-.728.168-1.008-.504.336-.896.728-1.064 1.176-.056.168-.096.392-.096.616 0 2.016 2.576 5.264 6.44 6.608-.952.784-1.624 1.568-1.904 2.24-.168.336-.224.672-.224.952 0 1.736 2.184 2.352 4.872 1.288.84-.336 1.68-.84 2.408-1.456 2.072.224 4.088-.056 5.376-.84.84-.504 1.4-1.232 1.568-2.072.112-.504.056-1.008-.112-1.456 1.96-.616 3.36-1.568 3.36-2.632 0-.28-.112-.56-.336-.784l-.004-.002c1.344-.448 2.296-1.12 2.296-1.848 0-.336-.168-.672-.504-.952.56-.28.952-.616 1.12-.952.056-.168.112-.336.112-.504 0-.616-.56-1.12-1.456-1.456.168-.336.224-.672.224-.952 0-1.064-1.12-1.736-2.856-1.736-.504 0-1.064.056-1.624.168C17.696.504 15.568 0 13.496 0c-2.408 0-4.592.672-5.88 1.736-.784-.28-1.456-.392-2.016-.392C3.4 1.344 2.056 2.8 2.056 6.834" />
			</svg>
		),
	},
	{
		name: "YouTube",
		icon: (
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
				<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
			</svg>
		),
	},
	{
		name: "Shopify",
		icon: (
			<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
				<path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.058-.121-.074l-.914 21.104zm-1.331-21.14c-.041 0-.152.041-.252.069-.148-.451-.405-1.073-.871-1.627-.855-.809-1.721-.872-2.143-.872h-.003c-.061 0-.119.003-.174.008-.025-.031-.049-.061-.075-.092C9.88-.258 9.007-.003 8.316.741c-1.331 1.435-1.867 3.634-2.09 4.892-.909.282-1.55.48-1.633.506-.482.152-.497.167-.56.621C4.003 7 2.252 20.307 2.252 20.307l11.479 2.15.275-19.618zM11.21 8.456l-.878.271c0-.009 0-.018-.001-.028 0-.484-.067-1.095-.268-1.705l1.147.179c0 .001-.001.848 0 1.283zm-2.147.663c-.09.028-.188.058-.291.09l-.003.001c-.26.08-.543.168-.842.26.243-1.013.702-1.995 1.258-2.508.055.082.121.194.176.322.209.486.318 1.151.318 1.831 0 .001-.208.002-.616.004zm1.015-4.217c.149 0 .298.015.437.077.685.329 1.048 1.266 1.212 1.912l-1.53.474c.001-.528-.048-1.348-.422-2.053.098-.245.19-.355.303-.41z" />
			</svg>
		),
	},
	{
		name: "Millions more...",
		icon: <MoreHorizontal className="h-5 w-5" />,
	},
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
									Virtual &amp; Physical Cards
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
								Your KobKlein balance, now accepted everywhere.
								A Visa card that connects your digital wallet to
								the world.
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
										label: "Bank-Grade Security",
									},
									{
										icon: Globe,
										label: "Accepted Worldwide",
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
									Join the Waitlist
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

								{/* Visa mark */}
								<div className="absolute top-10 right-8 mt-6 text-kob-gold/30 text-sm font-bold italic tracking-wider">
									VISA
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
							K-Card gives you the power and flexibility of a
							premium Visa card, backed by your KobKlein wallet.
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

			{/* ═══ Supported Merchants ═══ */}
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
							Shop at Your Favorite{" "}
							<span className="gradient-gold-text">Brands</span>
						</h2>
						<p className="text-kob-muted mt-4 text-lg max-w-2xl mx-auto">
							K-Card is accepted everywhere Visa is accepted —
							online and in-store worldwide.
						</p>
						<div className="mt-6 mx-auto w-24 h-0.5 bg-gradient-to-r from-transparent via-kob-gold to-transparent" />
					</motion.div>

					<motion.div
						variants={stagger}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true }}
						className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
					>
						{merchants.map((m, i) => (
							<motion.div
								key={m.name}
								variants={scaleIn}
								custom={i}
							>
								<div className="card-sovereign shimmer-gold p-4 text-center group hover:border-kob-gold/30 hover:shadow-md hover:shadow-kob-gold/5 transition-all duration-300">
									<div className="w-10 h-10 rounded-full bg-kob-gold/5 border border-kob-gold/15 flex items-center justify-center mx-auto mb-2 group-hover:bg-kob-gold/10 group-hover:scale-110 transition-all duration-300 text-kob-gold/50 group-hover:text-kob-gold/70">
										{m.icon}
									</div>
									<span className="text-xs text-kob-body font-medium">
										{m.name}
									</span>
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Divider */}
			<div className="divider-teal-gold" />

			{/* ═══ Waitlist CTA ═══ */}
			<section
				id="waitlist"
				className="relative py-24 md:py-32 bg-kob-navy overflow-hidden"
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
								Be Among the First to Get{" "}
								<span className="gradient-gold-text">
									K-Card
								</span>
							</h2>
							<div className="mt-2 mb-6 w-24 h-0.5 bg-gradient-to-r from-kob-gold via-kob-gold/60 to-transparent" />
							<p className="text-kob-muted text-lg mb-8 leading-relaxed">
								K-Card is rolling out to KobKlein members. Join
								the waitlist to secure your spot and be notified
								when your card is ready.
							</p>

							<div className="space-y-4">
								{[
									"Instant virtual card delivered to your app",
									"Physical card shipped to your address",
									"No annual fees for early members",
									"Priority access to premium features",
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
									Join the K-Card Waitlist
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
												: "Join Waitlist"}
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
