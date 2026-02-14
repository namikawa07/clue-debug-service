import Link from "next/link";
import { ChevronRightIcon, TrashIcon } from "lucide-react";

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
        <div className="flex items-center gap-x-2">
            <ConfirmDialog />
            <SpaceAvatar
                name={space.name}
                image={space.imageUrl}
                className="size-6 lg:size-8"
            />
            <Link href={`/workspaces/${workspaceId}/spaces/${space.$id}`}>
                <p className="text-sm lg:text-lg font-semibold text-muted-foreground hover:opacity-75 transition">
                    {space.name}
                </p>
            </Link>
            <ChevronRightIcon className="size-4 lg:size-5 text-muted-foreground" />

            <p className="text-sm lg:text-lg font-semibold">
                {task.name}
            </p>
            <Button
                onClick={handleDeleteTask}
                disabled={isPending}
                className="ml-auto"
                variant="destructive"
                size="sm"
            >
                <TrashIcon className="size-4 lg:mr-2" />
                <span className="hidden lg:block">Delete Task</span>
            </Button>
        </div>
    );
};