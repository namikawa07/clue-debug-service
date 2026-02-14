import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface DeleteTeamRequest {
  param: {
    teamId: string;
  };
}

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { data: any },
    Error,
    DeleteTeamRequest
  >({
    mutationFn: async ({ param }) => {
      await api.delete<any>(`/teams/${param.teamId}`);

      return { data: { id: param.teamId } };
    },
    onSuccess: () => {
      toast.success("Team deleted");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: () => {
      toast.error("Failed to delete team");
    }
  });

  return mutation;
};
