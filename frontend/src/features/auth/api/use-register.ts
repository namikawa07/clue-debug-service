import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { API_URL } from "@/config";

export const useRegister = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const mutation = useMutation<
        { user: any; session: any | null },
        Error,
        { email: string; password: string; name: string }
    >({
        mutationFn: async ({ email, password, name }) => {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error("User not authenticated");
            }

            if (user.email !== email) {
                throw new Error("Verified email does not match the registration email");
            }

            const { data, error } = await supabase.auth.updateUser({
                password,
                data: {
                    full_name: name,
                    has_password: true,
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            const { data: sessionData } = await supabase.auth.refreshSession();
            const token = sessionData.session?.access_token;

            if (token) {
                const response = await fetch(`${API_URL}/auth/exchange`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ supabase_token: token }),
                });

                if (!response.ok) {
                    throw new Error("Failed to sync user with backend");
                }
            }

            return { user: data.user, session: sessionData.session };
        },
        onSuccess: () => {
            toast.success("Registered successfully");
            // Invalidate current user query to force refetch
            queryClient.invalidateQueries({ queryKey: ["current"] });
            // Redirect to dashboard to get fresh session
            router.push("/");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to register");
        }
    });

    return mutation;
};
