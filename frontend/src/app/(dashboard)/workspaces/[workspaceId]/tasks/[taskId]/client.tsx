"use client";

import { useTaskId } from "@/features/tasks/hooks/use-task-id";
import { useGetTask } from "@/features/tasks/api/use-get-task";
import { TaskOverview } from "@/features/tasks/components/task-overview";
import { TaskBreadcrumbs } from "@/features/tasks/components/task-breadcrumbs";
import { TaskDescription } from "@/features/tasks/components/task-description";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

export const TaskIdClient = () => {
    const taskId = useTaskId();
    const { data, isLoading } = useGetTask({ taskId });

    if (isLoading) return <PageLoader />;
    if (!data) return <PageError message="Task not found" />;

    const space = (data as any).project;

    return (
        <div className="flex flex-col gap-5">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-5 py-4">
                <TaskBreadcrumbs
                    space={space || { $id: "", name: "Unknown Space", imageUrl: "", workspaceId: "" }}
                    task={data}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <TaskOverview task={data} />
                <TaskDescription task={data} />
            </div>
        </div>
    );
};
