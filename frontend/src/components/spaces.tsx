"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Plus, LayoutList } from "lucide-react";

import { cn } from "@/lib/utils";

import { useGetSpaces } from "@/features/spaces/api/use-get-spaces";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateSpaceModal } from "@/features/spaces/hooks/use-create-space-modal";
import { Space } from "@/features/spaces/types";

export const Spaces = () => {
  const pathname = usePathname();
  const { open } = useCreateSpaceModal();
  const workspaceId = useWorkspaceId();
  const { data } = useGetSpaces({ workspaceId });

  const [isExpanded, setIsExpanded] = useState(true);

  const renderSpace = (space: Space) => {
    const href = `/workspaces/${workspaceId}/spaces/${space.$id}`;
    const isActive = pathname === href;

    return (
      <Link href={href} key={space.$id}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all duration-150 cursor-pointer overflow-hidden",
            isActive
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          {/* Using LayoutList icon as placeholder if no image, matching snippet style logic */}
          <LayoutList size={14} className="shrink-0" />
          <span className="truncate">{space.name}</span>
        </div>
      </Link>
    );
  };

  if (!data?.documents || data.documents.length === 0) {
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Spaces</span>
          </div>
          <button
            onClick={open}
            className="text-gray-400 hover:text-gray-600"
          >
            <Plus size={14} />
          </button>
        </div>
        <p className="px-3 py-1 text-xs text-gray-400">No spaces yet</p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown size={14} className="text-gray-600 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-gray-600 shrink-0" />
          )}
          <span className="text-xs font-semibold text-gray-600 select-none">Spaces</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); open(); }}
          className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-0.5">
          {data.documents.map((space) => renderSpace(space))}

          <button
            onClick={open}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 w-full mt-1 transition-colors"
          >
            <Plus size={14} />
            <span>New</span>
          </button>
        </div>
      )}
    </div>
  );
};
