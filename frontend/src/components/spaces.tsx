"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  LayoutList,
  Layers,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useGetSpaces } from "@/features/spaces/api/use-get-spaces";
import { useGetEpics } from "@/features/epics/api/use-get-epics";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateSpaceModal } from "@/features/spaces/hooks/use-create-space-modal";
import { Space } from "@/features/spaces/types";

// ---------------------------------------------------------------------------
// SpaceItem – renders a single space with its epics expandable beneath it
// ---------------------------------------------------------------------------
interface SpaceItemProps {
  space: Space;
  workspaceId: string;
}

const SpaceItem = ({ space, workspaceId }: SpaceItemProps) => {
  const pathname = usePathname();
  const spaceId = space.$id ?? space.id;
  const spaceHref = `/workspaces/${workspaceId}/spaces/${spaceId}`;
  const isSpaceActive = pathname?.startsWith(spaceHref);

  const [isExpanded, setIsExpanded] = useState(isSpaceActive);

  const { data: epics, isLoading: isLoadingEpics } = useGetEpics({
    spaceId: isExpanded ? spaceId : undefined,
  });

  return (
    <div>
      {/* Space row */}
      <div
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-all duration-150 cursor-pointer group",
          isSpaceActive
            ? "bg-gray-100 text-gray-900 font-medium"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={() => setIsExpanded((p) => !p)}
          className="shrink-0 text-gray-400 hover:text-gray-600 p-0.5"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronDown size={12} />
          ) : (
            <ChevronRight size={12} />
          )}
        </button>

        {/* Space link */}
        <Link href={spaceHref} className="flex items-center gap-2 flex-1 min-w-0">
          <LayoutList size={13} className="shrink-0 text-gray-400" />
          <span className="truncate">{space.name}</span>
        </Link>
      </div>

      {/* Epics nested under space */}
      {isExpanded && (
        <div className="ml-5 pl-2 border-l border-gray-100 space-y-0.5 mt-0.5">
          {isLoadingEpics && (
            <p className="text-xs text-gray-400 px-2 py-1">Loading…</p>
          )}

          {!isLoadingEpics && (!epics || epics.length === 0) && (
            <p className="text-xs text-gray-400 px-2 py-1">No epics yet</p>
          )}

          {epics?.map((epic: any) => {
            const epicHref = `/workspaces/${workspaceId}/spaces/${spaceId}/epics/${epic.id}`;
            const isEpicActive = pathname?.startsWith(epicHref);

            return (
              <Link href={epicHref} key={epic.id}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-2 py-1 rounded text-xs transition-all duration-150",
                    isEpicActive
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  )}
                >
                  <Layers size={11} className="shrink-0 text-gray-400" />
                  <span className="truncate">{epic.title ?? epic.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Spaces – main sidebar section listing all spaces
// ---------------------------------------------------------------------------
export const Spaces = () => {
  const workspaceId = useWorkspaceId();
  const { open } = useCreateSpaceModal();
  const { data } = useGetSpaces({ workspaceId });

  const [isSectionExpanded, setIsSectionExpanded] = useState(true);

  const spaces: Space[] = data?.documents ?? [];

  return (
    <div className="mt-2">
      {/* Section header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer group"
        onClick={() => setIsSectionExpanded((p) => !p)}
      >
        <div className="flex items-center gap-2">
          {isSectionExpanded ? (
            <ChevronDown size={14} className="text-gray-600 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-gray-600 shrink-0" />
          )}
          <span className="text-xs font-semibold text-gray-600 select-none">
            Spaces
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="New space"
        >
          <Plus size={14} />
        </button>
      </div>

      {isSectionExpanded && (
        <div className="space-y-0.5">
          {spaces.length === 0 && (
            <p className="px-3 py-1 text-xs text-gray-400">No spaces yet</p>
          )}

          {spaces.map((space) => (
            <SpaceItem
              key={space.$id ?? space.id}
              space={space}
              workspaceId={workspaceId}
            />
          ))}

          <button
            onClick={open}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 w-full mt-1 transition-colors"
          >
            <Plus size={14} />
            <span>New Space</span>
          </button>
        </div>
      )}
    </div>
  );
};
