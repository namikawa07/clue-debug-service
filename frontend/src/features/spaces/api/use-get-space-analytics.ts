import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SpaceAnalyticsResponseType {
    taskCount: number;
    taskDifference: number;
    assignedTaskCount: number;
    assignedTaskDifference: number;
    completedTaskCount: number;
    completedTaskDifference: number;
    overdueTaskCount: number;
    overdueTaskDifference: number;
    incompleteTaskCount: number;
    incompleteTaskDifference: number;
    space_id?: string;
    period_days?: number;
}

interface useGetSpaceAnalyticsProps {
    spaceId: string;
}

export const useGetSpaceAnalytics = ({
    spaceId,
}: useGetSpaceAnalyticsProps) => {
    const query = useQuery({
        queryKey: ["space-analytics", spaceId],
        queryFn: async () => {
            const data = await api.get<SpaceAnalyticsResponseType>(`/spaces/${spaceId}/analytics`);

            if (!data) {
                throw new Error("Failed to fetch space analytics");
            }

            return data;
        }
    });

    return query;
}
