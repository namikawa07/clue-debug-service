"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useGetEpics } from "@/features/epics/api/use-get-epics";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useSpaceId } from "@/features/spaces/hooks/use-space-id";
import { useCreateEpicModal } from "@/features/epics/hooks/use-create-epic-modal";
import { routes } from "@/lib/routes";

export const EpicsSidebar = () => {
  const workspaceId = useWorkspaceId();
  const spaceId = useSpaceId();
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  const { data: epics, isLoading } = useGetEpics({ spaceId });
  const { open: openCreateEpic } = useCreateEpicModal();

  const filtered = search
    ? epics?.filter((e: any) =>
        (e.title ?? e.name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : epics;

  return (
    <div className="mt-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-semibold text-gray-600 select-none">Epics</span>
        <button
          onClick={openCreateEpic}
          disabled={!spaceId}
          className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
          aria-label="New epic"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Search — only shown when there are more than 5 epics */}
      {(epics?.length ?? 0) > 5 && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
            <Search size={11} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search epics…"
              className="text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400 w-full"
            />
          </div>
        </div>
      )}

      {/* Epic list */}
      <div className="space-y-0.5 px-2">
        {isLoading && (
          <p className="text-xs text-gray-400 px-2 py-1">Loading…</p>
        )}

        {!isLoading && (!filtered || filtered.length === 0) && (
          <p className="text-xs text-gray-400 px-2 py-1">
            {search ? "No matching epics" : "No epics yet — create the first one"}
          </p>
        )}

        {filtered?.map((epic: any) => {
          const epicHref = routes.spaceEpic(workspaceId, spaceId, epic.id);
          const isActive = pathname === epicHref || pathname?.startsWith(epicHref + "/");
          const taskCount = epic.task_count ?? 0;

          return (
            <Link key={epic.id} href={epicHref}>
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all duration-150 group",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Layers
                  size={12}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-indigo-500" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                <span className="truncate flex-1">{epic.title ?? epic.name}</span>
                {taskCount > 0 && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      isActive
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {taskCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
