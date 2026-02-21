"use client";

import Link from "next/link";
import { Layers, Plus, CheckCircle2 } from "lucide-react";

import { useGetEpics } from "@/features/epics/api/use-get-epics";
import { useSpaceId } from "@/features/spaces/hooks/use-space-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateEpic } from "@/features/epics/api/use-create-epic";
import { routes } from "@/lib/routes";
import { PageLoader } from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export const SpaceEpicsClient = () => {
  const workspaceId = useWorkspaceId();
  const spaceId = useSpaceId();
  const { data: epics, isLoading } = useGetEpics({ spaceId });
  const { mutate: createEpic, isPending } = useCreateEpic();

  const handleNewEpic = () => {
    if (!spaceId || isPending) return;
    const title = prompt("Epic title:");
    if (!title?.trim()) return;
    createEpic({ title: title.trim(), spaceId, status: "todo", priority: "medium" });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50">
            <Layers size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Epics</h1>
            <p className="text-sm text-gray-500">
              {epics?.length ?? 0} epic{epics?.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={handleNewEpic} disabled={isPending}>
          <Plus size={14} />
          New Epic
        </Button>
      </div>

      {/* Epic list */}
      {!epics || epics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers size={40} className="text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No epics yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create the first epic to organize your work.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {epics.map((epic: any) => {
            const taskCount = epic.task_count ?? 0;
            const completedCount = epic.completed_task_count ?? 0;
            const pct = epic.completion_percentage ?? 0;
            const statusKey = epic.status ?? "todo";

            return (
              <Link
                key={epic.id}
                href={routes.spaceEpic(workspaceId, spaceId, epic.id)}
                className="group"
              >
                <div className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all duration-150 bg-white">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                      <span className="font-medium text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
                        {epic.title ?? epic.name}
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
                  {taskCount > 0 && (
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
                  )}

                  {taskCount === 0 && (
                    <p className="text-xs text-gray-400">No tasks yet</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
