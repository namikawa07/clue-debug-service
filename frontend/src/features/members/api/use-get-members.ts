import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Member, MemberRole } from "../types";

interface useGetMembersProps {
    workspaceId: string;
};

export const useGetMembers = ({
    workspaceId,
}: useGetMembersProps) => {
    const query = useQuery({
        queryKey: ["members", workspaceId],
        queryFn: async () => {
            const response = await api.get<any[]>(`/workspaces/${workspaceId}/members`);

            // Map to frontend format
            const documents = response.map((m: any) => ({
                id: m.id,
                $id: m.id,
                created_at: m.joined_at,
                updated_at: m.joined_at,
                $createdAt: m.joined_at,
                $updatedAt: m.joined_at,
                $collectionId: "members",
                $databaseId: "finepro",
                $permissions: [],

                workspace_id: m.workspace_id,
                user_id: m.user_id,
                workspaceId: m.workspace_id,
                userId: m.user_id,
                role: m.role.toUpperCase() as MemberRole,
                name: m.user?.name || "Unknown",
                email: m.user?.email || "",
                avatarColor: { bg: "#f3f4f6", text: "#374151" } // Default
            }));

            return {
                documents: documents,
                total: documents.length,
            };
        }
    });

    return query;
};