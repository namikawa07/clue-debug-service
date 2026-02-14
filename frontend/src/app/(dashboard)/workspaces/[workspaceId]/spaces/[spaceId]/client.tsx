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

  console.log(
    " 📝 space.imageUrl ? ☑️",
    space?.imageUrl
  );
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <SpaceAvatar
            name={space.name}
            image={space.imageUrl}
            className="size-8"
          />
          <p className="text-lg font-semibold">{space.name}</p>
        </div>
        <div>
          <Button variant="secondary" size="sm" asChild>
            <Link
              href={`/workspaces/${space.workspaceId}/spaces/${space.id}/settings`}
            >
              <PencilIcon className="size-4 mr-2" />
              Edit Space
            </Link>
          </Button>
        </div>
      </div>
      {analytics ? <Analytics data={analytics} /> : null}
      <TaskViewSwitcher hideProjectFilter />
    </div>
  );
};
