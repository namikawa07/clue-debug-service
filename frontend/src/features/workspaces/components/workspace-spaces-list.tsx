import { Plus, LayoutGrid, Trash, Settings } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetSpaces } from "@/features/spaces/api/use-get-spaces";
import { useCreateSpaceModal } from "@/features/spaces/hooks/use-create-space-modal";

export const WorkspaceSpacesList = () => {
    const workspaceId = useWorkspaceId();
    const { open } = useCreateSpaceModal();
    const { data: spaces, isLoading } = useGetSpaces({ workspaceId });

    if (isLoading) return <div>Loading spaces...</div>;

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-7 space-y-0">
                <CardTitle className="text-xl font-bold">
                    Spaces
                </CardTitle>
                <Button size="sm" onClick={open}>
                    <Plus className="size-4 mr-2" />
                    New Space
                </Button>
            </CardHeader>
            <div className="px-7">
                <Separator />
            </div>
            <CardContent className="p-7">
                {spaces?.documents.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">No spaces created yet.</p>
                )}
                <div className="flex flex-col gap-y-4">
                    {spaces?.documents.map((space) => (
                        <div key={space.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
                            <div className="flex items-center gap-x-3">
                                <div className="size-10 rounded-md bg-indigo-100 flex items-center justify-center">
                                    <LayoutGrid className="size-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{space.name}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{space.description || "No description"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-x-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/workspaces/${workspaceId}/spaces/${space.id}`}>
                                        View
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon">
                                    <Settings className="size-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
