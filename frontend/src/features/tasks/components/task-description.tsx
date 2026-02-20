import { useState } from "react";
import { PencilIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Task } from "../types";
import { useUpdateTask } from "../api/use-update-task";

interface TaskDescriptionProps {
  task: Task;
}

export const TaskDescription = ({ task }: TaskDescriptionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task.description);

  const { mutate, isPending } = useUpdateTask();

  const handleSave = () => {
    mutate({
      json: { description: value },
      param: { taskId: task.$id },
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-900">Description</p>
        <Button
          onClick={() => setIsEditing((prev) => !prev)}
          size="sm"
          variant="outline"
          className="h-8 text-xs border-gray-200 gap-1.5"
        >
          {isEditing ? (
            <XIcon size={12} />
          ) : (
            <PencilIcon size={12} />
          )}
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-y-3">
          <Textarea
            placeholder="Add a description…"
            value={value}
            rows={5}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
            className="border-gray-200 text-sm resize-none focus-visible:ring-blue-500"
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="w-fit ml-auto bg-blue-600 hover:bg-blue-700 text-white h-8 px-4 text-xs"
          >
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      ) : (
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {task.description || (
            <span className="text-gray-400 italic">No description yet. Click Edit to add one.</span>
          )}
        </div>
      )}
    </div>
  );
};
