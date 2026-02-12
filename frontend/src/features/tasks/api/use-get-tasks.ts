import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Task, TaskStatus } from "../types";

// Helper to check if a valid status enum
const isValidStatus = (status: string): status is TaskStatus => {
    return Object.values(TaskStatus).includes(status as TaskStatus);
}

interface useGetTasksProps {
    workspaceId: string;
    projectId?: string | null;
    status?: TaskStatus | null;
    assigneeId?: string | null;
    search?: string | null;
    dueDate?: string | null;
}

export const useGetTasks = ({
    workspaceId,
    projectId,
    status,
    assigneeId,
    search,
    dueDate,
}: useGetTasksProps) => {
    const query = useQuery({
        queryKey: ["tasks", workspaceId, projectId, status, search, assigneeId, dueDate],
        queryFn: async () => {
            // Determine endpoint based on scope
            const endpoint = projectId
                ? `/projects/${projectId}/tasks`
                : `/workspaces/${workspaceId}/tasks`;

            // Prepare params
            const params: Record<string, any> = {};
            if (status) params.status = status;
            if (assigneeId) params.assigned_to = assigneeId;
            if (search) params.search = search;
            // Note: dueDate filtering is not yet supported by backend API

            const tasks = await api.get<any[]>(endpoint, { params });

            const documents = tasks.map((response: any) => ({
                id: response.id,
                $id: response.id,
                created_at: response.created_at,
                updated_at: response.updated_at,
                $createdAt: response.created_at,
                $updatedAt: response.updated_at,

                name: response.title,
                status: isValidStatus(response.status) ? response.status : TaskStatus.TODO,
                workspaceId: workspaceId,
                projectId: response.project?.id || response.epic_id || "",
                assigneeId: response.assigned_to || "",
                position: response.position || 0,
                dueDate: response.due_date || "",
                description: response.description,
                priority: response.priority,

                project: response.project ? {
                    name: response.project.name,
                    imageUrl: ""
                } : { name: "Unknown Project", imageUrl: "" },
                assignee: response.assignee ? {
                    name: response.assignee.name,
                    avatarColor: { bg: "bg-gray-100", text: "text-gray-700" }
                } : { name: "Unassigned" }
            })) as Task[];

            return {
                documents,
                total: documents.length
            };
        }
    });

    return query;
};