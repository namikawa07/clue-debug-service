"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, ChevronRight as ChevronFwd } from "lucide-react";

import { cn } from "@/lib/utils";
import { MobileSidebar } from "./mobile-sidebar";
import { UserBtn } from "@/features/auth/components/UserBtn";
import { NotificationBell } from "@/components/notifications";
import { ConnectionStatus } from "@/components/presence";
import { useConnectionStatus } from "@/contexts/realtime-context";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";

const routeLabels: Record<string, string> = {
  tasks:    "Tasks",
  spaces:   "Spaces",
  activity: "Inbox",
  members:  "Members",
  teams:    "Teams",
  notes:    "Notes",
  settings: "Settings",
};

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, connectionError } = useConnectionStatus();
  const workspaceId = useWorkspaceId();
  const { data: workspace } = useGetWorkspace({ workspaceId });

  // Build breadcrumb segments from path
  const parts = pathname.split("/").filter(Boolean);
  const segments: { label: string; href: string }[] = [];

  if (workspace) {
    segments.push({
      label: workspace.name,
      href: `/workspaces/${workspaceId}`,
    });
  }

  // Feature segment (index 2)
  if (parts.length >= 3) {
    const feature = parts[2];
    const label = routeLabels[feature] || (feature.charAt(0).toUpperCase() + feature.slice(1));
    segments.push({ label, href: `/${parts.slice(0, 3).join("/")}` });
  }

  // Deep sub-page
  if (parts.length >= 5 && routeLabels[parts[4]]) {
    segments.push({ label: routeLabels[parts[4]], href: pathname });
  }

  return (
    <div className="h-14 px-5 flex items-center justify-between bg-white border-b border-gray-100 shrink-0">
      {/* Left: Mobile sidebar + back/forward + breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MobileSidebar />

        {/* Back / Forward buttons */}
        <div className="hidden md:flex items-center border border-gray-200 rounded-md overflow-hidden shrink-0">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-7 h-7 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors border-r border-gray-200"
            aria-label="Go back"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => router.forward()}
            className="flex items-center justify-center w-7 h-7 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Go forward"
          >
            <ChevronFwd size={14} />
          </button>
        </div>

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight size={13} className="text-gray-300 shrink-0" />}
              <span
                className={cn(
                  "truncate",
                  i === segments.length - 1
                    ? "font-semibold text-gray-900"
                    : "text-gray-500 hover:text-gray-700 cursor-pointer"
                )}
                onClick={() => i < segments.length - 1 && router.push(seg.href)}
              >
                {seg.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* ConnectionStatus loader in navbar */}
        <div className="hidden lg:flex items-center">
          <ConnectionStatus
            isConnected={isConnected}
            error={connectionError}
            showLabel={false}
          />
        </div>
        <NotificationBell />
        <UserBtn />
      </div>
    </div>
  );
};
