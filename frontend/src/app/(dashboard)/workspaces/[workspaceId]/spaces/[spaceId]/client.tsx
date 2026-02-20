"use client";

import Link from "next/link";
import { PencilIcon } from "lucide-react";

import { useSpaceId } from "@/features/spaces/hooks/use-space-id";
import { useGetSpace } from "@/features/spaces/api/use-get-space";
import { SpaceAvatar } from "@/features/spaces/components/space-avatar";
import { TaskViewSwitcher } from "@/features/tasks/components/task-view-switcher";
import { useGetSpaceAnalytics } from "@/features/spaces/api/use-get-space-analytics";

import { Button } from "@/components/ui/button";
import { Analytics } from "@/components/analytics";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

export const SpaceIdClient = () => {
  const spaceId = useSpaceId();
  const { data: space, isLoading: isLoadingSpace } = useGetSpace({
    spaceId,
  });
  const { data: analytics, isLoading: isLoadingAnalytics } =
    useGetSpaceAnalytics({ spaceId });

  const isLoading = isLoadingSpace || isLoadingAnalytics;

  if (isLoading) {
    return <PageLoader />;
  }

  if (!space) {
    return <PageError message="Space not found" />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SpaceAvatar
            name={space.name}
            image={space.imageUrl}
            className="size-10"
          />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{space.name}</h1>
            {space.description && (
              <p className="text-sm text-gray-500 mt-0.5">{space.description}</p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="border-gray-200 text-gray-600 hover:bg-gray-50">
          <Link href={`/workspaces/${space.workspaceId}/spaces/${space.id}/settings`}>
            <PencilIcon className="size-3.5 mr-2" />
            Edit Space
          </Link>
        </Button>
      </div>
      {analytics ? <Analytics data={analytics} /> : null}
      <TaskViewSwitcher hideSpaceFilter />
    </div>
  );
};
