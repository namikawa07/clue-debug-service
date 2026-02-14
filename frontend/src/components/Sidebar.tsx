"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  LayoutList,
  Users, // for Teams
  Circle,
  User, // for Created by me
  ChevronDown,
  Plus,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { useCurrent } from "@/features/auth/api/use-current";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { Spaces } from "@/components/spaces";

export const Sidebar = () => {
  const { data: user } = useCurrent();
  const workspaceId = useWorkspaceId();
  const pathname = usePathname();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "User";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const userEmail = user?.email || "user@example.com";

  // Navigation Items matching the snippet
  const navItems = [
    { label: "Dashboard", href: `/workspaces/${workspaceId}`, icon: LayoutGrid },
    { label: "Inbox", href: `/workspaces/${workspaceId}/activity`, icon: LayoutList }, // Inbox -> Activity feed?
    { label: "Teams", href: `/workspaces/${workspaceId}/members`, icon: Users },
    { label: "Assigned to me", href: `/workspaces/${workspaceId}/tasks?assigneeId=${user?.$id}`, icon: Circle },
    { label: "Created by me", href: `/workspaces/${workspaceId}/tasks?creatorId=${user?.$id}`, icon: User },
  ];

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname?.startsWith(href);
  };

  return (
    <aside className="h-full bg-white border-r border-gray-200 flex flex-col w-full">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2 border-b border-gray-200 h-[60px]">
        <Link href={`/workspaces/${workspaceId}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">FP</span>
            </div>
            <span className="font-semibold text-gray-900">FinePro</span>
          </div>
        </Link>
      </div>

      {/* Workspace Switcher */}
      <div className="p-3 border-b border-gray-200">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* Main Links */}
          <div className="space-y-0.5 mb-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);

              return (
                <Link key={item.label} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200",
                      isActive
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Favorites - Hardcoded for UI match */}
          <div className="mb-2">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 cursor-pointer hover:text-gray-900 text-gray-600 transition-colors">
                <ChevronDown size={14} />
                <span className="text-xs font-semibold">Favorites</span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Plus size={14} />
              </button>
            </div>
            {/* Empty favorites list placeholder */}
          </div>

          {/* Projects */}
          <div className="mt-2">
            <Spaces />
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium">
            {avatarInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate text-gray-900">{displayName}</div>
            <div className="text-xs text-gray-500 truncate">{userEmail}</div>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>
    </aside>
  );
};
