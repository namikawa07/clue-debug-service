import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Team {
  id: string;
  name: string;
  workspace_id: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface useGetTeamsProps {
  workspaceId?: string;
  enabled?: boolean;
}

export const useGetTeams = ({
  workspaceId,
  enabled,
}: useGetTeamsProps) => {
  return useQuery({
    queryKey: ["teams", workspaceId],
    enabled: typeof enabled === "boolean" ? enabled : Boolean(workspaceId),
    queryFn: async () => {
      if (!workspaceId) throw new Error("Missing workspaceId");

      const response = await api.get<Team[]>(`/workspaces/${workspaceId}/teams`);

      return {
        documents: response.map(t => ({
          ...t,
          $id: t.id,
          workspaceId: t.workspace_id,
          workspace_id: t.workspace_id,
          $createdAt: t.created_at,
          $updatedAt: t.updated_at
        })),
        total: response.length,
      };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
