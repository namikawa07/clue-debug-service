"use client";

import React, { useMemo, useRef, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Layers,
} from "lucide-react";
import { format, addDays, startOfWeek, differenceInDays, isWithinInterval, endOfWeek, addWeeks } from "date-fns";

import { cn } from "@/lib/utils";
import { Task, TaskStatus, Epic } from "../types";
import { Button } from "@/components/ui/button";

// ============================================================================
// Config
// ============================================================================

const STATUS_COLORS: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: "bg-blue-400",
    [TaskStatus.IN_PROGRESS]: "bg-amber-400",
    [TaskStatus.IN_REVIEW]: "bg-purple-400",
    [TaskStatus.DONE]: "bg-green-400",
    [TaskStatus.BLOCKED]: "bg-red-400",
};

const DAY_WIDTH = 40;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 60;
const LABEL_WIDTH = 220;

// ============================================================================
// Types
// ============================================================================

interface GanttRow {
    type: "epic" | "task";
    id: string;
    label: string;
    startDate: Date | null;
    endDate: Date | null;
    status: TaskStatus;
    epicName?: string;
}

// ============================================================================
// Component
// ============================================================================

interface DataGanttProps {
    data: Task[];
    epics?: Epic[];
}

export function DataGantt({ data, epics = [] }: DataGanttProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [weekOffset, setWeekOffset] = useState(0);

    const today = new Date();
    const viewStart = startOfWeek(addWeeks(today, weekOffset - 1), { weekStartsOn: 1 });
    const viewEnd = endOfWeek(addWeeks(today, weekOffset + 3), { weekStartsOn: 1 });
    const totalDays = differenceInDays(viewEnd, viewStart) + 1;

    // Build row data
    const rows = useMemo(() => {
        const result: GanttRow[] = [];
        const epicMap = new Map<string, Epic>();
        for (const epic of epics) {
            epicMap.set(epic.id, epic);
        }

        // Group tasks by epic
        const epicTasks = new Map<string, Task[]>();
        const ungrouped: Task[] = [];

        for (const task of data) {
            const epicId = (task as any).epicId || (task as any).epic_id;
            if (epicId && epicMap.has(epicId)) {
                if (!epicTasks.has(epicId)) epicTasks.set(epicId, []);
                epicTasks.get(epicId)!.push(task);
            } else {
                ungrouped.push(task);
            }
        }

        for (const [epicId, tasks] of epicTasks) {
            const epic = epicMap.get(epicId)!;
            result.push({
                type: "epic",
                id: epicId,
                label: epic.name,
                startDate: null,
                endDate: null,
                status: TaskStatus.TODO,
            });
            for (const task of tasks) {
                result.push({
                    type: "task",
                    id: task.id || task.$id,
                    label: task.name,
                    startDate: task.startTime ? new Date(task.startTime) : task.created_at ? new Date(task.created_at) : null,
                    endDate: task.dueDate ? new Date(task.dueDate) : null,
                    status: task.status,
                });
            }
        }

        if (ungrouped.length > 0) {
            result.push({
                type: "epic",
                id: "__ungrouped__",
                label: "Ungrouped",
                startDate: null,
                endDate: null,
                status: TaskStatus.TODO,
            });
            for (const task of ungrouped) {
                result.push({
                    type: "task",
                    id: task.id || task.$id,
                    label: task.name,
                    startDate: task.startTime ? new Date(task.startTime) : task.created_at ? new Date(task.created_at) : null,
                    endDate: task.dueDate ? new Date(task.dueDate) : null,
                    status: task.status,
                });
            }
        }

        return result;
    }, [data, epics]);

    // Generate date columns
    const dateColumns = useMemo(() => {
        const cols: Date[] = [];
        for (let i = 0; i < totalDays; i++) {
            cols.push(addDays(viewStart, i));
        }
        return cols;
    }, [viewStart, totalDays]);

    // Today marker position
    const todayOffset = differenceInDays(today, viewStart);
    const todayX = todayOffset * DAY_WIDTH + DAY_WIDTH / 2;

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-gray-500">No tasks to display in Gantt view</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Navigation */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWeekOffset((w) => w - 1)}
                        className="h-7 w-7 p-0"
                    >
                        <ChevronLeft size={14} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWeekOffset(0)}
                        className="h-7 px-3 text-xs"
                    >
                        Today
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWeekOffset((w) => w + 1)}
                        className="h-7 w-7 p-0"
                    >
                        <ChevronRight size={14} />
                    </Button>
                </div>
                <span className="text-xs text-gray-500">
                    {format(viewStart, "MMM d")} - {format(viewEnd, "MMM d, yyyy")}
                </span>
            </div>

            {/* Gantt body */}
            <div className="flex-1 overflow-auto relative" ref={scrollRef}>
                <div className="flex" style={{ minWidth: LABEL_WIDTH + totalDays * DAY_WIDTH }}>
                    {/* Left labels column */}
                    <div
                        className="sticky left-0 z-20 bg-white border-r border-gray-200 shrink-0"
                        style={{ width: LABEL_WIDTH }}
                    >
                        {/* Date header spacer */}
                        <div style={{ height: HEADER_HEIGHT }} className="border-b border-gray-200" />

                        {/* Row labels */}
                        {rows.map((row) => (
                            <div
                                key={row.id}
                                className={cn(
                                    "flex items-center px-3 border-b border-gray-100 text-sm truncate",
                                    row.type === "epic" && "bg-gray-50 font-medium text-gray-800"
                                )}
                                style={{ height: ROW_HEIGHT }}
                            >
                                {row.type === "epic" ? (
                                    <div className="flex items-center gap-1.5">
                                        <Layers size={12} className="text-indigo-400 shrink-0" />
                                        <span className="truncate">{row.label}</span>
                                    </div>
                                ) : (
                                    <span className="pl-5 truncate text-gray-600">{row.label}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Timeline area */}
                    <div className="flex-1 relative">
                        {/* Date headers */}
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200" style={{ height: HEADER_HEIGHT }}>
                            <div className="flex" style={{ height: HEADER_HEIGHT }}>
                                {dateColumns.map((date, i) => {
                                    const isToday =
                                        date.getDate() === today.getDate() &&
                                        date.getMonth() === today.getMonth() &&
                                        date.getFullYear() === today.getFullYear();
                                    const isMonday = date.getDay() === 1;

                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "flex flex-col items-center justify-end pb-1 border-r border-gray-100 shrink-0",
                                                isToday && "bg-blue-50"
                                            )}
                                            style={{ width: DAY_WIDTH }}
                                        >
                                            {isMonday && (
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {format(date, "MMM")}
                                                </span>
                                            )}
                                            <span
                                                className={cn(
                                                    "text-xs font-medium",
                                                    isToday ? "text-blue-600" : "text-gray-500",
                                                    date.getDay() === 0 || date.getDay() === 6
                                                        ? "text-gray-300"
                                                        : ""
                                                )}
                                            >
                                                {format(date, "d")}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {format(date, "EEE").charAt(0)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rows with bars */}
                        {rows.map((row) => {
                            let barLeft = 0;
                            let barWidth = 0;
                            let hasBar = false;

                            if (row.type === "task" && row.startDate && row.endDate) {
                                const startDiff = differenceInDays(row.startDate, viewStart);
                                const endDiff = differenceInDays(row.endDate, viewStart);
                                barLeft = Math.max(0, startDiff) * DAY_WIDTH;
                                barWidth = (Math.min(endDiff, totalDays - 1) - Math.max(startDiff, 0) + 1) * DAY_WIDTH;
                                hasBar = barWidth > 0 && endDiff >= 0 && startDiff < totalDays;
                            } else if (row.type === "task" && row.endDate) {
                                // Only due date, show as a small bar
                                const endDiff = differenceInDays(row.endDate, viewStart);
                                barLeft = Math.max(0, endDiff - 2) * DAY_WIDTH;
                                barWidth = 3 * DAY_WIDTH;
                                hasBar = endDiff >= 0 && endDiff < totalDays;
                            }

                            return (
                                <div
                                    key={row.id}
                                    className={cn(
                                        "relative border-b border-gray-100",
                                        row.type === "epic" && "bg-gray-50/50"
                                    )}
                                    style={{ height: ROW_HEIGHT }}
                                >
                                    {/* Weekend shading */}
                                    {dateColumns.map((date, i) => {
                                        if (date.getDay() === 0 || date.getDay() === 6) {
                                            return (
                                                <div
                                                    key={i}
                                                    className="absolute top-0 bottom-0 bg-gray-50/80"
                                                    style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                                                />
                                            );
                                        }
                                        return null;
                                    })}

                                    {/* Task bar */}
                                    {hasBar && (
                                        <div
                                            className={cn(
                                                "absolute top-1.5 rounded-md h-[22px] cursor-pointer transition-opacity hover:opacity-80 flex items-center px-2",
                                                STATUS_COLORS[row.status] || "bg-gray-300"
                                            )}
                                            style={{
                                                left: barLeft,
                                                width: Math.max(barWidth, DAY_WIDTH),
                                            }}
                                            title={`${row.label}\n${row.startDate ? format(row.startDate, "MMM d") : ""} → ${row.endDate ? format(row.endDate, "MMM d") : ""}`}
                                        >
                                            {barWidth > DAY_WIDTH * 3 && (
                                                <span className="text-[10px] text-white font-medium truncate">
                                                    {row.label}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Today marker line */}
                        {todayOffset >= 0 && todayOffset < totalDays && (
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 pointer-events-none"
                                style={{ left: todayX }}
                            >
                                <div className="absolute -top-0.5 -left-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
