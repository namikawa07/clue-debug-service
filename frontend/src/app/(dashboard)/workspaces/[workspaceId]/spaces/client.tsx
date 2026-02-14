"use client";

import { useState, useMemo } from "react";
import { useGetSpaces } from "@/features/spaces/api/use-get-spaces";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateSpaceModal } from "@/features/spaces/hooks/use-create-space-modal";
import { SpaceAvatar } from "@/features/spaces/components/space-avatar";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Rocket, Hourglass, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { Task, TaskStatus } from "@/features/tasks/types";

type SpaceStatus = "New space" | "In Progress" | "On Hold" | "Completed";

const getStatusIcon = (status: SpaceStatus) => {
  switch (status) {
    case "New space":
      return <Mail className="size-3.5 text-gray-500" />;
    case "In Progress":
      return <Rocket className="size-3.5 text-blue-500" />;
    case "On Hold":
      return <Hourglass className="size-3.5 text-amber-500" />;
    case "Completed":
      return <CheckCircle2 className="size-3.5 text-emerald-500" />;
    default:
      return <Mail className="size-3.5 text-gray-500" />;
  }
};

const getStatusBadgeVariant = (status: SpaceStatus): "default" | "secondary" | "outline" => {
  switch (status) {
    case "New space":
      return "secondary";
    case "In Progress":
      return "default";
    case "On Hold":
      return "outline";
    case "Completed":
      return "secondary";
    default:
      return "secondary";
  }
};

export const SpacesListClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: spaces } = useGetSpaces({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });
  const { data: tasks } = useGetTasks({ workspaceId });
  const { open: openCreateSpace } = useCreateSpaceModal();
  const [activeExpanded, setActiveExpanded] = useState(true);
  const [closedExpanded, setClosedExpanded] = useState(false);

  // Map member ID to member for owner lookup
  const membersMap = new Map(
    members?.documents.map((m: any) => [m.userId, m]) || []
  );

  // Calculate progress based on tasks (completed / total)
  const spaceProgressMap = useMemo(() => {
    const map = new Map<string, { completed: number; total: number; percentage: number }>();

    if (!tasks?.documents) return map;

    tasks.documents.forEach((task: Task) => {
      const spaceId = task.projectId;
      if (!spaceId) return;

      const current = map.get(spaceId) || { completed: 0, total: 0, percentage: 0 };
      current.total += 1;
      if (task.status === TaskStatus.DONE) {
        current.completed += 1;
      }
      current.percentage = current.total > 0 ? Math.round((current.completed / current.total) * 100) : 0;
      map.set(spaceId, current);
    });

    return map;
  }, [tasks]);

  // Get space status (placeholder - would come from space.status field)
  const getStatus = (space: any): SpaceStatus => {
    // Placeholder logic: could check space status field when available
    const progress = spaceProgressMap.get(space.$id);
    if (progress?.percentage === 100) return "Completed";
    if (progress && progress.total > 0) return "In Progress";
    return "New space";
  };

  // Get space owner (placeholder - spaces don't have ownerId yet)
  const getOwner = (space: any) => {
    // Placeholder: would get from space.ownerId
    return members?.documents[0];
  };

  // Separate active and closed spaces
  const { activeSpaces, closedSpaces } = useMemo(() => {
    if (!spaces?.documents) return { activeSpaces: [], closedSpaces: [] };

    const active: typeof spaces.documents = [];
    const closed: typeof spaces.documents = [];

    spaces.documents.forEach((space: any) => {
      const status = getStatus(space);
      if (status === "Completed") {
        closed.push(space);
      } else {
        active.push(space);
      }
    });

    return { activeSpaces: active, closedSpaces: closed };
  }, [spaces?.documents, spaceProgressMap]);

  const renderSpaceRow = (space: any) => {
    const progress = spaceProgressMap.get(space.$id) || { percentage: 0, completed: 0, total: 0 };
    const status = getStatus(space);
    const owner = getOwner(space);
    const createdDate = space.$createdAt ? format(new Date(space.$createdAt), "d MMM yyyy") : "-";
    const dueDate = space.dueDate ? format(new Date(space.dueDate), "d MMM yyyy") : "-";

    return (
      <tr key={space.$id} className="hover:bg-gray-50 transition-colors">
        <td className="p-3">
          <Link
            href={`/workspaces/${workspaceId}/spaces/${space.$id}`}
            className="flex items-center gap-2 hover:underline"
          >
            <SpaceAvatar
              className="size-8"
              name={space.name}
              image={space.imageUrl}
            />
            <span className="font-medium text-gray-900">{space.name}</span>
          </Link>
        </td>
        <td className="p-3">
          <Badge variant={getStatusBadgeVariant(status)} className="flex items-center gap-1.5 w-fit">
            {getStatusIcon(status)}
            <span>{status}</span>
          </Badge>
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  progress.percentage === 100 ? "bg-emerald-600" : "bg-blue-600"
                )}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-700 font-medium">{progress.percentage}%</span>
            {progress.total > 0 && (
              <span className="text-xs text-muted-foreground">
                ({progress.completed}/{progress.total})
              </span>
            )}
          </div>
        </td>
        <td className="p-3 text-sm text-gray-700">
          {createdDate}
        </td>
        <td className="p-3 text-sm text-gray-700">
          {dueDate !== "-" ? dueDate : <span className="text-muted-foreground">-</span>}
        </td>
        <td className="p-3">
          {owner ? (
            <div className="flex items-center gap-2">
              <MemberAvatar
                className="size-6"
                name={owner.name || owner.email || ""}
                avatarColor={owner.avatarColor}
              />
              <span className="text-sm text-gray-700">{owner.name || owner.email}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All spaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all your spaces in one place
          </p>
        </div>
        <Button onClick={openCreateSpace} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="size-4 mr-2" />
          Add new
        </Button>
      </div>

      <div className="flex-1 border rounded-lg bg-white shadow-sm">
        <div className="p-4">
          {/* Active Spaces Section */}
          <div className="mb-6">
            <button
              onClick={() => setActiveExpanded(!activeExpanded)}
              className="flex items-center justify-between w-full mb-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                {activeExpanded ? (
                  <ChevronDown className="size-5 text-gray-600" />
                ) : (
                  <ChevronRight className="size-5 text-gray-600" />
                )}
                <h2 className="text-lg font-semibold text-gray-900">
                  Active spaces ({activeSpaces.length})
                </h2>
              </div>
            </button>

            {activeExpanded && (
              <div className="border rounded-lg overflow-hidden">
                {activeSpaces.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Space name
                        </th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Space status
                        </th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Start date
                        </th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Due date
                        </th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Space owner
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {activeSpaces.map(renderSpaceRow)}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No active spaces yet. Create your first space to get started!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Closed Spaces Section */}
          {closedSpaces.length > 0 && (
            <div>
              <button
                onClick={() => setClosedExpanded(!closedExpanded)}
                className="flex items-center justify-between w-full mb-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  {closedExpanded ? (
                    <ChevronDown className="size-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="size-5 text-gray-600" />
                  )}
                  <h2 className="text-lg font-semibold text-gray-900">
                    Closed spaces ({closedSpaces.length})
                  </h2>
                </div>
              </button>

              {closedExpanded && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Space name
                        </th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Space status
                        </th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Start date
                        </th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Due date
                        </th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Space owner
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {closedSpaces.map(renderSpaceRow)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
