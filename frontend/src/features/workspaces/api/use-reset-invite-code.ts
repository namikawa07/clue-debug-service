import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ResetInviteCodeProps {
    param: {
        workspaceId: string;
    };
}

export const useResetInviteCode = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<any, Error, ResetInviteCodeProps>({
        mutationFn: async ({ param }) => {
            const response = await api.post<any>(`/workspaces/${param.workspaceId}/reset-invite-code`);
            return response;
        },
        onSuccess: (_, variables) => {
            toast.success("Invite code reset");
            queryClient.invalidateQueries({ queryKey: ["workspace", variables.param.workspaceId] });
        },
        onError: () => {
            toast.error("Failed to reset invite code");
        }
    });

    return mutation;
};
