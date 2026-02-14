import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Space } from "../types";

interface useGetSpaceProps {
    spaceId: string;
}

export const useGetSpace = ({
    spaceId,
}: useGetSpaceProps) => {
    const query = useQuery({
        queryKey: ["space", spaceId],
        queryFn: async () => {
            const space = await api.get<any>(`/spaces/${spaceId}`);

            if (!space) {
                throw new Error("Space not found");
            }

            const data: Space = {
                id: space.id,
                $id: space.id,
                $createdAt: space.created_at,
                $updatedAt: space.updated_at,
                $collectionId: "spaces",
                $databaseId: "finepro",
                $permissions: [],

                name: space.name,
                workspaceId: space.workspace_id,
                imageUrl: "",
            } as any;

            return data;
        }
    });

    return query;
}
