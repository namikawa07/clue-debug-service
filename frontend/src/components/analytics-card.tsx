import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { cn } from "@/lib/utils";

type CardColor = "blue" | "violet" | "emerald" | "red" | "amber";

interface AnalyticsCardProps {
    title: string;
    value: number;
    variant: "up" | "down";
    increaseValue: number;
    color?: CardColor;
}

const colorStyles: Record<CardColor, { bg: string; icon: string; badge: string; text: string }> = {
    blue:    { bg: "bg-blue-50",    icon: "text-blue-600",    badge: "bg-blue-100 text-blue-700",    text: "text-blue-800" },
    violet:  { bg: "bg-violet-50",  icon: "text-violet-600",  badge: "bg-violet-100 text-violet-700", text: "text-violet-800" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700", text: "text-emerald-800" },
    red:     { bg: "bg-red-50",     icon: "text-red-600",     badge: "bg-red-100 text-red-700",      text: "text-red-800" },
    amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   badge: "bg-amber-100 text-amber-700",  text: "text-amber-800" },
};

export const AnalyticsCard = ({
    title,
    value,
    variant,
    increaseValue,
    color = "blue",
}: AnalyticsCardProps) => {
    const styles = colorStyles[color];
    const Icon = variant === "up" ? FaCaretUp : FaCaretDown;
    const trendColor = variant === "up" ? "text-emerald-600" : "text-red-500";

    return (
        <div className={cn("rounded-xl p-4 flex flex-col gap-2 border border-gray-100 bg-white shadow-sm")}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
            <p className={cn("text-3xl font-bold", styles.text)}>{value}</p>
            <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit", styles.badge)}>
                <Icon className={cn("size-3", trendColor)} />
                <span>{Math.abs(increaseValue)} vs last month</span>
            </div>
        </div>
    );
}
