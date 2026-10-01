import { FaCaretDown, FaCaretUp } from "react-icons/fa";

import { cn } from "@/lib/utils";

import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface AnalyticsCardProps {
    title: string;
    value: number;
    variant: "up" | "down";
    increaseValue: number;
}


export const AnalyticsCard = ({ title, value, variant, increaseValue }: AnalyticsCardProps) => {

    const iconColor = variant === "up" ? "text-emerald-500" : "text-red-500";
    const increaseValueColor = variant === "up" ? "text-emerald-500" : "text-red-500";
    const Icon = variant === "up" ? FaCaretUp : FaCaretDown;

    return (
        <Card className="w-full border-none bg-transparent shadow-none">
            <CardHeader className="gap-2 p-5">
                <div className=" flex items-center gap-x-2.5">
                    <CardDescription className=" flex items-center gap-x-2 overflow-hidden">
                        <span className=" truncate text-sm">{title}</span>
                    </CardDescription>
                    <div className=" flex items-center gap-x-1">
                        <Icon className={cn(iconColor, "size-4")} />
                        <span className={cn(increaseValueColor, "truncate text-base font-medium")}>
                            {increaseValue}
                        </span>
                    </div>
                </div>
                <CardTitle className="text-[28px] font-semibold tracking-[-0.04em]">{value}</CardTitle>
            </CardHeader>
        </Card>
    )

}