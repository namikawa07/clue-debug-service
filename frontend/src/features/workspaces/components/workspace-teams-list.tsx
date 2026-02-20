"use client";

import { Plus, Users, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { TeamAvatar } from "@/features/teams/components/team-avatar";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetTeams } from "@/features/teams/api/use-get-teams";
import { useDeleteTeam } from "@/features/teams/api/use-delete-team";
import { useCreateTeamModal } from "@/features/teams/hooks/use-create-team-modal";
import { CreateTeamModal } from "@/features/teams/components/create-team-modal";
import useConfirm from "@/hooks/use-confirm";

export const WorkspaceTeamsList = () => {
  const workspaceId = useWorkspaceId();
  const { open } = useCreateTeamModal();
  const { data: teams, isLoading } = useGetTeams({ workspaceId });
  const { mutate: deleteTeam, isPending: isDeleting } = useDeleteTeam();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Team",
    "This team will be permanently deleted. Members will not be removed from the workspace.",
    "destructive"
  );

  const handleDelete = async (teamId: string) => {
    const ok = await confirmDelete();
    if (!ok) return;
    deleteTeam({ param: { teamId } });
  };

  const teamList = teams?.documents ?? [];

  return (
    <>
      <CreateTeamModal />
      <DeleteDialog />

      <section className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Teams
              <span className="ml-2 text-xs font-normal text-gray-400">
                {teamList.length} {teamList.length === 1 ? "team" : "teams"}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Organize workspace members into teams.
            </p>
          </div>
          <Button
            size="sm"
            onClick={open}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 gap-1.5 text-xs"
          >
            <Plus size={13} />
            New Team
          </Button>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading teams…</div>
        ) : teamList.length === 0 ? (
          <div className="p-10 text-center">
            <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Users size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No teams yet</p>
            <p className="text-xs text-gray-400 mt-1">Create a team to group members together.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={open}
              className="mt-4 border-gray-200 gap-1.5"
            >
              <Plus size={13} />
              Create team
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {teamList.map((team: any) => (
              <div
                key={team.id}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TeamAvatar team={team} className="size-8 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{team.name}</p>
                    <p className="text-xs text-gray-400">
                      {team.memberIds?.length ?? team.members?.length ?? 0} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-7 text-xs border-gray-200 gap-1"
                  >
                    <Link href={`/workspaces/${workspaceId}/teams/${team.id || team.$id}`}>
                      Manage
                      <ArrowRight size={11} />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => handleDelete(team.id || team.$id)}
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
};
