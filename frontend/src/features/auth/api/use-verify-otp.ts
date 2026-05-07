import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const useVerifyOtp = () => {
    const mutation = useMutation<
        { success: boolean },
        Error,
        { email: string; secret: string }
    >({
        mutationFn: async ({ email, secret }) => {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: secret,
                type: "email"
            });

            if (error) {
                throw new Error(error.message);
            }

            return { success: true };
        },
        onSuccess: () => {
            toast.success("Email verified successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Invalid OTP");
        }
    });

    return mutation;
};
