"use client";

import { Plus } from "lucide-react";

import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { WorkspaceAvatar } from "@/features/workspaces/components/workspace-avatar";
import { useCreateWorkplacesModal } from "@/features/workspaces/hooks/use-create-workplaces-modal";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

export const WorkspaceSwitcher = () => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const { data: workspaces } = useGetWorkspaces();
  const { open: openCreateWorkspace } = useCreateWorkplacesModal();

  const onSelect = (id: string) => {
    if (id === "__create__") {
      openCreateWorkspace();
      return;
    }
    router.push(`/workspaces/${id}`);
  };

  const currentWorkspace = workspaces?.documents.find((w: any) => w.$id === workspaceId);

  return (
    <Select onValueChange={onSelect} value={workspaceId}>
      <SelectTrigger className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium px-3 py-2 h-9 rounded-lg transition-colors duration-150 text-sm">
        <div className="flex items-center gap-2 w-full min-w-0">
          {currentWorkspace ? (
            <>
              <WorkspaceAvatar
                name={currentWorkspace.name}
                image={currentWorkspace.imageUrl}
                className="size-5 shrink-0"
              />
              <span className="truncate flex-1 text-left">{currentWorkspace.name}</span>
            </>
          ) : (
            <SelectValue placeholder="Select workspace" />
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {workspaces?.documents.map((workspace: any) => (
          <SelectItem key={workspace.$id} value={workspace.$id}>
            <div className="flex items-center gap-2 font-medium">
              <WorkspaceAvatar
                name={workspace.name}
                image={workspace.imageUrl}
              />
              <span className="truncate">{workspace.name}</span>
            </div>
          </SelectItem>
        ))}
        <SelectItem value="__create__" className="text-blue-600 font-medium border-t mt-1 pt-2">
          <div className="flex items-center gap-2">
            <Plus size={14} />
            <span>New Workspace</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
