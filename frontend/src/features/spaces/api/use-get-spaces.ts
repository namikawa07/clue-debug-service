import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

import { Space } from "../types";

interface useGetSpacesProps {
    workspaceId?: string;
    enabled?: boolean;
}

interface UseGetSpacesResult {
    documents: Space[];
    total: number;
}

export const useGetSpaces = ({
    workspaceId,
    enabled,
}: useGetSpacesProps) => {
    return useQuery({
        queryKey: ["spaces", workspaceId],
        enabled: typeof enabled === "boolean" ? enabled : Boolean(workspaceId),
        queryFn: async () => {
            if (!workspaceId) throw new Error("Missing workspaceId");

            const { data, error } = await supabase
                .from("spaces")
                .select("*")
                .eq("workspace_id", workspaceId)
                .order("created_at", { ascending: false });

            if (error) {
                throw new Error(error.message || "Failed to fetch spaces");
            }
            const mappedData = (data || []).map((space: any) => ({
                ...space,
                id: space.id || space.$id,
                $id: space.id || space.$id,
                imageUrl: space.imageUrl || space.image_url || "",
            }));

            return {
                documents: mappedData,
                total: data?.length ?? 0,
            };
        },
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
};
