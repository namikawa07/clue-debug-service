"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrent } from "../api/use-current";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";

export const OnboardingGuard = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { data: user, isLoading: isUserLoading } = useCurrent();
    const { data: workspaces, isLoading: isWorkspacesLoading } = useGetWorkspaces();

    useEffect(() => {
        // Wait for both user and workspaces to load
        if (isUserLoading || isWorkspacesLoading) {
            return;
        }

        // 1. Check if user is authenticated
        if (!user) {
            return;
        }

        // 2. Check for Onboarding Requirements
        const hasPassword = user.user_metadata?.has_password;
        const hasName = Boolean(user.user_metadata?.full_name?.trim() || user.user_metadata?.name?.trim());

        const isOnWorkspacePage = pathname?.startsWith("/workspaces/");
        const hasWorkspacesList = workspaces && workspaces?.total > 0;
        const hasWorkspaces = hasWorkspacesList || isOnWorkspacePage;

        // If any requirement is missing, redirect to onboarding
        if (!hasPassword || !hasName || !hasWorkspaces) {
            // Avoid redirect loops if already on onboarding
            if (!pathname?.startsWith("/onboarding")) {
                router.push("/onboarding");
            }
        }

    }, [user, workspaces, isUserLoading, isWorkspacesLoading, router, pathname]);

    // Optional: Show loading state while checking
    // COMMENTED OUT: Remove the loading spinner
    // if (isChecking && (isUserLoading || isWorkspacesLoading)) {
    //     return (
    //         <div className="h-full flex items-center justify-center">
    //             <Loader className="size-6 animate-spin text-muted-foreground" />
    //         </div>
    //     );
    // }

    // Don't show anything while checking, just return null
    return null;
};
