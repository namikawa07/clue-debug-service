"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
    ChevronDown,
    ChevronRight,
    Flag,
    MoreHorizontal,
    Plus,
    Clock,
    CheckCircle2,
    Circle,
    AlertTriangle,
    XCircle,
    ListTree,
    Layers,
    ArrowUp,
    ArrowDown,
    Check,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Task, TaskStatus, Epic } from "../types";
import { TaskActions } from "./task-actions";
import { useCreateTaskModel } from "../hooks/use-create-task-modal";
import { useUpdateTask } from "../api/use-update-task";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { Button } from "@/components/ui/button";

// ============================================================================
// Types & Config
// ============================================================================

interface StatusGroupConfig {
    label: string;
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeColor: string;
    iconColor: string;
}

const STATUS_CONFIG: Record<TaskStatus, StatusGroupConfig> = {
    [TaskStatus.TODO]: {
        label: "To Do",
        icon: <Circle size={16} />,
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-700",
        badgeColor: "text-blue-600",
        iconColor: "text-blue-500",
    },
    [TaskStatus.IN_PROGRESS]: {
        label: "In Progress",
        icon: <Clock size={16} />,
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-700",
        badgeColor: "text-amber-600",
        iconColor: "text-amber-500",
    },
    [TaskStatus.IN_REVIEW]: {
        label: "Ready to Review",
        icon: <AlertTriangle size={16} />,
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        textColor: "text-purple-700",
        badgeColor: "text-purple-600",
        iconColor: "text-purple-500",
    },
    [TaskStatus.DONE]: {
        label: "Completed",
        icon: <CheckCircle2 size={16} />,
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-700",
        badgeColor: "text-green-600",
        iconColor: "text-green-500",
    },
    [TaskStatus.BLOCKED]: {
        label: "Blocked",
        icon: <XCircle size={16} />,
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-700",
        badgeColor: "text-red-600",
        iconColor: "text-red-500",
    },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
    critical: { color: "text-red-500", label: "Critical" },
    high: { color: "text-orange-500", label: "High" },
    medium: { color: "text-yellow-500", label: "Medium" },
    low: { color: "text-gray-400", label: "Low" },
};

const STATUS_ORDER: TaskStatus[] = [
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.DONE,
    TaskStatus.BLOCKED,
];

type SortDirection = "asc" | "desc" | null;
type SortColumn = "name" | "dueDate" | "priority" | "status";

// ============================================================================
// Helper Components
// ============================================================================

function AvatarGroup({ assignee }: { assignee?: Task["assignee"] }) {
    if (!assignee || !assignee.name || assignee.name === "Unassigned") {
        return <span className="text-xs text-gray-400">—</span>;
    }

    return (
        <div className="flex items-center gap-1.5">
            <MemberAvatar
                name={assignee.name}
                avatarColor={assignee.avatarColor}
                className="size-6"
            />
            <span className="text-xs text-gray-600 truncate">{assignee.name}</span>
        </div>
    );
}

function PriorityBadge({ priority }: { priority?: string }) {
    const config = priority ? PRIORITY_CONFIG[priority] : PRIORITY_CONFIG.low;
    const { color, label } = config || PRIORITY_CONFIG.low;

    return (
        <div className={cn("flex items-center gap-1.5 text-xs font-medium", color)}>
            <Flag size={12} fill="currentColor" />
            <span>{label}</span>
        </div>
    );
}

function ProgressBar({ progress }: { progress: number }) {
    const getColor = (p: number) => {
        if (p >= 100) return "bg-green-500";
        if (p >= 75) return "bg-purple-500";
        if (p >= 50) return "bg-purple-400";
        if (p >= 25) return "bg-purple-300";
        return "bg-purple-200";
    };

    return (
        <div className="flex items-center gap-2.5">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                <div
                    className={cn("h-1.5 rounded-full transition-all duration-500", getColor(progress))}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right tabular-nums">{progress}%</span>
        </div>
    );
}

function formatDueDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

// ============================================================================
// Inline Edit Cell
// ============================================================================

function InlineEditCell({
    value,
    onSave,
    className,
}: {
    value: string;
    onSave: (val: string) => void;
    className?: string;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [showSaved, setShowSaved] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        if (editValue.trim() !== value) {
            onSave(editValue.trim());
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 1000);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setEditValue(value);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={cn(
                    "text-sm bg-white border border-blue-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-400 w-full",
                    className
                )}
            />
        );
    }

    return (
        <div className="flex items-center gap-1 min-w-0 cursor-text" onClick={() => setIsEditing(true)}>
            <span className={cn("text-sm truncate hover:bg-gray-100 rounded px-1 -mx-1", className)}>
                {value || "—"}
            </span>
            {showSaved && <Check size={12} className="text-green-500 shrink-0" />}
        </div>
    );
}

// ============================================================================
// Sortable Column Header
// ============================================================================

function SortableHeader({
    label,
    column,
    sortColumn,
    sortDirection,
    onSort,
    className,
}: {
    label: string;
    column: SortColumn;
    sortColumn: SortColumn | null;
    sortDirection: SortDirection;
    onSort: (col: SortColumn) => void;
    className?: string;
}) {
    const isActive = sortColumn === column;

    return (
        <button
            className={cn("flex items-center gap-1 select-none hover:text-gray-700 transition-colors", className)}
            onClick={() => onSort(column)}
        >
            <span>{label}</span>
            {isActive && sortDirection === "asc" && <ArrowUp size={10} />}
            {isActive && sortDirection === "desc" && <ArrowDown size={10} />}
        </button>
    );
}

// ============================================================================
// Task Row
// ============================================================================

interface TaskRowProps {
    task: Task;
    isSubtask?: boolean;
    level?: number;
    isSelected?: boolean;
    onToggleSelect?: (taskId: string) => void;
}

function TaskRow({ task, isSubtask = false, level = 0, isSelected, onToggleSelect }: TaskRowProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const { mutate: updateTask } = useUpdateTask();

    const hasSubtasks = (task.totalSubtasks ?? 0) > 0;
    const isDone = task.status === TaskStatus.DONE;

    const progress = useMemo(() => {
        if (task.totalSubtasks && task.totalSubtasks > 0) {
            return Math.round(((task.completedSubtasks ?? 0) / task.totalSubtasks) * 100);
        }
        if (isDone) return 100;
        if (task.status === TaskStatus.IN_REVIEW) return 80;
        if (task.status === TaskStatus.IN_PROGRESS) return 50;
        return 0;
    }, [task, isDone]);

    const handleInlineUpdate = useCallback(
        (field: string, value: string) => {
            const taskId = task.id || task.$id;
            if (!taskId) return;
            updateTask({
                param: { taskId },
                json: { [field]: value } as any,
            });
        },
        [task, updateTask]
    );

    return (
        <>
            <div className={cn("group hover:bg-gray-50/80 transition-colors duration-150", isSubtask && "bg-gray-50/40")}>
                <div className="flex items-center border-b border-gray-100">
                    {/* Task Name Column */}
                    <div
                        className="flex items-center py-3 px-4 min-w-[280px] w-[280px]"
                        style={{ paddingLeft: `${level * 24 + 16}px` }}
                    >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {hasSubtasks ? (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
                                >
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                            ) : (
                                <div className="w-4 shrink-0" />
                            )}

                            {/* Selection checkbox */}
                            {onToggleSelect ? (
                                <input
                                    type="checkbox"
                                    checked={isSelected || false}
                                    onChange={() => onToggleSelect(task.id || task.$id)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                                />
                            ) : (
                                <input
                                    type="checkbox"
                                    checked={isDone}
                                    readOnly
                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 shrink-0 cursor-pointer"
                                />
                            )}

                            {/* Editable task name */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <InlineEditCell
                                    value={task.name}
                                    onSave={(val) => handleInlineUpdate("name", val)}
                                    className={cn(isDone && "line-through text-gray-400")}
                                />
                                {hasSubtasks && (
                                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                                        <ListTree size={12} />
                                        <span>{task.totalSubtasks}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description Column - inline editable */}
                    <div className="flex-1 py-3 px-4 min-w-[180px]">
                        <InlineEditCell
                            value={task.description || ""}
                            onSave={(val) => handleInlineUpdate("description", val)}
                            className="text-gray-500"
                        />
                    </div>

                    {/* Assignee Column */}
                    <div className="py-3 px-4 w-[120px] shrink-0">
                        <AvatarGroup assignee={task.assignee} />
                    </div>

                    {/* Due Date Column */}
                    <div className="py-3 px-4 w-[160px] shrink-0">
                        <span className="text-sm text-gray-600">{formatDueDate(task.dueDate)}</span>
                    </div>

                    {/* Priority Column */}
                    <div className="py-3 px-4 w-[100px] shrink-0">
                        <PriorityBadge priority={task.priority} />
                    </div>

                    {/* Progress Column */}
                    <div className="py-3 px-4 w-[150px] shrink-0">
                        <ProgressBar progress={progress} />
                    </div>

                    {/* Actions Column */}
                    <div className="py-3 px-4 w-[48px] shrink-0">
                        <TaskActions id={task.$id || task.id} spaceId={task.spaceId}>
                            <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal size={16} />
                            </button>
                        </TaskActions>
                    </div>
                </div>
            </div>
        </>
    );
}

// ============================================================================
// Column Headers
// ============================================================================

function ColumnHeaders({
    sortColumn,
    sortDirection,
    onSort,
    showSelectAll,
    allSelected,
    onSelectAll,
}: {
    sortColumn: SortColumn | null;
    sortDirection: SortDirection;
    onSort: (col: SortColumn) => void;
    showSelectAll?: boolean;
    allSelected?: boolean;
    onSelectAll?: () => void;
}) {
    return (
        <div className="bg-gray-50/80 border-b border-gray-100">
            <div className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="py-2 px-4 min-w-[280px] w-[280px] flex items-center gap-2">
                    {showSelectAll && (
                        <input
                            type="checkbox"
                            checked={allSelected || false}
                            onChange={onSelectAll}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    )}
                    <SortableHeader label="Task" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
                </div>
                <div className="py-2 px-4 flex-1 min-w-[180px]">Description</div>
                <div className="py-2 px-4 w-[120px] shrink-0">Assignee</div>
                <div className="py-2 px-4 w-[160px] shrink-0">
                    <SortableHeader label="Due Date" column="dueDate" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
                </div>
                <div className="py-2 px-4 w-[100px] shrink-0">
                    <SortableHeader label="Priority" column="priority" sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
                </div>
                <div className="py-2 px-4 w-[150px] shrink-0">Progress</div>
                <div className="py-2 px-4 w-[48px] shrink-0">
                    <Plus size={14} className="text-gray-400" />
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Status Group
// ============================================================================

interface StatusGroupProps {
    status: TaskStatus;
    tasks: Task[];
    defaultExpanded?: boolean;
    selectedTaskIds?: Set<string>;
    onToggleTask?: (taskId: string) => void;
    onSelectAll?: (ids: string[]) => void;
    sortColumn: SortColumn | null;
    sortDirection: SortDirection;
    onSort: (col: SortColumn) => void;
}

function StatusGroup({
    status,
    tasks,
    defaultExpanded = true,
    selectedTaskIds,
    onToggleTask,
    onSelectAll,
    sortColumn,
    sortDirection,
    onSort,
}: StatusGroupProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const config = STATUS_CONFIG[status];
    const { open: openCreateTask } = useCreateTaskModel();

    if (tasks.length === 0) return null;

    const taskIds = tasks.map((t) => t.id || t.$id);
    const allSelected = selectedTaskIds ? taskIds.every((id) => selectedTaskIds.has(id)) : false;

    return (
        <div className="bg-white rounded-lg overflow-hidden">
            {/* Group Header */}
            <div
                className={cn(
                    "sticky top-0 z-10 px-4 py-2.5 flex items-center gap-2 cursor-pointer select-none border-b",
                    config.bgColor,
                    config.borderColor
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <button className={config.textColor}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className={cn("flex items-center gap-2", config.iconColor)}>
                    {config.icon}
                </div>
                <span className={cn("text-sm font-semibold", config.textColor)}>
                    {config.label}
                </span>
                <span className={cn("ml-2 text-xs font-medium", config.badgeColor)}>
                    {tasks.length}
                </span>
                <button
                    className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal size={14} />
                </button>
                <button
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        openCreateTask();
                    }}
                >
                    <Plus size={14} />
                </button>
            </div>

            {isExpanded && (
                <>
                    <ColumnHeaders
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        showSelectAll={!!onToggleTask}
                        allSelected={allSelected}
                        onSelectAll={onSelectAll ? () => onSelectAll(taskIds) : undefined}
                    />

                    {tasks.map((task) => (
                        <TaskRow
                            key={task.id || task.$id}
                            task={task}
                            isSelected={selectedTaskIds?.has(task.id || task.$id)}
                            onToggleSelect={onToggleTask}
                        />
                    ))}

                    <div className="px-4 py-3 border-b border-gray-100">
                        <button
                            onClick={openCreateTask}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <Plus size={16} />
                            <span>Add task</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ============================================================================
// Epic Group
// ============================================================================

interface EpicGroupProps {
    epic: Epic | null;
    tasks: Task[];
    selectedTaskIds?: Set<string>;
    onToggleTask?: (taskId: string) => void;
    onSelectAll?: (ids: string[]) => void;
    sortColumn: SortColumn | null;
    sortDirection: SortDirection;
    onSort: (col: SortColumn) => void;
}

function EpicGroup({
    epic,
    tasks,
    selectedTaskIds,
    onToggleTask,
    onSelectAll,
    sortColumn,
    sortDirection,
    onSort,
}: EpicGroupProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const taskCount = epic?.task_count ?? tasks.length;
    const completedCount = epic?.completed_task_count ?? tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const pct = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

    // Group tasks by status inside this epic
    const groupedByStatus = useMemo(() => {
        const groups: Record<string, Task[]> = {};
        for (const status of STATUS_ORDER) {
            groups[status] = [];
        }
        for (const task of tasks) {
            const status = task.status || TaskStatus.TODO;
            if (!groups[status]) groups[status] = [];
            groups[status].push(task);
        }
        return groups;
    }, [tasks]);

    return (
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
            {/* Epic Header */}
            <div
                className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 cursor-pointer select-none bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <button className="text-indigo-600">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <Layers size={16} className="text-indigo-400" />
                <span className="text-sm font-semibold text-gray-900">
                    {epic?.name ?? "Ungrouped"}
                </span>
                <span className="text-xs text-gray-500">
                    {completedCount}/{taskCount} tasks
                </span>

                {/* Mini progress bar */}
                <div className="flex-1 max-w-[120px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <span className="text-xs text-gray-400 tabular-nums">{pct}%</span>
            </div>

            {isExpanded && (
                <div className="space-y-1 py-1">
                    {STATUS_ORDER.map((status) => (
                        <StatusGroup
                            key={status}
                            status={status}
                            tasks={groupedByStatus[status] || []}
                            defaultExpanded={true}
                            selectedTaskIds={selectedTaskIds}
                            onToggleTask={onToggleTask}
                            onSelectAll={onSelectAll}
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            onSort={onSort}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Sorting Utility
// ============================================================================

const PRIORITY_ORDER: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
};

function sortTasks(tasks: Task[], column: SortColumn | null, direction: SortDirection): Task[] {
    if (!column || !direction) return tasks;

    return [...tasks].sort((a, b) => {
        let cmp = 0;
        switch (column) {
            case "name":
                cmp = (a.name || "").localeCompare(b.name || "");
                break;
            case "dueDate":
                cmp = (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
                break;
            case "priority":
                cmp = (PRIORITY_ORDER[a.priority || "low"] ?? 3) - (PRIORITY_ORDER[b.priority || "low"] ?? 3);
                break;
            case "status":
                cmp = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
                break;
        }
        return direction === "desc" ? -cmp : cmp;
    });
}

// ============================================================================
// Main DataSpreadsheet Component
// ============================================================================

interface DataSpreadsheetProps {
    data: Task[];
    groupBy?: "status" | "epic";
    epics?: Epic[];
    selectedTaskIds?: Set<string>;
    onToggleTask?: (taskId: string) => void;
    onSelectAll?: (ids: string[]) => void;
}

export function DataSpreadsheet({
    data,
    groupBy = "status",
    epics = [],
    selectedTaskIds,
    onToggleTask,
    onSelectAll,
}: DataSpreadsheetProps) {
    const { open: openCreateTask } = useCreateTaskModel();
    const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const handleSort = useCallback((col: SortColumn) => {
        setSortColumn((prev) => {
            if (prev === col) {
                setSortDirection((d) => {
                    if (d === "asc") return "desc";
                    if (d === "desc") return null;
                    return "asc";
                });
                return col;
            }
            setSortDirection("asc");
            return col;
        });
    }, []);

    const sortedData = useMemo(() => sortTasks(data, sortColumn, sortDirection), [data, sortColumn, sortDirection]);

    // Group by status
    const groupedByStatus = useMemo(() => {
        const groups: Record<string, Task[]> = {};
        for (const status of STATUS_ORDER) {
            groups[status] = [];
        }
        for (const task of sortedData) {
            const status = task.status || TaskStatus.TODO;
            if (!groups[status]) groups[status] = [];
            groups[status].push(task);
        }
        return groups;
    }, [sortedData]);

    // Group by epic
    const groupedByEpic = useMemo(() => {
        if (groupBy !== "epic") return [];

        const epicMap = new Map<string, { epic: Epic | null; tasks: Task[] }>();

        // Initialize epic groups
        for (const epic of epics) {
            epicMap.set(epic.id, { epic, tasks: [] });
        }

        // "Ungrouped" bucket
        epicMap.set("__ungrouped__", { epic: null, tasks: [] });

        for (const task of sortedData) {
            // Try to match task to epic — tasks have epicId or we match by spaceId
            // Since tasks are fetched scoped to a space, and epics belong to the same space,
            // we need epicId on the task. If not present, put in ungrouped.
            const taskEpicId = (task as any).epicId || (task as any).epic_id;
            if (taskEpicId && epicMap.has(taskEpicId)) {
                epicMap.get(taskEpicId)!.tasks.push(task);
            } else {
                epicMap.get("__ungrouped__")!.tasks.push(task);
            }
        }

        return Array.from(epicMap.values()).filter((g) => g.tasks.length > 0);
    }, [sortedData, epics, groupBy]);

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <ListTree size={28} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No tasks found</p>
                <p className="text-xs text-gray-500 mb-4">Create your first task to get started</p>
                <Button onClick={openCreateTask} className="w-fit">
                    <Plus className="size-4 mr-2" />
                    Create Task
                </Button>
            </div>
        );
    }

    if (groupBy === "epic") {
        return (
            <div className="space-y-4 p-2">
                {groupedByEpic.map((group) => (
                    <EpicGroup
                        key={group.epic?.id ?? "__ungrouped__"}
                        epic={group.epic}
                        tasks={group.tasks}
                        selectedTaskIds={selectedTaskIds}
                        onToggleTask={onToggleTask}
                        onSelectAll={onSelectAll}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {STATUS_ORDER.map((status) => (
                <StatusGroup
                    key={status}
                    status={status}
                    tasks={groupedByStatus[status] || []}
                    defaultExpanded={true}
                    selectedTaskIds={selectedTaskIds}
                    onToggleTask={onToggleTask}
                    onSelectAll={onSelectAll}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                />
            ))}
        </div>
    );
}
