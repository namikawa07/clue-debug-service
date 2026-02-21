"use client";

import { useState } from "react";
import {
    X,
    Trash2,
    UserPlus,
    Flag,
    ArrowRightCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Task, TaskStatus } from "../types";
import { useUpdateTask } from "../api/use-update-task";
import { useDeleteTask } from "../api/use-delete-task";
import useConfirm from "@/hooks/use-confirm";

interface BulkActionBarProps {
    selectedCount: number;
    selectedTaskIds: Set<string>;
    tasks: Task[];
    onClearSelection: () => void;
}

const STATUS_OPTIONS = [
    { value: TaskStatus.TODO, label: "To Do" },
    { value: TaskStatus.IN_PROGRESS, label: "In Progress" },
    { value: TaskStatus.IN_REVIEW, label: "In Review" },
    { value: TaskStatus.DONE, label: "Done" },
    { value: TaskStatus.BLOCKED, label: "Blocked" },
] as const;

const PRIORITY_OPTIONS = [
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
] as const;

export function BulkActionBar({
    selectedCount,
    selectedTaskIds,
    tasks,
    onClearSelection,
}: BulkActionBarProps) {
    const { mutate: updateTask } = useUpdateTask();
    const { mutate: deleteTask } = useDeleteTask();
    const [isProcessing, setIsProcessing] = useState(false);

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Delete Tasks",
        `Are you sure you want to delete ${selectedCount} task${selectedCount > 1 ? "s" : ""}? This action cannot be undone.`,
        "destructive"
    );

    const handleBulkStatusChange = (status: TaskStatus) => {
        setIsProcessing(true);
        let completed = 0;
        selectedTaskIds.forEach((taskId) => {
            updateTask(
                { param: { taskId }, json: { status } },
                {
                    onSettled: () => {
                        completed++;
                        if (completed === selectedTaskIds.size) {
                            setIsProcessing(false);
                            onClearSelection();
                        }
                    },
                }
            );
        });
    };

    const handleBulkPriorityChange = (priority: string) => {
        setIsProcessing(true);
        let completed = 0;
        selectedTaskIds.forEach((taskId) => {
            updateTask(
                { param: { taskId }, json: { [priority]: priority } as any },
                {
                    onSettled: () => {
                        completed++;
                        if (completed === selectedTaskIds.size) {
                            setIsProcessing(false);
                            onClearSelection();
                        }
                    },
                }
            );
        });
    };

    const handleBulkDelete = async () => {
        const ok = await confirmDelete();
        if (!ok) return;

        setIsProcessing(true);
        let completed = 0;
        selectedTaskIds.forEach((taskId) => {
            deleteTask(
                { param: { taskId } },
                {
                    onSettled: () => {
                        completed++;
                        if (completed === selectedTaskIds.size) {
                            setIsProcessing(false);
                            onClearSelection();
                            toast.success(`Deleted ${selectedCount} tasks`);
                        }
                    },
                }
            );
        });
    };

    return (
        <>
            <DeleteDialog />
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
                <div className="flex items-center gap-2 bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-2.5 border border-gray-700">
                    {/* Count indicator */}
                    <div className="flex items-center gap-2 pr-3 border-r border-gray-700">
                        <div className="size-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                            {selectedCount}
                        </div>
                        <span className="text-sm font-medium">selected</span>
                    </div>

                    {/* Status change */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={isProcessing}
                                className="text-gray-300 hover:text-white hover:bg-gray-800 gap-1.5 h-8"
                            >
                                <ArrowRightCircle size={14} />
                                <span className="hidden sm:inline">Status</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-40">
                            {STATUS_OPTIONS.map((opt) => (
                                <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => handleBulkStatusChange(opt.value)}
                                >
                                    {opt.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Priority change */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={isProcessing}
                                className="text-gray-300 hover:text-white hover:bg-gray-800 gap-1.5 h-8"
                            >
                                <Flag size={14} />
                                <span className="hidden sm:inline">Priority</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-36">
                            {PRIORITY_OPTIONS.map((opt) => (
                                <DropdownMenuItem
                                    key={opt.value}
                                    onClick={() => handleBulkPriorityChange(opt.value)}
                                >
                                    {opt.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Delete */}
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isProcessing}
                        onClick={handleBulkDelete}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/50 gap-1.5 h-8"
                    >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Delete</span>
                    </Button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-700" />

                    {/* Clear selection */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSelection}
                        className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 px-2"
                    >
                        <X size={14} />
                    </Button>
                </div>
            </div>
        </>
    );
}
