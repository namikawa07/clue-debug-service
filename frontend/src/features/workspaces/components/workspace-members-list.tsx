"use client";

import { CopyIcon, Crown, RefreshCw, Shield, User, UserX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useDeleteMember } from "@/features/members/api/use-delete-member";
import { useUpdateMember } from "@/features/members/api/use-update-member";
import { MemberRole } from "@/features/members/types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useResetInviteCode } from "@/features/workspaces/api/use-reset-invite-code";
import { cn } from "@/lib/utils";
import useConfirm from "@/hooks/use-confirm";

export const WorkspaceMembersList = () => {
  const workspaceId = useWorkspaceId();
  const { data: workspace } = useGetWorkspace({ workspaceId });
  const { data: members, isLoading } = useGetMembers({ workspaceId });
  const { mutate: deleteMember, isPending: isDeletingMember } = useDeleteMember();
  const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember();
  const { mutate: resetInviteCode, isPending: isResetting } = useResetInviteCode();

  const [RemoveDialog, confirmRemove] = useConfirm(
    "Remove Member",
    "This member will lose access to the workspace immediately.",
    "destructive"
  );
  const [ResetDialog, confirmReset] = useConfirm(
    "Reset Invite Code",
    "All existing invite links will be invalidated. Current members are not affected.",
  );

  const handleUpdateRole = (memberId: string, role: MemberRole) => {
    updateMember({ param: { memberId }, json: { role } });
  };

  const handleDeleteMember = async (memberId: string) => {
    const ok = await confirmRemove();
    if (!ok) return;
    deleteMember({ param: { memberId } });
  };

  const handleResetInviteCode = async () => {
    const ok = await confirmReset();
    if (!ok) return;
    resetInviteCode({ param: { workspaceId } });
  };

  const fullInviteLink = typeof window !== "undefined" && workspace?.invite_code
    ? `${window.location.origin}/workspaces/${workspaceId}/join/${workspace.invite_code}`
    : "";

  const handleCopyInviteLink = () => {
    if (!fullInviteLink) return;
    navigator.clipboard
      .writeText(fullInviteLink)
      .then(() => toast.success("Invite link copied to clipboard"))
      .catch(() => toast.error("Failed to copy"));
  };

  const memberList = members?.documents ?? [];

  return (
    <div className="flex flex-col gap-5">
      <RemoveDialog />
      <ResetDialog />

      {/* ── Invite link ── */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Invite Link</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Share this link so people can request to join the workspace.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={isResetting}
            onClick={handleResetInviteCode}
            className="h-8 text-xs text-gray-500 hover:text-gray-700 gap-1.5 shrink-0"
          >
            <RefreshCw size={12} className={isResetting ? "animate-spin" : ""} />
            Reset link
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            readOnly
            value={fullInviteLink}
            className="h-9 bg-gray-50 border-gray-200 text-sm text-gray-600 font-mono focus-visible:ring-0"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyInviteLink}
            className="h-9 shrink-0 border-gray-200 gap-1.5"
          >
            <CopyIcon size={14} />
            Copy
          </Button>
        </div>
      </section>

      {/* ── Members table ── */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Members
              <span className="ml-2 text-xs font-normal text-gray-400">
                {memberList.length} {memberList.length === 1 ? "person" : "people"}
              </span>
            </h3>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading members…</div>
        ) : memberList.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No members yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="w-12 px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {memberList.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <MemberAvatar
                        className="size-8"
                        name={member.name || member.email || ""}
                        avatarColor={member.avatarColor}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {member.name || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-500">
                    {member.email || "—"}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs gap-1 font-medium",
                        member.role === MemberRole.ADMIN
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-gray-200 bg-gray-50 text-gray-600"
                      )}
                    >
                      {member.role === MemberRole.ADMIN
                        ? <Crown size={10} />
                        : <User size={10} />
                      }
                      {member.role === MemberRole.ADMIN ? "Admin" : "Member"}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          className="gap-2 text-sm"
                          onClick={() => handleUpdateRole(member.id, MemberRole.ADMIN)}
                          disabled={isUpdatingMember || member.role === MemberRole.ADMIN}
                        >
                          <Shield size={13} className="text-amber-500" />
                          Set as Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-sm"
                          onClick={() => handleUpdateRole(member.id, MemberRole.MEMBER)}
                          disabled={isUpdatingMember || member.role === MemberRole.MEMBER}
                        >
                          <User size={13} className="text-gray-400" />
                          Set as Member
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-sm text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={isDeletingMember}
                        >
                          <UserX size={13} />
                          Remove from workspace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
