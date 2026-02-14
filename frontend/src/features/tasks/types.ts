export enum TaskStatus {
    TODO = "todo",
    IN_PROGRESS = "in_progress",
    IN_REVIEW = "review",
    DONE = "done",
    BLOCKED = "blocked"
};

export type Task = {
    id: string;
    name: string;
    status: TaskStatus;
    workspaceId: string;
    assigneeId: string;
    spaceId: string;
    position: number;
    dueDate: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    totalSubtasks?: number;
    completedSubtasks?: number;
    priority?: "critical" | "high" | "medium" | "low";
    isUrgent?: boolean;
    teamId?: string;
    created_at?: string;
    updated_at?: string;
    space?: {
        name: string;
        imageUrl?: string;
    };
    assignee?: {
        name: string;
        email?: string;
        avatarColor?: {
            bg: string;
            text: string;
        };
    };
    // Legacy support
    $id: string;
    $createdAt: string;
    $updatedAt: string;
};

export type Epic = {
    id: string;
    name: string;
    status: string;
    space_id: string;
    created_at?: string;
    updated_at?: string;
};