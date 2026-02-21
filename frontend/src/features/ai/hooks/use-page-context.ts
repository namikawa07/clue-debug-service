import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";

export interface PageContext {
    pageName: string;
    workspaceId: string | null;
    spaceId: string | null;
    epicId: string | null;
    taskId: string | null;
}

/**
 * Extracts the current page context from the URL so the AI agent
 * knows where the user is and can take contextual actions.
 *
 * URL pattern: /w/[workspaceId]/spaces/[spaceId]/epics/[epicId]
 */
export const usePageContext = (): PageContext => {
    const pathname = usePathname();
    const params = useParams();

    const workspaceId = (params?.workspaceId as string) || null;
    const spaceId = (params?.spaceId as string) || null;
    const epicId = (params?.epicId as string) || null;
    const taskId = (params?.taskId as string) || null;

    const pageName = resolvePageName(pathname, { spaceId, epicId, taskId });

    return { pageName, workspaceId, spaceId, epicId, taskId };
};

function resolvePageName(
    pathname: string | null,
    ids: { spaceId: string | null; epicId: string | null; taskId: string | null }
): string {
    if (!pathname) return "dashboard";

    // Order matters — most specific first
    if (ids.taskId) return "task-detail";
    if (ids.epicId) return "epic-detail";
    if (pathname.includes("/epics")) return "epics-list";
    if (pathname.includes("/settings")) return "settings";
    if (pathname.includes("/teams")) return "teams";
    if (pathname.includes("/notes")) return "notes";
    if (pathname.includes("/tasks")) return "tasks-list";
    if (pathname.includes("/members")) return "members";
    if (ids.spaceId) return "space-overview";
    if (pathname.includes("/spaces")) return "spaces";
    return "dashboard";
}
