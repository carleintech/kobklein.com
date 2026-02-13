import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("bg-kob-panel rounded-2xl border border-white/5 p-6", className)}
			{...props}
		/>
	);
}
