"use client";

import Link from "next/link";
import { Plus, ArrowRight, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SpaceAvatar } from "@/features/spaces/components/space-avatar";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetSpaces } from "@/features/spaces/api/use-get-spaces";
import { useCreateSpaceModal } from "@/features/spaces/hooks/use-create-space-modal";

export const WorkspaceSpacesList = () => {
  const workspaceId = useWorkspaceId();
  const { open } = useCreateSpaceModal();
  const { data: spaces, isLoading } = useGetSpaces({ workspaceId });

  const spaceList = spaces?.documents ?? [];

  return (
    <section className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Spaces
            <span className="ml-2 text-xs font-normal text-gray-400">
              {spaceList.length} {spaceList.length === 1 ? "space" : "spaces"}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Spaces are containers for your tasks and projects.
          </p>
        </div>
        <Button
          size="sm"
          onClick={open}
          className="bg-blue-600 hover:bg-blue-700 text-white h-8 gap-1.5 text-xs"
        >
          <Plus size={13} />
          New Space
        </Button>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-sm text-gray-400">Loading spaces…</div>
      ) : spaceList.length === 0 ? (
        <div className="p-10 text-center">
          <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <LayoutGrid size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No spaces yet</p>
          <p className="text-xs text-gray-400 mt-1">Create your first space to organize tasks.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={open}
            className="mt-4 border-gray-200 gap-1.5"
          >
            <Plus size={13} />
            Create space
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {spaceList.map((space) => (
            <div
              key={space.id}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <SpaceAvatar
                  className="size-8 shrink-0"
                  name={space.name}
                  image={space.imageUrl}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{space.name}</p>
                  {space.description && (
                    <p className="text-xs text-gray-400 truncate">{space.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-7 text-xs border-gray-200 gap-1"
                >
                  <Link href={`/workspaces/${workspaceId}/spaces/${space.id}`}>
                    Open
                    <ArrowRight size={11} />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-7 text-xs border-gray-200"
                >
                  <Link href={`/workspaces/${workspaceId}/spaces/${space.id}/settings`}>
                    Settings
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
