import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";

import { Space } from "@/features/spaces/types";
import { SpaceAvatar } from "@/features/spaces/components/space-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";

import { Task } from "../types";
import { useDeleteTask } from "../api/use-delete-task";
import { useRouter } from "next/navigation";

interface TaskBreadcrumbsProps {
    space: Space;
    task: Task;
}

export const TaskBreadcrumbs = ({
    space,
    task
}: TaskBreadcrumbsProps) => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();

    const { mutate, isPending } = useDeleteTask();
    const [ConfirmDialog, confirm] = useConfirm(
        "Delete task",
        "This action cannot be undone.",
        "destructive"
    );

    const handleDeleteTask = async () => {
        const ok = await confirm();
        if (!ok) return;

        mutate({ param: { taskId: task.$id } }, {
            onSuccess: () => {
                router.push(`/workspaces/${workspaceId}/tasks`);
            },
        });
    };

    return (
        <div className="flex items-center gap-2">
            <ConfirmDialog />
            <SpaceAvatar
                name={space.name}
                image={space.imageUrl}
                className="size-6 shrink-0"
            />
            <Link href={`/workspaces/${workspaceId}/spaces/${space.$id}`}>
                <span className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                    {space.name}
                </span>
            </Link>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
            <span className="text-sm font-semibold text-gray-900 truncate">
                {task.name}
            </span>
            <Button
                onClick={handleDeleteTask}
                disabled={isPending}
                className="ml-auto shrink-0 h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                size="sm"
            >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Delete Task</span>
            </Button>
        </div>
    );
};
