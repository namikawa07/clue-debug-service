import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface AddTeamMemberRequest {
    param: {
        teamId: string;
        userId: string;
    };
}

export const useAddTeamMember = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<any, Error, AddTeamMemberRequest>({
        mutationFn: async ({ param }) => {
            await api.post(`/teams/${param.teamId}/members/${param.userId}`);
            return { success: true };
        },
        onSuccess: (_, variables) => {
            toast.success("Member added to team");
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            queryClient.invalidateQueries({ queryKey: ["team", variables.param.teamId] });
        },
        onError: () => {
            toast.error("Failed to add team member");
        },
    });

    return mutation;
};
