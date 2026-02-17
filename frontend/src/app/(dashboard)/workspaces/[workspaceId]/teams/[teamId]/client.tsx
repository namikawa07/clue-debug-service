"use client";

import { useTeamId } from "@/features/teams/hooks/use-team-id";
import { useGetTeam } from "@/features/teams/api/use-get-team";
import { PageLoader } from "@/components/page-loader";
import { PageError } from "@/components/page-error";
import { TeamMembersList } from "@/features/teams/components/team-members-list";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Settings } from "lucide-react";
import Link from "next/link";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

export const TeamsIdClient = () => {
    const teamId = useTeamId() as string;
    const workspaceId = useWorkspaceId();
    const { data: team, isLoading } = useGetTeam({ teamId });

    if (isLoading) return <PageLoader />;
    if (!team) return <PageError message="Team not found" />;

    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                    <Button variant="secondary" size="sm" asChild>
                        <Link href={`/workspaces/${workspaceId}/teams`}>
                            <ChevronLeft className="size-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <h3 className="text-xl font-bold">{team.name}</h3>
                </div>
                <Button variant="secondary" size="sm">
                    <Settings className="size-4 mr-2" />
                    Team Settings
                </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
                <TeamMembersList teamId={team.id} />
            </div>
        </div>
    )
};
