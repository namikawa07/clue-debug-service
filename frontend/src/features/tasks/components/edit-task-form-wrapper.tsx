import { Loader } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetSpaces } from "@/features/spaces/api/use-get-spaces";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { EditTaskForm } from "./edit-task-form";

import { useGetTask } from "../api/use-get-task";

interface EditTaskFormWrapperProps {
    onCancel: () => void;
    id: string;
};

export const EditTaskFormWrapper = ({
    onCancel,
    id
}: EditTaskFormWrapperProps) => {
    const workspaceId = useWorkspaceId();

    const { data: initialValues, isLoading } = useGetTask({ taskId: id });

    const { data: Spaces, isLoading: isLoadingSpaces } = useGetSpaces({ workspaceId });
    const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });

    const projectOptions = Spaces?.documents.map((project) => ({
        id: project.id,
        name: project.name,
        imageUrl: project.imageUrl || project.image_url || ''
    })) || [];

    const memberOptions = members?.documents.map((member: any) => ({
        id: member.id,
        name: member.name || member.email || '',
        avatarColor: member.avatarColor || member.avatar_color,
    })) || [];

    const loading = isLoading || isLoadingSpaces || isLoadingMembers;

    if (loading) {
        return (
            <Card className="w-full h-[714px] border-none shadow-none">
                <CardContent className="flex items-center justify-center h-full">
                    <Loader className="size-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (!initialValues) {
        return null;
    }

    return (
        <EditTaskForm
            onCancel={onCancel}
            initialValues={initialValues}
            spaceOptions={projectOptions}
            memberOptions={memberOptions}
        />
    );
};