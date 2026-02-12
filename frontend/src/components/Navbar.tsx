"use client";

import { usePathname } from "next/navigation";
import { Share2 } from "lucide-react";

import { MobileSidebar } from "./mobile-sidebar";
import { UserBtn } from "@/features/auth/components/UserBtn";
import { NotificationBell } from "@/components/notifications";
import { ConnectionStatus } from "@/components/presence";
import { useConnectionStatus } from "@/contexts/realtime-context";

const pathnameMap = {
    "tasks": "Tasks",
    "projects": "Projects",
    "activity": "Inbox",
    "members": "Teams"
} as const;

export const Navbar = () => {
    const pathname = usePathname();
    const { isConnected, connectionError } = useConnectionStatus();

    // Simple breadcrumb logic
    const pathParts = pathname.split('/').filter(Boolean);
    const feature = pathParts.length > 2 ? pathParts[2] : "";
    const featureName = pathnameMap[feature as keyof typeof pathnameMap] || feature.charAt(0).toUpperCase() + feature.slice(1) || "Dashboard";

    return (
        <div className="h-14 px-6 flex items-center justify-between bg-white border-b border-gray-200">
            {/* Left: Mobile sidebar + breadcrumb */}
            <div className="flex items-center gap-3 flex-1">
                <MobileSidebar />

                {/* Clean, minimal breadcrumb style matching snippet */}
                <div className="hidden md:flex items-center gap-2 text-sm">
                    <span className="text-gray-500">FinePro</span>
                    <span className="text-gray-400">›</span>
                    <span className="font-medium text-gray-900">{featureName}</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* Connection status */}
                <div className="hidden lg:flex items-center">
                    <ConnectionStatus
                        isConnected={isConnected}
                        error={connectionError}
                        showLabel={false}
                    />
                </div>

                {/* Share Button (Snippet Style) */}
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors">
                    <Share2 size={16} />
                    <span>Share</span>
                </button>

                {/* Notification bell (Matches red dot logic) */}
                <NotificationBell />

                {/* User button */}
                <UserBtn />
            </div>
        </div>
    );
};