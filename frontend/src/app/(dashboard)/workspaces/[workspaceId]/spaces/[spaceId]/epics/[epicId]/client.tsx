"use client";

import { useParams } from "next/navigation";
import { Layers } from "lucide-react";

import { useGetEpics } from "@/features/epics/api/use-get-epics";
import { useSpaceId } from "@/features/spaces/hooks/use-space-id";
import { TaskViewSwitcher } from "@/features/tasks/components/task-view-switcher";
import { PageLoader } from "@/components/page-loader";

export const EpicIdClient = () => {
  const { epicId } = useParams<{ epicId: string }>();
  const spaceId = useSpaceId();

  // Load epics for this space to find the current epic's title
  const { data: epics, isLoading } = useGetEpics({ spaceId });
  const epic = epics?.find((e: any) => e.id === epicId);

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5">
      {/* Epic header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-50">
          <Layers size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {epic?.title ?? epic?.name ?? "Epic"}
          </h1>
          {epic?.description && (
            <p className="text-sm text-gray-500 mt-0.5">{epic.description}</p>
          )}
        </div>
      </div>

      {/* Tasks scoped to this epic */}
      <TaskViewSwitcher epicId={epicId} hideSpaceFilter />
    </div>
  );
};
