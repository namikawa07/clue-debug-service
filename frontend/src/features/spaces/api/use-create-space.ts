import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/lib/api";

interface Space {
    id: string;
    name: string;
    workspace_id: string;
    image_url?: string;
}

interface CreateSpaceRequest {
    name: string;
    workspaceId: string;
    image?: File | string;
}

export const useCreateSpace = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<Space, Error, CreateSpaceRequest>({
        mutationFn: async ({ name, workspaceId, image }) => {
            let formData: FormData | undefined = undefined;

            if (image instanceof File) {
                formData = new FormData();
                formData.append("name", name);
                formData.append("image", image);
            }

            const url = `/workspaces/${workspaceId}/spaces`;

            const response = formData
                ? await api.post<Space>(url, formData)
                : await api.post<Space>(url, { name, image: typeof image === "string" ? image : undefined });

            return response;
        },
        onSuccess: () => {
            toast.success("Space created");
            queryClient.invalidateQueries({ queryKey: ["spaces"] });
        },
        onError: () => {
            toast.error("Failed to create space");
        }
    });

    return mutation;
};
