"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { useGetSpaces } from "@/features/spaces/api/use-get-spaces";
import { useLastSpace } from "@/features/spaces/hooks/use-last-space";
import { routes } from "@/lib/routes";
import { PageLoader } from "@/components/page-loader";

interface SpaceRedirectProps {
  buildPath: (workspaceId: string, spaceId: string) => string;
}

/**
 * Redirects old workspace-level routes to space-scoped equivalents.
 * Gets last-used space and redirects to: last-used → "Common Space" → first space
 */
export const SpaceRedirect = ({ buildPath }: SpaceRedirectProps) => {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { data: spacesData, isLoading } = useGetSpaces({ workspaceId });
  const lastSpace = useLastSpace(workspaceId);

  useEffect(() => {
    if (isLoading || !spacesData) return;

    const spaces = spacesData.documents ?? [];
    if (spaces.length === 0) return;

    // Priority: last-used → "Common Space" → first space
    const lastId = lastSpace.get();
    const lastExists = lastId && spaces.some((s: any) => (s.$id ?? s.id) === lastId);
    const commonSpace = spaces.find((s: any) => s.name === "Common Space");
    const targetSpaceId =
      lastExists
        ? lastId!
        : commonSpace
        ? (commonSpace.$id ?? commonSpace.id)
        : (spaces[0].$id ?? spaces[0].id);

    const targetPath = buildPath(workspaceId, targetSpaceId);
    router.replace(targetPath);
  }, [spacesData, isLoading, workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <PageLoader />;
};
