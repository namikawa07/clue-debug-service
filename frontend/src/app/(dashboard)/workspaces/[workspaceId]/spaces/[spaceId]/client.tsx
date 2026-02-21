"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  PencilIcon,
  Layers,
  CheckCircle2,
  BarChart3,
  Zap,
  Target,
} from "lucide-react";

import { useSpaceId } from "@/features/spaces/hooks/use-space-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetSpace } from "@/features/spaces/api/use-get-space";
import { SpaceAvatar } from "@/features/spaces/components/space-avatar";
import { TaskViewSwitcher } from "@/features/tasks/components/task-view-switcher";
import { useGetEpics } from "@/features/epics/api/use-get-epics";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const SpaceIdClient = () => {
  const spaceId = useSpaceId();
  const workspaceId = useWorkspaceId();
  const { data: space, isLoading: isLoadingSpace } = useGetSpace({ spaceId });
  const { data: epics, isLoading: isLoadingEpics } = useGetEpics({ spaceId });

  const isLoading = isLoadingSpace || isLoadingEpics;

  const stats = useMemo(() => {
    if (!epics || epics.length === 0)
      return { totalTasks: 0, completedTasks: 0, activeEpics: 0, completionRate: 0 };

    const totalTasks = epics.reduce((sum, e: any) => sum + (e.task_count ?? 0), 0);
    const completedTasks = epics.reduce(
      (sum, e: any) => sum + (e.completed_task_count ?? 0),
      0
    );
    const activeEpics = epics.filter((e: any) => e.status === "in_progress").length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return { totalTasks, completedTasks, activeEpics, completionRate };
  }, [epics]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!space) {
    return <PageError message="Space not found" />;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
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
        <Button
          variant="outline"
          size="sm"
          asChild
          className="border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <Link href={`/workspaces/${space.workspaceId}/spaces/${space.id}/settings`}>
            <PencilIcon className="size-3.5 mr-2" />
            Edit Space
          </Link>
        </Button>
      </div>

      {/* Mini stats row */}
      {epics && epics.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
            <BarChart3 size={12} />
            {stats.totalTasks} tasks
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
            <Zap size={12} />
            {stats.activeEpics} active epics
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
            <Target size={12} />
            {stats.completionRate}% complete
          </div>
        </div>
      )}

      {/* Epic overview cards */}
      {epics && epics.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {epics.map((epic: any) => {
            const taskCount = epic.task_count ?? 0;
            const completedCount = epic.completed_task_count ?? 0;
            const pct = epic.completion_percentage ?? 0;
            const statusKey = epic.status ?? "todo";

            return (
              <Link
                key={epic.id}
                href={`/workspaces/${workspaceId}/spaces/${spaceId}/epics/${epic.id}`}
                className="group"
              >
                <div className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all duration-150 bg-white">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                      <span className="font-medium text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
                        {epic.name}
                      </span>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs shrink-0 border-0",
                        statusColors[statusKey] ?? statusColors.todo
                      )}
                    >
                      {statusLabels[statusKey] ?? statusKey}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  {taskCount > 0 ? (
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          {completedCount}/{taskCount} tasks
                        </span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No tasks yet</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-gray-200 rounded-xl">
          <Layers size={28} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No epics in this space yet</p>
        </div>
      )}

      {/* Task view switcher */}
      <TaskViewSwitcher hideSpaceFilter />
    </div>
  );
};
