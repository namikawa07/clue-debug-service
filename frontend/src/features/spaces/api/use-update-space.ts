import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

interface UpdateSpaceRequest {
    param: {
        spaceId: string;
    };
    form: {
        name: string;
        image?: File | string;
    }
}

export const useUpdateSpace = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        any,
        Error,
        UpdateSpaceRequest
    >({
        mutationFn: async ({ form, param }) => {
            const response = await api.patch<any>(`/spaces/${param.spaceId}`, {
                name: form.name
            });

            const data = {
                $id: response.id,
                $createdAt: response.created_at,
                $updatedAt: response.updated_at,
                name: response.name,
                workspaceId: response.workspace_id,
                imageUrl: "",
            };

            return { data };
        },
        onSuccess: ({ data }) => {
            toast.success("Space updated");

            queryClient.invalidateQueries({ queryKey: ["spaces"] });
            queryClient.invalidateQueries({ queryKey: ["space", data.$id] });
        },
        onError: () => {
            toast.error("Failed to update space");
        }
    })

    return mutation;
};
