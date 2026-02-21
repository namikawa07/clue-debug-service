import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Epic } from "@/features/tasks/types";

interface UseGetEpicsProps {
    spaceId?: string;
}

export const useGetEpics = ({ spaceId }: UseGetEpicsProps) => {
    const query = useQuery({
        queryKey: ["epics", spaceId],
        queryFn: async () => {
            if (!spaceId) return [];

            try {
                const response = await api.get<any[]>(`/spaces/${spaceId}/epics`);

                // Map backend 'title' to frontend 'name', forward count fields
                return response.map((epic) => ({
                    ...epic,
                    name: epic.title,
                    task_count: epic.task_count ?? 0,
                    completed_task_count: epic.completed_task_count ?? 0,
                    completion_percentage: epic.completion_percentage ?? 0,
                })) as Epic[];
            } catch (error) {
                console.error("Failed to fetch epics", error);
                return [];
            }
        },
        enabled: !!spaceId,
    });
    return query;
};
