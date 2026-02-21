import { Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetTeam } from "@/features/teams/api/use-get-team";
import { useRemoveTeamMember } from "@/features/teams/api/use-remove-team-member";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useState } from "react";
import { AssignMemberModal } from "@/features/teams/components/assign-member-modal";
import useConfirm from "@/hooks/use-confirm";

interface TeamMembersListProps {
    teamId: string;
}

export const TeamMembersList = ({ teamId }: TeamMembersListProps) => {
    const { data: team, isLoading } = useGetTeam({ teamId });
    const { mutate: removeMember, isPending: isRemoving } = useRemoveTeamMember();
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [RemoveDialog, confirmRemove] = useConfirm(
        "Remove Member",
        "This member will be removed from the team. They will still have access to the workspace.",
        "destructive"
    );

    const handleRemove = async (memberId: string) => {
        const ok = await confirmRemove();
        if (!ok) return;
        removeMember({ param: { teamId, memberId } });
    };

    const members = team?.members || [];

    return (
        <>
            <RemoveDialog />
            <AssignMemberModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                teamId={teamId}
                existingMemberIds={members.map((m: any) => m.id)}
            />

            <section className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                            Members
                            <span className="ml-2 text-xs font-normal text-gray-400">
                                {members.length} {members.length === 1 ? "person" : "people"}
                            </span>
                        </h3>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-8 gap-1.5 text-xs"
                    >
                        <UserPlus size={13} />
                        Add Member
                    </Button>
                </div>

                {isLoading ? (
                    <div className="p-10 text-center text-sm text-gray-400">Loading members…</div>
                ) : members.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-gray-500">No members yet</p>
                        <p className="text-xs text-gray-400 mt-1">Add members to this team to get started.</p>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsAssignModalOpen(true)}
                            className="mt-4 border-gray-200 gap-1.5"
                        >
                            <UserPlus size={13} />
                            Add first member
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {members.map((member: any) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <MemberAvatar
                                        name={member.name || member.email || ""}
                                        className="size-8 shrink-0"
                                        avatarColor={member.avatarColor}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {member.name || "Unknown"}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">{member.email}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemove(member.id)}
                                    disabled={isRemoving}
                                    className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                                >
                                    <Trash2 size={13} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
};
