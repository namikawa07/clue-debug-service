"use client";

import { useCallback, useState } from "react";
import { useQueryState } from "nuqs";
import {
  Loader,
  Plus,
  LayoutList,
  Columns3,
  Calendar,
  Clock,
  Filter,
  Search,
} from "lucide-react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useSpaceId } from "@/features/spaces/hooks/use-space-id";
import { TaskStatus } from "../types";

interface TaskViewSwitcherProps {
  hideSpaceFilter?: boolean;
  epicId?: string;  // When provided, show tasks scoped to this epic
}

const VIEW_TABS = [
  { key: "kanban", label: "Board", icon: Columns3 },
  { key: "list", label: "Spreadsheet", icon: LayoutList },
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "calendar", label: "Calendar", icon: Calendar },
] as const;

export const TaskViewSwitcher = ({
  hideSpaceFilter,
  epicId,
}: TaskViewSwitcherProps) => {
  const [{ status, assigneeId, spaceId, dueDate, creatorId, search }, setFilters] =
    useTaskFilters();
  const [showFilters, setShowFilters] = useState(false);

  const [view, setView] = useQueryState("task-view", {
    defaultValue: "kanban",
  });

  const workspaceId = useWorkspaceId();
  const paramSpaceId = useSpaceId();
  const { open } = useCreateTaskModel();

  const { mutate: bulkUpdate } = useBulkUpdateTasks();

  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
    spaceId: epicId ? undefined : (paramSpaceId || spaceId),
    epicId: epicId ?? undefined,
    assigneeId,
    status,
    dueDate,
    creatorId,
    search,
  });

  const onKanbanChange = useCallback(
    (tasks: { $id: string; status: TaskStatus; position: number }[]) => {
      bulkUpdate({
        json: { tasks },
      });
    },
    [bulkUpdate]
  );

  const activeFilterCount = [status, assigneeId, spaceId, dueDate, creatorId].filter(
    Boolean
  ).length;

  return (
    <div className="flex-1 w-full flex flex-col h-full">
      {/* View tabs row */}
      <div className="flex items-center justify-between border-b border-gray-200">
        {/* Tabs — horizontal scroll on mobile, icon-only on xs */}
        <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto px-2">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = view === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors duration-150 whitespace-nowrap shrink-0",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={open}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors ml-1 shrink-0"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Search + Filter toggle — always visible, stacks on mobile */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-2 py-2 border-b border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search tasks..."
            value={search ?? ""}
            onChange={(e) => setFilters({ search: e.target.value || null })}
            className="pl-9 pr-4 h-8 w-full bg-white border-gray-300 text-sm focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md"
          />
        </div>
        <div className="shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "h-8 gap-1.5 px-3 text-gray-600 border-gray-300 hover:bg-gray-50 w-full sm:w-auto",
              showFilters && "bg-blue-50 border-blue-200 text-blue-700"
            )}
          >
            <Filter size={14} />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <Badge className="h-4 min-w-4 px-1 text-[10px] leading-none bg-blue-600 text-white rounded-full">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible filters */}
      {showFilters && (
        <div className="px-1 pt-2 pb-1 border-b border-gray-200">
          <DataFilters hideSpaceFilter={hideSpaceFilter} />
        </div>
      )}

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
