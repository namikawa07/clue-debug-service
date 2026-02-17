import { CopyIcon, MoreVertical, RefreshCw, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useDeleteMember } from "@/features/members/api/use-delete-member";
import { useUpdateMember } from "@/features/members/api/use-update-member";
import { MemberRole } from "@/features/members/types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useResetInviteCode } from "@/features/workspaces/api/use-reset-invite-code";

export const WorkspaceMembersList = () => {
    const workspaceId = useWorkspaceId();
    const { data: workspace } = useGetWorkspace({ workspaceId });
    const { data: members, isLoading } = useGetMembers({ workspaceId });
    const { mutate: deleteMember, isPending: isDeletingMember } = useDeleteMember();
    const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember();
    const { mutate: resetInviteCode, isPending: isResetting } = useResetInviteCode();

    const handleUpdateRole = (memberId: string, role: MemberRole) => {
        updateMember({ param: { memberId }, json: { role } });
    };

    const handleDeleteMember = async (memberId: string) => {
        const ok = await confirm("Are you sure you want to remove this member?");
        if (!ok) return;

        deleteMember({ param: { memberId } });
    };

    const handleCopyInviteLink = () => {
        const fullInviteLink = `${window.location.origin}/workspaces/${workspaceId}/join/${workspace.invite_code}`;
        navigator.clipboard.writeText(fullInviteLink)
            .then(() => toast.success("Invite link copied to clipboard"));
    };

    const handleResetInviteCode = async () => {
        const ok = await confirm("Are you sure you want to reset the invite code? All existing links will be invalidated.");
        if (!ok) return;

        resetInviteCode({ param: { workspaceId } });
    };

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-7 space-y-0">
                <CardTitle className="text-xl font-bold">
                    Members list
                </CardTitle>
                <div className="flex items-center gap-x-2">
                    <Button variant="secondary" size="sm" onClick={handleCopyInviteLink}>
                        <CopyIcon className="size-4 mr-2" />
                        Copy Link
                    </Button>
                </div>
            </CardHeader>
            <div className="px-7 pb-4">
                <div className="bg-gray-50 border rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Workspace Invite Code</p>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleResetInviteCode}
                            disabled={isResetting}
                            title="Reset Code"
                        >
                            <RefreshCw className="size-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-x-2">
                        <Input
                            readOnly
                            value={workspace?.invite_code || ""}
                            className="bg-white border-none focus-visible:ring-0 shadow-sm"
                        />
                        <Button variant="outline" size="sm" onClick={handleCopyInviteLink}>
                            Copy
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Use this code or link to invite new members to the workspace.
                    </p>
                </div>
            </div>
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
