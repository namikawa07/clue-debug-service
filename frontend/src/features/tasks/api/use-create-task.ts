import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { TaskStatus } from "../types";

interface CreateTaskRequest {
    json: {
        name: string;
        status: TaskStatus;
        workspaceId: string;
        spaceId: string;
        dueDate: Date;
        assigneeId: string;
        description?: string;
        priority?: string;
        duration?: number;
        startTime?: string;
        endTime?: string;
        totalSubtasks?: number;
        completedSubtasks?: number;
        isUrgent?: boolean;
    }
}

export const useCreateTask = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        { data: any },
        Error,
        CreateTaskRequest
    >({
        mutationFn: async ({ json }) => {
            const {
                spaceId,
                name,
                status,
                assigneeId,
                dueDate,
                description,
                priority,
                duration,
                startTime,
                endTime,
                totalSubtasks,
                completedSubtasks,
                isUrgent
            } = json;

            if (!spaceId) throw new Error("Space ID is required");

            const response = await api.post<any>(`/spaces/${spaceId}/tasks`, {
                title: name,
                description,
                status: status,
                priority,
                assigned_to: assigneeId,
                due_date: dueDate ? dueDate.toISOString() : null,
                estimated_hours: duration,
                additional_data: {
                    startTime,
                    endTime,
                    totalSubtasks,
                    completedSubtasks,
                    isUrgent
                }
            });

            // Adapt backend response to frontend format
            const data = {
                ...response,
                $id: response.id,
                $createdAt: response.created_at,
                $updatedAt: response.updated_at,
                spaceId: response.space_id,
                assigneeId: response.assigned_to,
            };

            return { data };
        },
        onSuccess: () => {
            toast.success("Task created");
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
            queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create task");
        }
    })

    return mutation;
};
