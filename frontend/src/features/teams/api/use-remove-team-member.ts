import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface RemoveTeamMemberRequest {
  param: {
    teamId: string;
    memberId: string;
  };
}

export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<any, Error, RemoveTeamMemberRequest>({
    mutationFn: async ({ param }) => {
      await api.delete(`/teams/${param.teamId}/members/${param.memberId}`);
      return { success: true };
    },
    onSuccess: (_, variables) => {
      toast.success("Member removed from team");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", variables.param.teamId] });
    },
    onError: () => {
      toast.error("Failed to remove team member");
    },
  });

  return mutation;
};
