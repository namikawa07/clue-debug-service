"use client";

import { cn } from "@/lib/utils";
import { MemberAvatar } from "./member-avatar";

interface AvatarGroupMember {
    name: string;
    avatarColor?: { bg: string; text: string };
}

interface AvatarGroupStackProps {
    members: AvatarGroupMember[];
    max?: number;
    size?: "sm" | "md";
    className?: string;
}

const sizeClasses = {
    sm: "size-6 text-[10px]",
    md: "size-7 text-xs",
};

export function AvatarGroupStack({
    members,
    max = 3,
    size = "sm",
    className,
}: AvatarGroupStackProps) {
    if (!members || members.length === 0) {
        return <span className="text-xs text-gray-400">No members</span>;
    }

    const visible = members.slice(0, max);
    const overflow = members.length - max;

    return (
        <div className={cn("flex items-center -space-x-2", className)}>
            {visible.map((member, i) => (
                <MemberAvatar
                    key={`${member.name}-${i}`}
                    name={member.name}
                    avatarColor={member.avatarColor}
                    className={cn(sizeClasses[size], "ring-2 ring-white")}
                    fallbackClassName={sizeClasses[size]}
                />
            ))}
            {overflow > 0 && (
                <div
                    className={cn(
                        "rounded-full bg-gray-100 text-gray-600 font-medium flex items-center justify-center ring-2 ring-white",
                        sizeClasses[size]
                    )}
                >
                    +{overflow}
                </div>
            )}
        </div>
    );
}
