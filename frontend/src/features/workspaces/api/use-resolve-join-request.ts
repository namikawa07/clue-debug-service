import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ResolveJoinRequestProps {
    workspaceId: string;
    requestId: string;
    approved: boolean;
}

export const useResolveJoinRequest = () => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, ResolveJoinRequestProps>({
        mutationFn: async ({ workspaceId, requestId, approved }) => {
            return await api.post(`/workspaces/${workspaceId}/join-requests/${requestId}/resolve`, {}, {
                params: { approved: approved.toString() }
            });
        },
        onSuccess: (_, { workspaceId }) => {
            toast.success("Join request resolved");
            queryClient.invalidateQueries({ queryKey: ["join-requests", workspaceId] });
            queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
        },
        onError: () => {
            toast.error("Failed to resolve join request");
        }
    });
};
