"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FilePen,
  Settings,
  FileText,
  ChevronDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useCurrent } from "@/features/auth/api/use-current";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { Spaces } from "@/components/spaces";
import Image from "next/image";

export const Sidebar = () => {
  const { data: user } = useCurrent();
  const workspaceId = useWorkspaceId();
  const pathname = usePathname();

  const userId = user?.id;
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "User";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const userEmail = user?.email || "";

  const navItems = [
    { label: "Dashboard", href: `/workspaces/${workspaceId}`, icon: LayoutDashboard, exact: true },
    { label: "Tasks for you", href: `/workspaces/${workspaceId}/tasks?assigneeId=${userId}`, icon: CheckSquare, base: `/workspaces/${workspaceId}/tasks` },
    { label: "Teams", href: `/workspaces/${workspaceId}/members`, icon: Users },
    { label: "Notes", href: `/workspaces/${workspaceId}/notes`, icon: FileText },
    { label: "Created by you", href: `/workspaces/${workspaceId}/tasks?creatorId=${userId}`, icon: FilePen, base: `/workspaces/${workspaceId}/tasks` },
  ];

  const isActiveRoute = (item: { href: string; exact?: boolean; base?: string }) => {
    // Exact match for dashboard to prevent it being always active
    if (item.exact) return pathname === item.href;
    // Use base path (without query params) for sub-routes
    const base = item.base || item.href.split("?")[0];
    return pathname === base || pathname?.startsWith(base + "/");
  };

  return (
    <aside className="h-full bg-white border-r border-gray-100 flex flex-col w-full">
      {/* Logo */}
      <div className="px-4 flex items-center gap-2 h-14 border-b border-gray-100 shrink-0">
        <Link href={`/workspaces/${workspaceId}`} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded overflow-hidden shrink-0">
            <Image src="/images/finepro-lglogo.jpg" alt="FinePro Logo" width={28} height={28} className="object-cover" />
          </div>
          <span className="font-bold text-gray-900 text-base tracking-tight">FinePro</span>
        </Link>
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 py-2.5 border-b border-gray-100 shrink-0">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item);

            return (
              <Link key={item.label} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150 group",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon
                    size={15}
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Spaces Section */}
        <div className="px-2 mt-1">
          <Spaces />
        </div>
      </div>

      {/* Bottom: Settings + User */}
      <div className="shrink-0 border-t border-gray-100">
        <div className="p-2">
          <Link href={`/workspaces/${workspaceId}/settings`}>
            <div className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150",
              pathname?.startsWith(`/workspaces/${workspaceId}/settings`)
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}>
              <Settings size={15} className={cn(
                "shrink-0",
                pathname?.startsWith(`/workspaces/${workspaceId}/settings`) ? "text-blue-600" : "text-gray-400"
              )} />
              <span>Settings</span>
            </div>
          </Link>
        </div>
        {/* User profile */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {avatarInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate text-gray-900">{displayName}</div>
              <div className="text-xs text-gray-400 truncate">{userEmail}</div>
            </div>
            <ChevronDown size={12} className="text-gray-400 shrink-0" />
          </div>
        </div>
      </div>
    </aside>
  );
};
