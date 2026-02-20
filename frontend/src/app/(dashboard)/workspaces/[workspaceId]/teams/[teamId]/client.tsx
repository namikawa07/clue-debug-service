"use client";

import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";

import { useTeamId } from "@/features/teams/hooks/use-team-id";
import { useGetTeam } from "@/features/teams/api/use-get-team";
import { PageLoader } from "@/components/page-loader";
import { PageError } from "@/components/page-error";
import { TeamMembersList } from "@/features/teams/components/team-members-list";
import { Button } from "@/components/ui/button";
import { TeamAvatar } from "@/features/teams/components/team-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

export const TeamsIdClient = () => {
    const teamId = useTeamId() as string;
    const workspaceId = useWorkspaceId();
    const { data: team, isLoading } = useGetTeam({ teamId });

    if (isLoading) return <PageLoader />;
    if (!team) return <PageError message="Team not found" />;

    const memberCount = team.members?.length ?? team.memberIds?.length ?? 0;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5 text-gray-500 hover:text-gray-900 -ml-1">
                    <Link href={`/workspaces/${workspaceId}/teams`}>
                        <ChevronLeft size={16} />
                        All Teams
                    </Link>
                </Button>
            </div>

            {/* Team info card */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                    <TeamAvatar team={team} className="size-14 shrink-0" />
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">{team.name}</h1>
                        {team.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{team.description}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <Users size={13} className="text-gray-400" />
                            <span className="text-xs text-gray-500">
                                {memberCount} {memberCount === 1 ? "member" : "members"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members list */}
            <TeamMembersList teamId={team.id} />
        </div>
    );
};
