import { Plus, Users, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetTeams } from "@/features/teams/api/use-get-teams";
import { useDeleteTeam } from "@/features/teams/api/use-delete-team";
import { useCreateTeamModal } from "@/features/teams/hooks/use-create-team-modal";

export const WorkspaceTeamsList = () => {
    const workspaceId = useWorkspaceId();
    const { open } = useCreateTeamModal();
    const { data: teams, isLoading } = useGetTeams({ workspaceId });
    const { mutate: deleteTeam, isPending: isDeleting } = useDeleteTeam();

    const handleDelete = async (teamId: string) => {
        const ok = await confirm("Are you sure you want to delete this team?");
        if (!ok) return;
        deleteTeam({ param: { teamId } });
    };

    if (isLoading) return <div>Loading teams...</div>;

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-7 space-y-0">
                <CardTitle className="text-xl font-bold">
                    Teams
                </CardTitle>
                <Button size="sm" onClick={open}>
                    <Plus className="size-4 mr-2" />
                    New Team
                </Button>
            </CardHeader>
            <div className="px-7">
                <Separator />
            </div>
            <CardContent className="p-7">
                {teams?.documents.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">No teams created yet.</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams?.documents.map((team) => (
                        <Card key={team.id} className="relative group">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                    <Users className="size-6 text-blue-600" />
                                </div>
                                <p className="font-semibold">{team.name}</p>
                                <p className="text-xs text-muted-foreground truncate w-full">{team.description || "No description"}</p>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-rose-500"
                                    onClick={() => handleDelete(team.id)}
                                    disabled={isDeleting}
                                >
                                    <Trash className="size-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
