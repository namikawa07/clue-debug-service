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

                // Map backend 'title' to frontend 'name'
                return response.map((epic) => ({
                    ...epic,
                    name: epic.title,
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
