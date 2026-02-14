"use client";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { EditWorkspaceForm } from "@/features/workspaces/components/edit-workspace-form";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

import { WorkspaceSpacesList } from "@/features/workspaces/components/workspace-spaces-list";
import { WorkspaceMembersList } from "@/features/workspaces/components/workspace-members-list";
import { WorkspaceTeamsList } from "@/features/workspaces/components/workspace-teams-list";
import { WorkspaceJoinRequestsList } from "@/features/workspaces/components/workspace-join-requests-list";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const WorkspaceIdSettingsClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: initialValues, isLoading } = useGetWorkspace({ workspaceId });

  if (isLoading) {
    return <PageLoader />;
  }

  if (!initialValues) {
    return <PageError message="Workspace not found" />;
  }

  return (
    <div className="w-full flex flex-col gap-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="spaces">Spaces</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="requests">Join Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <div className="w-full lg:max-w-xl">
            <EditWorkspaceForm initialValues={initialValues} />
          </div>
        </TabsContent>

        <TabsContent value="spaces" className="mt-4">
          <WorkspaceSpacesList />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <WorkspaceMembersList />
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          <WorkspaceTeamsList />
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <WorkspaceJoinRequestsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};
