import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

interface useGetTeamProps {
  teamId: string;
}

export const useGetTeam = ({ teamId }: useGetTeamProps) => {
  const query = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const response = await api.get<any>(`/teams/${teamId}`);

      return {
        ...response,
        id: response.id,
        $id: response.id,
        workspaceId: response.workspace_id,
        $createdAt: response.created_at,
        $updatedAt: response.updated_at,
      };
    },
  });

  return query;
};
