"use client";

import { Fragment } from "react";
import Link from "next/link";
import { MoreVerticalIcon, Shield, User, UserX, Crown } from "lucide-react";

import { MemberRole } from "@/features/members/types";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useDeleteMember } from "@/features/members/api/use-delete-member";
import { useUpdateMember } from "@/features/members/api/use-update-member";
import { useWorkspaceId } from "../hooks/use-workspace-id";

import { Button } from "@/components/ui/button";
import useConfirm from "@/hooks/use-confirm";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const MembersList = () => {
  const workspaceId = useWorkspaceId();
  const [ConfirmDialog, confirm] = useConfirm(
    "Remove Member",
    "This member will be removed from the workspace. This action cannot be undone.",
    "destructive"
  );

  const { data, isLoading } = useGetMembers({ workspaceId });
  const { mutate: deleteMember, isPending: isDeletingMember } = useDeleteMember();
  const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember();

  const handleUpdateMember = (memberId: string, role: MemberRole) => {
    updateMember({ param: { memberId }, json: { role } });
  };

  const handleDeleteMember = async (memberId: string) => {
    const ok = await confirm();
    if (!ok) return;
    deleteMember({ param: { memberId } });
  };

  const members = data?.documents || [];

  return (
    <div className="h-full flex flex-col">
      <ConfirmDialog />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-1">
            {members.length} {members.length === 1 ? "member" : "members"} in this workspace
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href={`/workspaces/${workspaceId}/settings?tab=members`}>
            Invite Members
          </Link>
        </Button>
      </div>

      <div className="flex-1 border rounded-xl bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-3">No members found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.$id || member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <MemberAvatar
                        className="size-9"
                        name={member.name || member.email || ""}
                        avatarColor={member.avatarColor}
                      />
                      <span className="font-medium text-gray-900 text-sm">
                        {member.name || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {member.email || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium gap-1.5",
                        member.role === MemberRole.ADMIN
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-gray-200 bg-gray-50 text-gray-600"
                      )}
                    >
                      {member.role === MemberRole.ADMIN ? (
                        <Crown size={11} />
                      ) : (
                        <User size={11} />
                      )}
                      {member.role === MemberRole.ADMIN ? "Admin" : "Member"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVerticalIcon className="size-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="bottom" align="end" className="w-48">
                        <DropdownMenuItem
                          className="gap-2 text-sm"
                          onClick={() => handleUpdateMember(member.$id || member.id || "", MemberRole.ADMIN)}
                          disabled={isUpdatingMember || member.role === MemberRole.ADMIN}
                        >
                          <Shield className="size-4 text-amber-500" />
                          Set as Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-sm"
                          onClick={() => handleUpdateMember(member.$id || member.id || "", MemberRole.MEMBER)}
                          disabled={isUpdatingMember || member.role === MemberRole.MEMBER}
                        >
                          <User className="size-4 text-gray-500" />
                          Set as Member
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-sm text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteMember(member.$id || member.id || "")}
                          disabled={isDeletingMember}
                        >
                          <UserX className="size-4" />
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
      </div>
    </div>
  );
};
