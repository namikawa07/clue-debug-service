import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { z } from "zod";
import { createEpicSchema } from "@/features/tasks/schemas";

type ResponseType = { data: any };
type RequestType = z.infer<typeof createEpicSchema>;

export const useCreateEpic = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType,
        Error,
        RequestType
    >({
        mutationFn: async (json) => {
            const payload = {
                ...json,
                space_id: json.spaceId,
            };
            const response = await api.post("/epics/", payload);
            return { data: response };
        },
        onSuccess: () => {
            toast.success("Epic created");
            queryClient.invalidateQueries({ queryKey: ["epics"] });
        },
        onError: () => {
            toast.error("Failed to create epic");
        }
    });

    return mutation;
};
