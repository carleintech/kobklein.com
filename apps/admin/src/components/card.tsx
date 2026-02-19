import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  title,
  value,
  sub,
  accent,
  icon,
  className,
}: {
  title: string;
  value: string | number;
  sub?: string;
  accent?: "gold" | "red" | "green" | "blue" | "yellow" | "default";
  icon?: ReactNode;
  className?: string;
}) {
  const colorMap = {
    gold: "text-[#C9A84C]",
    red: "text-red-400",
    green: "text-emerald-400",
    blue: "text-sky-400",
    yellow: "text-amber-400",
    default: "text-[#F0F1F5]",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/5 bg-[#0F1D35] p-5 flex flex-col gap-1 transition-colors duration-200 hover:border-[#C9A84C]/20",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#6B7489] uppercase tracking-wide">
          {title}
        </span>
        {icon && <span className="text-[#6B7489]">{icon}</span>}
      </div>
      <span className={cn("text-2xl font-semibold tabular-nums", colorMap[accent ?? "default"])}>
        {value}
      </span>
      {sub && <span className="text-xs text-[#6B7489]">{sub}</span>}
    </div>
  );
}
