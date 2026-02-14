import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetJoinRequests } from "../api/use-get-join-requests";
import { useResolveJoinRequest } from "../api/use-resolve-join-request";

export const WorkspaceJoinRequestsList = () => {
    const workspaceId = useWorkspaceId();
    const { data: requests, isLoading } = useGetJoinRequests({ workspaceId });
    const { mutate: resolveRequest, isPending } = useResolveJoinRequest();

    const handleResolve = (requestId: string, approved: boolean) => {
        resolveRequest({ workspaceId, requestId, approved });
    };

    if (isLoading) return <div>Loading requests...</div>;

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="flex flex-row items-center gap-x-4 p-7 space-y-0">
                <CardTitle className="text-xl font-bold">
                    Join Requests
                </CardTitle>
            </CardHeader>
            <div className="px-7">
                <Separator />
            </div>
            <CardContent className="p-7">
                {requests?.documents.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">No pending join requests.</p>
                )}
                {requests?.documents.map((request, index) => (
                    <div key={request.id}>
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium">{request.user?.name || "Anonymous"}</p>
                                <p className="text-xs text-muted-foreground">{request.user?.email}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleResolve(request.id, true)}
                                    disabled={isPending}
                                    className="text-emerald-600 hover:text-emerald-700"
                                >
                                    <Check className="size-4 mr-2" />
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleResolve(request.id, false)}
                                    disabled={isPending}
                                    className="text-amber-700 hover:text-amber-800"
                                >
                                    <X className="size-4 mr-2" />
                                    Reject
                                </Button>
                            </div>
                        </div>
                        {index < requests.documents.length - 1 && (
                            <Separator className="my-2.5" />
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
