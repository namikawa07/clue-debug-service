"use client";

import { useCallback } from "react";
import { useQueryState } from "nuqs";
import {
  Loader,
  Plus,
  LayoutList,
  Columns3, // For Kanban/Board
  Calendar,
  Clock, // For Timeline
  Filter,
  MoreHorizontal,
  Search,
} from "lucide-react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { DataFilters } from "./data-filters";
import { DataSpreadsheet } from "./data-spreadsheet";
import { DataKanban } from "./data-kanban";
import { DataCalendar } from "./data-calendar";
import { DataWeeklySchedule } from "./data-weekly-schedule";

import { useGetTasks } from "../api/use-get-tasks";
import { useTaskFilters } from "../hooks/use-task-filters";
import { useCreateTaskModel } from "../hooks/use-create-task-modal";
import { useBulkUpdateTasks } from "../api/use-bulk-update-tasks";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { TaskStatus } from "../types";

interface TaskViewSwitcherProps {
  hideProjectFilter?: boolean;
}

const VIEW_TABS = [
  { key: "list", label: "Spreadsheet", icon: LayoutList },
  { key: "timeline", label: "Timeline", icon: Clock }, // Map to weekly schedule for now
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "kanban", label: "Board", icon: Columns3 },
] as const;

export const TaskViewSwitcher = ({
  hideProjectFilter,
}: TaskViewSwitcherProps) => {
  const [{ status, assigneeId, projectId, dueDate }, setFilters] = useTaskFilters();

  const [view, setView] = useQueryState("task-view", {
    defaultValue: "list",
  });

  const workspaceId = useWorkspaceId();
  const paramProjectId = useProjectId();
  const { open } = useCreateTaskModel();

  const { mutate: bulkUpdate } = useBulkUpdateTasks();

  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
    projectId: paramProjectId || projectId,
    assigneeId,
    status,
    dueDate,
  });

  const onKanbanChange = useCallback(
    (tasks: { $id: string; status: TaskStatus; position: number }[]) => {
      bulkUpdate({
        json: { tasks },
      });
    },
    [bulkUpdate]
  );

  return (
    <div className="flex-1 w-full flex flex-col h-full">
      {/* View Tabs + Actions Bar (Matches Snippet Style) */}
      <div className="flex items-center justify-between border-b border-gray-200 mb-4">
        {/* Left: Tabs */}
        <div className="flex items-center gap-4 px-2">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = view === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors duration-150",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={open}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors ml-1"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Right: Search & Filter */}
        <div className="flex items-center gap-3 px-2 pb-1">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search task..."
              className="pl-9 pr-4 h-8 w-64 bg-white border-gray-300 text-sm focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 px-3 text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <Filter size={14} />
            <span>Filter</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </div>

      {/* Legacy Filter Bar - Hidden by default in new design but kept for functionality if needed. 
          Maybe wrap in a conditional if users click "Filter"? 
          For now, just render it cleanly below headers. */}
      {/* <div className="mb-4 px-2"> // Commented out to match strictly "this not implemented" look, implying clean header.
        <DataFilters hideProjectFilter={hideProjectFilter} /> 
      </div> */}
      {/* Keeping DataFilters visible for verified functionality until I implementing the filter button logic */}
      <div className="mb-4 px-1">
        <DataFilters hideProjectFilter={hideProjectFilter} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoadingTasks ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Loader className="size-8 animate-spin text-blue-500 mb-4" />
            <p className="text-sm text-gray-500">Loading tasks...</p>
          </div>
        ) : (
          <>
            {view === "list" && (
              <DataSpreadsheet data={tasks?.documents ?? []} />
            )}
            {view === "kanban" && (
              <DataKanban
                onChange={onKanbanChange}
                data={tasks?.documents ?? []}
              />
            )}
            {view === "calendar" && (
              <DataCalendar data={tasks?.documents ?? []} />
            )}
            {view === "timeline" && (
              <DataWeeklySchedule data={tasks?.documents ?? []} />
            )}
          </>
        )}
      </div>
    </div>
  );
};
