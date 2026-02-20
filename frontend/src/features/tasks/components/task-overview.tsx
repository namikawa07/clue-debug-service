import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/features/members/components/member-avatar";

import { Task } from "../types";
import { OverviewProperty } from "./overview-property";
import { TaskDate } from "./task-date";
import { Badge } from "@/components/ui/badge";
import { snakeCaseToTitleCase } from "@/lib/utils";
import { useEditTaskModel } from "../hooks/use-edit-task-modal";

interface TaskOverviewProps {
  task: Task;
}

export const TaskOverview = ({ task }: TaskOverviewProps) => {
  const { open } = useEditTaskModel();

  return (
    <div className="flex flex-col gap-y-4 col-span-1">
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-900">Overview</p>
          <Button
            onClick={() => open(task.$id)}
            size="sm"
            variant="outline"
            className="h-8 text-xs border-gray-200 gap-1.5"
          >
            <PencilIcon size={12} />
            Edit
          </Button>
        </div>
        <div className="flex flex-col gap-y-3">
          <OverviewProperty label="Assignee">
            <MemberAvatar
              name={task.assignee?.name || task.assignee?.email || "Unknown"}
              className="size-6"
              avatarColor={task.assignee?.avatarColor}
            />
            <p className="text-sm font-medium text-gray-700">
              {task.assignee?.name || task.assignee?.email || "Unassigned"}
            </p>
          </OverviewProperty>
          <OverviewProperty label="Due Date">
            <TaskDate value={task.dueDate} className="text-sm font-medium" />
          </OverviewProperty>
          <OverviewProperty label="Status">
            <Badge variant={task.status}>
              {snakeCaseToTitleCase(task.status)}
            </Badge>
          </OverviewProperty>
        </div>
      </div>
    </div>
  );
};
