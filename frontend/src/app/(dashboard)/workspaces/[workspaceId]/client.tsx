"use client";

import Link from "next/link"
import { formatDistanceToNow } from "date-fns";
import { PlusIcon, CalendarIcon, SettingsIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Task } from "@/features/tasks/types";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetSpaces } from "@/features/spaces/api/use-get-spaces";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateTaskModel } from "@/features/tasks/hooks/use-create-task-modal";
import { useCreateSpaceModal } from "@/features/spaces/hooks/use-create-space-modal";
import { useGetWorkspaceAnalytics } from "@/features/workspaces/api/use-get-workspace-analytics";

import { Button } from "@/components/ui/button";
import { Analytics } from "@/components/analytics";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent } from "@/components/ui/card";
import { DottedSeparator } from "@/components/dotted-separator";
import { Space } from "@/features/spaces/types";
import { SpaceAvatar } from "@/features/spaces/components/space-avatar";
import { Member } from "@/features/members/types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ActivityFeed } from "@/components/activity";
import { PresenceList, PresenceAvatar } from "@/components/presence";
import { useRealtime, useRecentlyUpdated } from "@/contexts/realtime-context";

export const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId();
  const { presenceUsers } = useRealtime();


  const { data: analytics, isLoading: isLoadingAnalytics } =
    useGetWorkspaceAnalytics({ workspaceId });
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
  });
  const { data: spaces, isLoading: isLoadingSpaces } = useGetSpaces({
    workspaceId,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });

  const isLoading =
    isLoadingAnalytics ||
    isLoadingTasks ||
    isLoadingSpaces ||
    isLoadingMembers;

  if (isLoading) {
    return <PageLoader />;
  }

  if (!analytics || !tasks || !spaces || !members) {
    return <PageError message="Failed to load workspace data" />;
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <Analytics data={analytics} />

      {/* Three column layout: Tasks | Spaces + Members | Activity + Presence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Left Column: Tasks */}
        <div className="xl:col-span-1">
          <TaskList
            data={tasks.documents.map((task: any) => ({
              ...task,
              $id: task.id || task.$id,
            })) as any}
            total={tasks.total}
          />
        </div>

        {/* Middle Column: Spaces + Members */}
        <div className="xl:col-span-1 space-y-4">
          <SpaceList
            data={spaces.documents.map((space: any) => ({
              ...space, // Use spread to capture all props including id/$id
              $id: space.id || space.$id,
              // Map legacy fields if needed, but 'types.ts' for Space has `id`, `name`, `workspaceId`.
              // We should ensure we map correctly.
              // useGetSpaces returns Space[] which has id, name, imageUrl.
            })) as any}
            total={spaces.total}
          />
          <MembersList data={members.documents} total={members.total} />
        </div>

        {/* Right Column: Activity Feed + Team Presence */}
        <div className="xl:col-span-1 space-y-4">
          <ActivityFeed
            workspaceId={workspaceId}
            maxHeight="400px"
            showHeader={true}
          />
          <PresenceList
            workspaceId={workspaceId}
            maxHeight="300px"
            showHeader={true}
          />
        </div>
      </div>
    </div>
  );
};

interface TaskListProps {
  data: Task[];
  total: number;
}

export const TaskList = ({ data, total }: TaskListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createTask } = useCreateTaskModel();
  const recentlyUpdated = useRecentlyUpdated();

  return (
    <div className="flex flex-col gap-y-4 col-span-1">
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Tasks ({total})</p>
          <Button variant="muted" size="icon" onClick={createTask}>
            <PlusIcon className="size-4 text-neutral-400" />
          </Button>
        </div>
        <DottedSeparator className="my-4" />
        <ul className="flex flex-col gap-y-4">
          {data.map((task) => (
            <li key={task.$id}>
              <Link href={`/workspaces/${workspaceId}/tasks/${task.$id}`}>
                <Card className={cn(
                  "shadow-none rounded-lg hover:opacity-75 transition duration-500",
                  recentlyUpdated.has(task.$id) && "ring-2 ring-blue-500 ring-offset-2 animate-pulse"
                )}>
                  <CardContent className="p-4">
                    <p className="text-lg font-medium truncate">{task.name}</p>
                    <div className="flex items-center gap-x-2">
                      {/* task.project?.name -> task.space?.name or we might need to update Task type */}
                      <p>{task.spaceId || "Space"}</p>
                      <div className="size-1 rounded-full bg-neutral-300" />
                      <div className="text-sm text-muted-foreground flex items-center">
                        <CalendarIcon className="size-3 mr-1" />
                        <span className="truncate">
                          {task.dueDate ? formatDistanceToNow(new Date(task.dueDate)) : "No due date"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
          <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
            No tasks found
          </li>
        </ul>
        <Button variant="muted" className="mt-4 w-full" asChild>
          <Link href={`/workspaces/${workspaceId}/tasks`}>Show All</Link>
        </Button>
      </div>
    </div>
  );
};

interface SpaceListProps {
  data: Space[];
  total: number;
}

export const SpaceList = ({ data, total }: SpaceListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createSpace } = useCreateSpaceModal();
  const recentlyUpdated = useRecentlyUpdated();

  return (
    <div className="flex flex-col gap-y-4 col-span-1">
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Spaces ({total})</p>
          <Button variant="secondary" size="icon" onClick={createSpace}>
            <PlusIcon className="size-4 text-neutral-400" />
          </Button>
        </div>
        <DottedSeparator className="my-4" />
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.map((space) => (
            <li key={space.$id || space.id}>
              <Link href={`/workspaces/${workspaceId}/spaces/${space.$id || space.id}`}>
                <Card className={cn(
                  "shadow-none rounded-lg hover:opacity-75 transition duration-500",
                  recentlyUpdated.has(space.$id || space.id) && "ring-2 ring-blue-500 ring-offset-2 animate-pulse"
                )}>
                  <CardContent className="p-4 flex items-center gap-x-2.5">
                    <SpaceAvatar
                      className="size-12"
                      fallbackClassName="text-lg"
                      name={space.name}
                      image={space.imageUrl}
                    />
                    <p className="text-lg font-medium truncate">
                      {space.name}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
          <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
            No Spaces found
          </li>
        </ul>
      </div>
    </div>
  );
};

interface MembersListProps {
  data: Member[];
  total: number;
}

export const MembersList = ({ data, total }: MembersListProps) => {
  const workspaceId = useWorkspaceId();
  const { presenceUsers } = useRealtime();

  return (
    <div className="flex flex-col gap-y-4 col-span-1">
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Members ({total})</p>
          <Button variant="secondary" size="icon" asChild>
            <Link href={`/workspaces/${workspaceId}/members`}>
              <SettingsIcon className="size-4 text-neutral-400" />
            </Link>
          </Button>
        </div>
        <DottedSeparator className="my-4" />
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((member) => (
            <li key={member.$id}>
              <Card className="shadow-none rounded-lg overflow-hidden">
                <CardContent className="p-3 flex flex-col items-center gap-x-2">
                  <PresenceAvatar
                    className="size-12"
                    name={member.name || member.email || ''}
                    avatarColor={member.avatarColor?.bg || '#3b82f6'}
                    status={presenceUsers.get(member.userId)?.status || 'offline'}
                  />
                  <div className="flex flex-col items-center overflow-hidden">
                    <p className="text-lg font-medium line-clamp-1">
                      {member.name || member.email || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {member.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
          <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
            No members found
          </li>
        </ul>
      </div>
    </div>
  );
};
