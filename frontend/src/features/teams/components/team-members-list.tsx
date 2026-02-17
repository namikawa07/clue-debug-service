import { Trash, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useGetTeam } from "@/features/teams/api/use-get-team";
import { useRemoveTeamMember } from "@/features/teams/api/use-remove-team-member";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useState } from "react";
import { AssignMemberModal } from "@/features/teams/components/assign-member-modal";

interface TeamMembersListProps {
    teamId: string;
}

export const TeamMembersList = ({ teamId }: TeamMembersListProps) => {
    const { data: team, isLoading } = useGetTeam({ teamId });
    const { mutate: removeMember, isPending: isRemoving } = useRemoveTeamMember();
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const handleRemove = (userId: string) => {
        if (confirm("Remove this member from the team?")) {
            removeMember({ param: { teamId, userId } });
        }
    };

    if (isLoading) return <div>Loading members...</div>;

    const members = team?.members || [];

    return (
        <>
            <AssignMemberModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                teamId={teamId}
                existingMemberIds={members.map((m: any) => m.id)}
            />
            <Card className="w-full h-full border-none shadow-none">
                <CardHeader className="flex flex-row items-center justify-between p-7 space-y-0">
                    <CardTitle className="text-xl font-bold">
                        Team Members
                    </CardTitle>
                    <Button size="sm" onClick={() => setIsAssignModalOpen(true)}>
                        <UserPlus className="size-4 mr-2" />
                        Add Member
                    </Button>
                </CardHeader>
                <div className="px-7">
                    <Separator />
                </div>
                <CardContent className="p-7">
                    {members.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center">No members in this team.</p>
                    )}
                    <div className="flex flex-col gap-y-4">
                        {members.map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-x-2">
                                    <MemberAvatar
                                        name={member.name}
                                        className="size-8"
                                    />
                                    <div className="flex flex-col">
                                        <p className="text-sm font-medium">{member.name}</p>
                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemove(member.id)}
                                    disabled={isRemoving}
                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                >
                                    <Trash className="size-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    );
};
