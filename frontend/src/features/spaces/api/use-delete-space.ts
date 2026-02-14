import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

interface DeleteSpaceRequest {
    param: {
        spaceId: string;
    }
}

export const useDeleteSpace = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        any,
        Error,
        DeleteSpaceRequest
    >({
        mutationFn: async ({ param }) => {
            await api.delete(`/spaces/${param.spaceId}`);
            return { data: { $id: param.spaceId } };
        },
        onSuccess: ({ data }) => {
            toast.success("Space deleted");

            queryClient.invalidateQueries({ queryKey: ["spaces"] });
            queryClient.invalidateQueries({ queryKey: ["space", data.$id] });
        },
        onError: () => {
            toast.error("Failed to delete space");
        }
    })

    return mutation;
};
