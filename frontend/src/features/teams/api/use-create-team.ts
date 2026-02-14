import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface CreateTeamRequest {
  workspaceId: string;
  name: string;
  description?: string;
}

export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    { data: any },
    Error,
    CreateTeamRequest
  >({
    mutationFn: async ({ workspaceId, name, description }) => {
      const response = await api.post<any>(`/workspaces/${workspaceId}/teams`, {
        name,
        description,
        workspace_id: workspaceId
      });

      return { data: response };
    },
    onSuccess: (_, { workspaceId }) => {
      toast.success("Team created");
      queryClient.invalidateQueries({ queryKey: ["teams", workspaceId] });
    },
    onError: () => {
      toast.error("Failed to create team");
    }
  });

  return mutation;
};
