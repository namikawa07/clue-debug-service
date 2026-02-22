"use client";
import Link from "next/link";
import { Circle, Clock, AlertTriangle, CheckCircle2, Ban, ArrowUpRight } from "lucide-react";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useGetTask } from "@/features/tasks/api/use-get-task";
import { cn } from "@/lib/utils";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  todo:        <Circle        className="size-3 text-neutral-400 shrink-0" />,
  in_progress: <Clock         className="size-3 text-blue-500 shrink-0" />,
  review:      <AlertTriangle className="size-3 text-amber-500 shrink-0" />,
  done:        <CheckCircle2  className="size-3 text-emerald-500 shrink-0" />,
  blocked:     <Ban           className="size-3 text-red-500 shrink-0" />,
};

const STATUS_LABELS: Record<string, string> = {
  todo: "TO DO", in_progress: "IN PROGRESS", review: "REVIEW",
  done: "DONE",  blocked: "BLOCKED",
};

interface TaskChipProps {
  taskId: string;
  title: string;
  workspaceId: string;
}

export const TaskChip = ({ taskId, title, workspaceId }: TaskChipProps) => {
  const { data: task } = useGetTask({ taskId });

  return (
    <Link
      href={`/workspaces/${workspaceId}/tasks/${taskId}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 align-middle",
        "bg-neutral-100 dark:bg-neutral-800/80",
        "border border-neutral-200 dark:border-neutral-700",
        "rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700",
        "transition-colors group max-w-fit"
      )}
    >
      {/* Status icon */}
      {STATUS_ICONS[task?.status ?? "todo"]}

      {/* Task name */}
      <span className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 max-w-[130px] truncate">
        {task?.name ?? title}
      </span>

      {/* Status badge */}
      {task?.status && (
        <span className="text-[9px] font-bold tracking-wide px-1 py-0.5 rounded
                         bg-neutral-200/80 dark:bg-neutral-700
                         text-neutral-500 dark:text-neutral-400 shrink-0">
          {STATUS_LABELS[task.status] ?? task.status.toUpperCase()}
        </span>
      )}

      {/* Assignee avatar */}
      {task?.assignee?.name && task.assignee.name !== "Unassigned" && (
        <MemberAvatar
          name={task.assignee.name}
          className="size-3.5 shrink-0"
          avatarColor={task.assignee.avatarColor}
        />
      )}

      {/* Link arrow */}
      <ArrowUpRight className="size-3 shrink-0 text-neutral-400 group-hover:text-neutral-600
                               dark:group-hover:text-neutral-300 transition-colors" />
    </Link>
  );
};
