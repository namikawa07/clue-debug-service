"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  PlusIcon,
  CalendarIcon,
  SettingsIcon,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Circle,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Task, TaskStatus } from "@/features/tasks/types";
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
import { Space } from "@/features/spaces/types";
import { SpaceAvatar } from "@/features/spaces/components/space-avatar";
import { Member } from "@/features/members/types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ActivityFeed } from "@/components/activity";
import { PresenceAvatar } from "@/components/presence";
import { useRealtime, useRecentlyUpdated } from "@/contexts/realtime-context";
import type { PresenceUser } from "@/contexts/realtime-context";

// ── Status helpers ──────────────────────────────────────────────────────────
const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  [TaskStatus.TODO]: {
    label: "Todo",
    color: "bg-gray-100 text-gray-600",
    icon: <Circle size={11} />,
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    icon: <Loader2 size={11} className="animate-spin" />,
  },
  [TaskStatus.IN_REVIEW]: {
    label: "In Review",
    color: "bg-violet-100 text-violet-700",
    icon: <AlertCircle size={11} />,
  },
  [TaskStatus.DONE]: {
    label: "Done",
    color: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 size={11} />,
  },
  [TaskStatus.BLOCKED]: {
    label: "Blocked",
    color: "bg-red-100 text-red-700",
    icon: <AlertCircle size={11} />,
  },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
  high:     { label: "High",     color: "bg-orange-100 text-orange-700" },
  medium:   { label: "Medium",   color: "bg-yellow-100 text-yellow-700" },
  low:      { label: "Low",      color: "bg-gray-100 text-gray-500" },
};

// ── Root client ─────────────────────────────────────────────────────────────
export const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId();
  const { presenceUsers } = useRealtime();

  const { data: analytics, isLoading: isLoadingAnalytics } = useGetWorkspaceAnalytics({ workspaceId });
  const { data: tasks,     isLoading: isLoadingTasks }     = useGetTasks({ workspaceId });
  const { data: spaces,    isLoading: isLoadingSpaces }    = useGetSpaces({ workspaceId });
  const { data: members,   isLoading: isLoadingMembers }   = useGetMembers({ workspaceId });

  const isLoading = isLoadingAnalytics || isLoadingTasks || isLoadingSpaces || isLoadingMembers;

  if (isLoading) return <PageLoader />;
  if (!analytics || !tasks || !spaces || !members) {
    return <PageError message="Failed to load workspace data" />;
  }

  const taskDocs = tasks.documents.map((t: any) => ({
    ...t,
    $id: t.id || t.$id,
  })) as Task[];

  const spaceDocs = spaces.documents.map((s: any) => ({
    ...s,
    $id: s.id || s.$id,
  })) as Space[];

  return (
    <div className="flex flex-col gap-5">
      {/* Analytics row */}
      <Analytics data={analytics} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1 — Tasks */}
        <TaskList data={taskDocs} total={tasks.total} />

        {/* Column 2 — Spaces + Members */}
        <div className="flex flex-col gap-5">
          <SpaceList data={spaceDocs} total={spaces.total} />
          <MembersList data={members.documents} presenceUsers={presenceUsers} />
        </div>

        {/* Column 3 — Activity */}
        <ActivityFeed
          workspaceId={workspaceId}
          maxHeight="520px"
          showHeader={true}
        />
      </div>
    </div>
  );
};

// ── Task List ────────────────────────────────────────────────────────────────
interface TaskListProps {
  data: Task[];
  total: number;
}

export const TaskList = ({ data, total }: TaskListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createTask } = useCreateTaskModel();
  const recentlyUpdated = useRecentlyUpdated();

  const recent = data.slice(0, 8);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Tasks</p>
          <p className="text-xs text-gray-400 mt-0.5">{total} total</p>
        </div>
        <Button
          size="sm"
          onClick={createTask}
          className="bg-blue-600 hover:bg-blue-700 text-white h-8 gap-1.5 text-xs"
        >
          <PlusIcon size={13} />
          New task
        </Button>
      </div>

      <div className="flex-1 divide-y divide-gray-50">
        {recent.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No tasks yet. Create your first task!
          </div>
        ) : (
          recent.map((task) => {
            const status = statusConfig[task.status] ?? statusConfig[TaskStatus.TODO];
            const priority = task.priority ? priorityConfig[task.priority] : null;
            const isOverdue =
              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;

            return (
              <Link key={task.$id} href={`/workspaces/${workspaceId}/tasks/${task.$id}`}>
                <div
                  className={cn(
                    "px-5 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3",
                    recentlyUpdated.has(task.$id) && "bg-blue-50"
                  )}
                >
                  {/* Status dot */}
                  <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5", status.color)}>
                    {status.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {priority && (
                        <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", priority.color)}>
                          {priority.label}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={cn("flex items-center gap-1 text-xs", isOverdue ? "text-red-500 font-medium" : "text-gray-400")}>
                          <CalendarIcon size={10} />
                          {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="px-5 py-3 border-t border-gray-100">
        <Link
          href={`/workspaces/${workspaceId}/tasks`}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View all tasks
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};

// ── Space List ───────────────────────────────────────────────────────────────
interface SpaceListProps {
  data: Space[];
  total: number;
}

export const SpaceList = ({ data, total }: SpaceListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createSpace } = useCreateSpaceModal();
  const recentlyUpdated = useRecentlyUpdated();

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Spaces</p>
          <p className="text-xs text-gray-400 mt-0.5">{total} total</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={createSpace}
          className="h-8 gap-1.5 text-xs border-gray-200"
        >
          <PlusIcon size={13} />
          New space
        </Button>
      </div>

      <div className="divide-y divide-gray-50">
        {data.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            No spaces yet. Create your first space!
          </div>
        ) : (
          data.slice(0, 5).map((space) => (
            <Link key={space.$id || space.id} href={`/workspaces/${workspaceId}/spaces/${space.$id || space.id}`}>
              <div
                className={cn(
                  "flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors",
                  recentlyUpdated.has(space.$id || space.id) && "bg-blue-50"
                )}
              >
                <SpaceAvatar
                  className="size-8"
                  fallbackClassName="text-sm"
                  name={space.name}
                  image={space.imageUrl}
                />
                <p className="text-sm font-medium text-gray-800 truncate flex-1">{space.name}</p>
                <ArrowRight size={14} className="text-gray-300 shrink-0" />
              </div>
            </Link>
          ))
        )}
      </div>

      {total > 5 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <Link
            href={`/workspaces/${workspaceId}/spaces`}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all spaces
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
};

// ── Members List ─────────────────────────────────────────────────────────────
interface MembersListProps {
  data: Member[];
  presenceUsers: Map<string, PresenceUser>;
}

export const MembersList = ({ data, presenceUsers }: MembersListProps) => {
  const workspaceId = useWorkspaceId();

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Team Members</p>
          <p className="text-xs text-gray-400 mt-0.5">{data.length} members</p>
        </div>
        <Button size="sm" variant="outline" asChild className="h-8 gap-1.5 text-xs border-gray-200">
          <Link href={`/workspaces/${workspaceId}/members`}>
            <SettingsIcon size={13} />
            Manage
          </Link>
        </Button>
      </div>

      <div className="p-4 flex flex-wrap gap-2">
        {data.length === 0 ? (
          <p className="text-sm text-gray-400 p-2">No members found</p>
        ) : (
          data.slice(0, 12).map((member) => (
            <div key={member.$id || member.id} className="group relative" title={member.name || member.email || ""}>
              <PresenceAvatar
                className="size-9"
                name={member.name || member.email || ""}
                avatarColor={member.avatarColor?.bg || "#3b82f6"}
                status={presenceUsers.get(member.userId || member.user_id || "")?.status ?? "offline"}
              />
            </div>
          ))
        )}
        {data.length > 12 && (
          <div className="size-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
            +{data.length - 12}
          </div>
        )}
      </div>
    </div>
  );
};
