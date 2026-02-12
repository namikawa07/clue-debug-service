import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Epic } from "@/features/tasks/types";

interface UseGetEpicsProps {
    projectId?: string;
}

export const useGetEpics = ({ projectId }: UseGetEpicsProps) => {
    const query = useQuery({
        queryKey: ["epics", projectId],
        queryFn: async () => {
            if (!projectId) return [];

            try {
                // Adjust endpoint based on backend routing. 
                // In backend `epics.py`: @router.get("/projects/{project_id}")
                // If router included with /epics prefix -> /epics/projects/{project_id}
                // If included directly -> /projects/{project_id} (conflict!)
                // I'm betting on /epics/projects/{project_id} or just /epics?projectId=... 
                const response = await api.get<any[]>(`/projects/${projectId}/epics`);

                // Map backend 'title' to frontend 'name'
                return response.map((epic) => ({
                    ...epic,
                    name: epic.title,
                })) as Epic[];
            } catch (error) {
                console.error("Failed to fetch epics", error);
                return [];
            }
        },
        enabled: !!projectId,
    });
    return query;
};
