import { MoreVertical, ShieldAlert, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useDeleteMember } from "@/features/members/api/use-delete-member";
import { useUpdateMember } from "@/features/members/api/use-update-member";
import { MemberRole } from "@/features/members/types";
import { MemberAvatar } from "@/features/members/components/member-avatar";

export const WorkspaceMembersList = () => {
    const workspaceId = useWorkspaceId();
    const { data: members, isLoading } = useGetMembers({ workspaceId });
    const { mutate: deleteMember, isPending: isDeletingMember } = useDeleteMember();
    const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember();

    const handleUpdateRole = (memberId: string, role: MemberRole) => {
        updateMember({ param: { memberId }, json: { role } });
    };

    const handleDeleteMember = async (memberId: string) => {
        const ok = await confirm("Are you sure you want to remove this member?");
        if (!ok) return;

        deleteMember({ param: { memberId } });
    };

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="flex flex-row items-center gap-x-4 p-7 space-y-0">
                <CardTitle className="text-xl font-bold">
                    Members list
                </CardTitle>
            </CardHeader>
            <div className="px-7">
                <Separator />
            </div>
            <CardContent className="p-7">
                {members?.documents.map((member, index) => (
                    <div key={member.id}>
                        <div className="flex items-center gap-2">
                            <MemberAvatar
                                className="size-10"
                                name={member.name}
                                fallbackClassName="text-lg"
                                avatarColor={member.avatarColor}
                            />
                            <div className="flex flex-col">
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-md font-semibold text-gray-600">
                                    {member.role}
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="ml-auto"
                                        >
                                            <MoreVertical className="size-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="bottom" align="end">
                                        <DropdownMenuItem
                                            className="font-medium"
                                            onClick={() => handleUpdateRole(member.id, MemberRole.ADMIN)}
                                            disabled={isUpdatingMember || member.role === MemberRole.ADMIN}
                                        >
                                            Set as Administrator
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="font-medium"
                                            onClick={() => handleUpdateRole(member.id, MemberRole.MEMBER)}
                                            disabled={isUpdatingMember || member.role === MemberRole.MEMBER}
                                        >
                                            Set as Member
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="font-medium text-amber-700"
                                            onClick={() => handleDeleteMember(member.id)}
                                            disabled={isDeletingMember}
                                        >
                                            Remove {member.name}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        {index < members.documents.length - 1 && (
                            <Separator className="my-2.5" />
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
