import { cn } from "@/lib/utils";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className, ...props }: BtnProps) {
	return (
		<button
			className={cn(
				"bg-kob-gold text-kob-black rounded-xl px-6 py-3 font-medium hover:bg-kob-goldLight transition duration-200",
				className
			)}
			{...props}
		/>
	);
}

export function SecondaryButton({ className, ...props }: BtnProps) {
	return (
		<button
			className={cn(
				"border border-kob-gold text-kob-gold rounded-xl px-6 py-3 hover:bg-kob-gold/10 transition duration-200",
				className
			)}
			{...props}
		/>
	);
}
