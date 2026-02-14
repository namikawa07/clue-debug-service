import { Loader } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetSpaces } from "@/features/spaces/api/use-get-spaces";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { CreateTaskForm } from "./create-task-form";
import { useSpaceId } from "@/features/spaces/hooks/use-space-id";

interface CreateTaskFormWrapperProps {
    onCancel: () => void;
};

export const CreateTaskFormWrapper = ({
    onCancel
}: CreateTaskFormWrapperProps) => {
    const workspaceId = useWorkspaceId();
    const spaceId = useSpaceId();

    const { data: spaces, isLoading: isLoadingSpaces } = useGetSpaces({ workspaceId });
    const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });

    const spaceOptions = spaces?.documents.map((space) => ({
        id: space.id,
        name: space.name,
        imageUrl: space.imageUrl || space.image_url || ''
    })) || [];

    const memberOptions = members?.documents.map((member: any) => ({
        id: member.id,
        name: member.name || member.email || '',
        avatarColor: member.avatarColor || member.avatar_color,
    })) || [];

    const isLoading = isLoadingSpaces || isLoadingMembers;

    if (isLoading) {
        return (
            <Card className="w-full h-[714px] border-none shadow-none">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader className="size-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <CreateTaskForm
            onCancel={onCancel}
            spaceOptions={spaceOptions}
            memberOptions={memberOptions}
            initialSpaceId={spaceId}
        />
    );
};