"use client";

import { ChevronDown } from "lucide-react";

import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { WorkspaceAvatar } from "@/features/workspaces/components/workspace-avatar";

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

  const onSelect = (id: string) => {
    router.push(`/workspaces/${id}`);
  };

  const currentWorkspace = workspaces?.documents.find((w: any) => w.$id === workspaceId);

  return (
    <Select onValueChange={onSelect} value={workspaceId}>
      <SelectTrigger className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium px-3 py-2 h-9 rounded-lg transition-colors duration-150">
        <div className="flex items-center gap-2.5 w-full">
          {currentWorkspace && (
            <>
              <WorkspaceAvatar
                name={currentWorkspace.name}
                image={currentWorkspace.imageUrl}
                className="size-5 shrink-0"
              />
              <SelectValue placeholder="Select a workspace" className="flex-1 text-left text-sm">
                {currentWorkspace.name}
              </SelectValue>
            </>
          )}
          {!currentWorkspace && (
            <SelectValue placeholder="Select a workspace" className="flex-1 text-left text-sm" />
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {workspaces?.documents.map((workspace: any) => (
          <SelectItem key={workspace.$id} value={workspace.$id}>
            <div className="flex justify-start items-center gap-2.5 font-medium">
              <WorkspaceAvatar
                name={workspace.name}
                image={workspace.imageUrl}
              />
              <span className="truncate">{workspace.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
