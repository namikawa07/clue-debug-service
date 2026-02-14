import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const useGetJoinRequests = ({
    workspaceId
}: { workspaceId: string }) => {
    return useQuery({
        queryKey: ["join-requests", workspaceId],
        queryFn: async () => {
            const response = await api.get<any[]>(`/workspaces/${workspaceId}/join-requests`);
            return {
                documents: response.map(r => ({
                    ...r,
                    $id: r.id,
                })),
                total: response.length
            };
        }
    });
};
