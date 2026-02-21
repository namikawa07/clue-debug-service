"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useGetSpaces } from "@/features/spaces/api/use-get-spaces";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useSpaceId } from "@/features/spaces/hooks/use-space-id";
import { useLastSpace } from "@/features/spaces/hooks/use-last-space";
import { SpaceAvatar } from "@/features/spaces/components/space-avatar";
import { Space } from "@/features/spaces/types";
import { routes } from "@/lib/routes";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SpacesSwitcher = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const currentSpaceId = useSpaceId();
  const { data: spacesData } = useGetSpaces({ workspaceId });
  const lastSpace = useLastSpace(workspaceId);

  const spaces = spacesData?.documents ?? [];
  const currentSpace = spaces.find(
    (s: Space) => s.$id === currentSpaceId || s.id === currentSpaceId
  );

  // Auto-select last-used space on mount (runs once, avoids SSR mismatch)
  useEffect(() => {
    if (currentSpaceId || spaces.length === 0) return;

    const lastId = lastSpace.get();
    const lastExists = lastId && spaces.some((s: Space) => (s.$id ?? s.id) === lastId);
    const commonSpace = spaces.find((s: Space) => s.name === "Common Space");
    const target =
      lastExists
        ? lastId!
        : commonSpace
        ? (commonSpace.$id ?? commonSpace.id)
        : (spaces[0].$id ?? spaces[0].id);

    router.push(routes.space(workspaceId, target));
  }, [spaces]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSelect = (id: string) => {
    lastSpace.set(id);
    router.push(routes.space(workspaceId, id));
  };

  return (
    <Select onValueChange={onSelect} value={currentSpaceId ?? ""}>
      <SelectTrigger className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-medium px-3 py-2 h-9 rounded-lg transition-colors duration-150 text-sm">
        <div className="flex items-center gap-2 w-full min-w-0">
          {currentSpace ? (
            <>
              <SpaceAvatar
                name={currentSpace.name}
                image={currentSpace.imageUrl}
                className="size-5 shrink-0"
              />
              <span className="truncate flex-1 text-left">{currentSpace.name}</span>
            </>
          ) : (
            <SelectValue placeholder="Select space" />
          )}
        </div>
      </SelectTrigger>

      <SelectContent>
        {spaces.map((space: Space) => (
          <SelectItem
            key={space.$id ?? space.id}
            value={space.$id ?? space.id}
          >
            <div className="flex items-center gap-2 font-medium">
              <SpaceAvatar name={space.name} image={space.imageUrl} />
              <span className="truncate">{space.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
