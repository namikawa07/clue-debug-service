"use client";

import React, { useState, useMemo } from "react";
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
    MessageSquare,
    ListTree,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Task, TaskStatus } from "../types";
import { TaskActions } from "./task-actions";
import { useCreateTaskModel } from "../hooks/use-create-task-modal";
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

// Status display order
const STATUS_ORDER: TaskStatus[] = [
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.DONE,
    TaskStatus.BLOCKED,
];

// ============================================================================
// Helper Components
// ============================================================================

function AvatarGroup({ assignee }: { assignee?: Task["assignee"] }) {
    if (!assignee || !assignee.name || assignee.name === "Unassigned") {
        return <span className="text-xs text-gray-400">—</span>;
    }

    const initials = assignee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const bgColor = assignee.avatarColor?.bg || "bg-purple-400";
    const textColor = assignee.avatarColor?.text || "text-white";

    // Check if bgColor is a hex color or a Tailwind class
    const isHexColor = bgColor.startsWith("#") || bgColor.startsWith("rgb");

    return (
        <div className="flex -space-x-1">
            <div
                className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ring-2 ring-white",
                    !isHexColor && bgColor,
                    !isHexColor && textColor
                )}
                style={isHexColor ? { backgroundColor: bgColor, color: "#fff" } : undefined}
                title={assignee.name}
            >
                {initials}
            </div>
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

function formatDueDate(dateStr: string | undefined): string {
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
// Task Row
// ============================================================================

interface TaskRowProps {
    task: Task;
    isSubtask?: boolean;
    level?: number;
}

function TaskRow({ task, isSubtask = false, level = 0 }: TaskRowProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const hasSubtasks = (task.totalSubtasks ?? 0) > 0;
    const isDone = task.status === TaskStatus.DONE;

    // Calculate progress from completedSubtasks/totalSubtasks or use a default
    const progress = useMemo(() => {
        if (task.totalSubtasks && task.totalSubtasks > 0) {
            return Math.round(((task.completedSubtasks ?? 0) / task.totalSubtasks) * 100);
        }
        if (isDone) return 100;
        if (task.status === TaskStatus.IN_REVIEW) return 80;
        if (task.status === TaskStatus.IN_PROGRESS) return 50;
        return 0;
    }, [task, isDone]);

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
                            {/* Expand/Collapse for parent tasks */}
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

                            {/* Checkbox */}
                            <input
                                type="checkbox"
                                checked={isDone}
                                readOnly
                                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 shrink-0 cursor-pointer"
                            />

                            {/* Task name + badges */}
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className={cn(
                                        "text-sm font-medium truncate",
                                        isDone && "line-through text-gray-400"
                                    )}
                                >
                                    {task.name}
                                </span>

                                {hasSubtasks && (
                                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                                        <ListTree size={12} />
                                        <span>{task.totalSubtasks}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description Column */}
                    <div className="flex-1 py-3 px-4 min-w-[180px]">
                        <p className="text-sm text-gray-500 truncate">
                            {task.description || "—"}
                        </p>
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

            {/* Subtask rows would render here if we had subtask data */}
            {/* For now, subtask support is structural — ready for when backend provides parent_task_id */}
        </>
    );
}

// ============================================================================
// Status Group
// ============================================================================

interface StatusGroupProps {
    status: TaskStatus;
    tasks: Task[];
    defaultExpanded?: boolean;
}

function StatusGroup({ status, tasks, defaultExpanded = true }: StatusGroupProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const config = STATUS_CONFIG[status];
    const { open: openCreateTask } = useCreateTaskModel();

    if (tasks.length === 0) return null;

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
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <MoreHorizontal size={14} />
                </button>
                <button
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Column Headers + Rows */}
            {isExpanded && (
                <>
                    {/* Column Headers */}
                    <div className="bg-gray-50/80 border-b border-gray-100">
                        <div className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="py-2 px-4 min-w-[280px] w-[280px]">Task</div>
                            <div className="py-2 px-4 flex-1 min-w-[180px]">Description</div>
                            <div className="py-2 px-4 w-[120px] shrink-0">Assignee</div>
                            <div className="py-2 px-4 w-[160px] shrink-0">Due Date</div>
                            <div className="py-2 px-4 w-[100px] shrink-0">Priority</div>
                            <div className="py-2 px-4 w-[150px] shrink-0">Progress</div>
                            <div className="py-2 px-4 w-[48px] shrink-0">
                                <Plus size={14} className="text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Task Rows */}
                    {tasks.map((task) => (
                        <TaskRow key={task.id || task.$id} task={task} />
                    ))}

                    {/* Add Task Button */}
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
// Main DataSpreadsheet Component
// ============================================================================

interface DataSpreadsheetProps {
    data: Task[];
}

export function DataSpreadsheet({ data }: DataSpreadsheetProps) {
    const { open: openCreateTask } = useCreateTaskModel();

    // Group tasks by status
    const groupedTasks = useMemo(() => {
        const groups: Record<string, Task[]> = {};

        for (const status of STATUS_ORDER) {
            groups[status] = [];
        }

        for (const task of data) {
            const status = task.status || TaskStatus.TODO;
            if (!groups[status]) {
                groups[status] = [];
            }
            groups[status].push(task);
        }

        return groups;
    }, [data]);

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

    return (
        <div className="space-y-3">
            {STATUS_ORDER.map((status) => (
                <StatusGroup
                    key={status}
                    status={status}
                    tasks={groupedTasks[status] || []}
                    defaultExpanded={true}
                />
            ))}
        </div>
    );
}
