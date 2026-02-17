import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useAddTeamMember } from "@/features/teams/api/use-add-team-member";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface AssignMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    existingMemberIds: string[];
}

export const AssignMemberModal = ({
    isOpen,
    onClose,
    teamId,
    existingMemberIds
}: AssignMemberModalProps) => {
    const workspaceId = useWorkspaceId();
    const { data: workspaceMembers } = useGetMembers({ workspaceId });
    const { mutate: addMember, isPending } = useAddTeamMember();
    const [search, setSearch] = useState("");

    const availableMembers = workspaceMembers?.documents.filter(
        (m: any) => !existingMemberIds.includes(m.userId) && !existingMemberIds.includes(m.id)
    ) || [];

    const filteredMembers = availableMembers.filter((m: any) =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = (userId: string) => {
        addMember({ param: { teamId, userId } }, {
            onSuccess: () => {
                // Keep modal open for more? Or close?
                // User said "Assign members to Teams" - singular/plural loop.
                // For now, I'll close it to show success.
                // Actually, staying open allows adding multiple.
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Team Members</DialogTitle>
                </DialogHeader>
                <div className="relative">
                    <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search workspace members..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <ScrollArea className="h-[300px] mt-4">
                    <div className="flex flex-col gap-y-2">
                        {filteredMembers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No available members found.
                            </p>
                        )}
                        {filteredMembers.map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition">
                                <div className="flex items-center gap-x-2">
                                    <MemberAvatar name={member.name} className="size-8" />
                                    <div className="flex flex-col">
                                        <p className="text-sm font-medium">{member.name}</p>
                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAdd(member.userId || member.id)}
                                    disabled={isPending}
                                >
                                    Add
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="flex justify-end mt-4">
                    <Button variant="secondary" onClick={onClose}>
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
