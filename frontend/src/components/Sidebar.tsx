"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FilePen,
  Settings,
  FileText,
  ChevronDown,
  ListTree,
} from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { useCurrent } from "@/features/auth/api/use-current";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useSpaceId } from "@/features/spaces/hooks/use-space-id";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { routes } from "@/lib/routes";
import { SpacesSwitcher } from "./SpacesSwitcher";
import { EpicsSidebar } from "./EpicsSidebar";

export const Sidebar = () => {
  const { data: user } = useCurrent();
  const workspaceId = useWorkspaceId();
  const spaceId = useSpaceId();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: workspacesData } = useGetWorkspaces();
  const currentWorkspace = workspacesData?.documents?.find(
    (w: any) => w.$id === workspaceId
  );

  const userId = user?.id;
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "User";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const userEmail = user?.email || "";

  const getNavItems = () => {
    if (!spaceId) return [];
    return [
      { label: "Tasks for you",  href: `${routes.spaceTasks(workspaceId, spaceId)}?assigneeId=${userId}`, icon: CheckSquare, base: routes.spaceTasks(workspaceId, spaceId) },
      { label: "Created by you", href: `${routes.spaceTasks(workspaceId, spaceId)}?creatorId=${userId}`,  icon: FilePen,     base: routes.spaceTasks(workspaceId, spaceId) },
      { label: "Notes",          href: routes.spaceNotes(workspaceId, spaceId),                           icon: FileText },
      { label: "Teams",          href: routes.spaceTeams(workspaceId, spaceId),                           icon: Users },
      { label: "All tasks",      href: routes.spaceTasks(workspaceId, spaceId),                           icon: ListTree,    base: routes.spaceTasks(workspaceId, spaceId) },
    ];
  };

  const navItems = getNavItems();

  const isActiveRoute = (item: { href: string; exact?: boolean; base?: string }) => {
    if (item.exact) return pathname === item.href;

    const base = item.base || item.href.split("?")[0];
    const itemHasQueryParams = item.href.includes("?");
    const urlHasQueryParams = searchParams.toString().length > 0;

    if (itemHasQueryParams && !urlHasQueryParams) return false;
    if (!itemHasQueryParams && urlHasQueryParams) return false;

    if (itemHasQueryParams && urlHasQueryParams) {
      const itemParams = new URLSearchParams(item.href.split("?")[1]);
      const urlParamKeys = Array.from(searchParams.keys());
      const hasMatchingParams = Array.from(itemParams.keys()).every((key) =>
        urlParamKeys.includes(key)
      );
      if (!hasMatchingParams) return false;
    }

    return pathname === base || pathname?.startsWith(base + "/");
  };

  const settingsHref = spaceId ? routes.spaceSettings(workspaceId, spaceId) : "";
  const isSettingsActive = settingsHref && pathname?.startsWith(settingsHref);

  return (
    <aside className="h-full bg-white border-r border-gray-100 flex flex-col w-full">
      {/* Logo */}
      <div className="px-4 flex items-center gap-2 h-14 border-b border-gray-100 shrink-0">
        <Link href={spaceId ? routes.space(workspaceId, spaceId) : routes.workspace(workspaceId)} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded overflow-hidden shrink-0">
            <Image
              src="/images/finepro-lglogo.jpg"
              alt="FinePro Logo"
              width={28}
              height={28}
              className="object-cover"
            />
          </div>
          <span className="font-bold text-gray-900 text-base tracking-tight">FinePro</span>
        </Link>
      </div>

      {/* Workspace label */}
      {currentWorkspace && (
        <div className="px-4 py-2 border-b border-gray-100 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
            Workspace
          </p>
          <p className="text-sm font-semibold text-gray-700 truncate">
            {currentWorkspace.name}
          </p>
        </div>
      )}

      {/* Spaces Switcher */}
      <div className="px-3 py-2.5 border-b border-gray-100 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
          Current Space
        </p>
        <SpacesSwitcher />
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

        {/* Epics for selected space */}
        <div className="px-2 mt-1">
          <EpicsSidebar />
        </div>
      </div>

      {/* Bottom: Settings + User */}
      <div className="shrink-0 border-t border-gray-100">
        {settingsHref && (
          <div className="p-2">
            <Link href={settingsHref}>
              <div
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150",
                  isSettingsActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Settings
                  size={15}
                  className={cn(
                    "shrink-0",
                    isSettingsActive ? "text-blue-600" : "text-gray-400"
                  )}
                />
                <span>Settings</span>
              </div>
            </Link>
          </div>
        )}
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
