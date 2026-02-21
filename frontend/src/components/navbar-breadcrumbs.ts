/**
 * Pure breadcrumb segment builder — no React dependencies.
 * Used by Navbar and unit-tested independently.
 */

const routeLabels: Record<string, string> = {
  tasks:    "Tasks",
  spaces:   "Spaces",
  activity: "Inbox",
  members:  "Members",
  teams:    "Teams",
  notes:    "Notes",
  settings: "Settings",
  epics:    "Epics",
};

export interface BreadcrumbSegment {
  label: string;
  href: string;
}

/**
 * Build breadcrumb segments from a pathname.
 *
 * URL pattern: /w/{workspaceId}/{feature}[/{subId}/{subPage}]
 *
 * Examples:
 *   /w/ws1/tasks                         → [ Workspace, Tasks ]
 *   /w/ws1/spaces/sp1                    → [ Workspace, Spaces ]
 *   /w/ws1/spaces/sp1/settings           → [ Workspace, Spaces, Settings ]
 *   /w/ws1/spaces/sp1/epics              → [ Workspace, Spaces, Epics ]
 *   /w/ws1/spaces/sp1/epics/ep1          → [ Workspace, Spaces, Epics ]
 */
export function buildBreadcrumbs(
  pathname: string,
  workspaceId: string,
  workspace: { name: string } | null
): BreadcrumbSegment[] {
  if (!workspace) return [];

  const parts = pathname.split("/").filter(Boolean);
  // parts[0] = "w", parts[1] = workspaceId, parts[2] = feature, ...
  const segments: BreadcrumbSegment[] = [];

  // 1. Workspace segment — always links to /w/{workspaceId}
  segments.push({
    label: workspace.name,
    href: `/w/${workspaceId}`,
  });

  if (parts.length < 3) return segments;

  const feature = parts[2]; // e.g. "spaces", "tasks", "members"

  // 2. For space-scoped routes (/w/{wid}/spaces/{spaceId}/...)
  //    the "Spaces" breadcrumb should link to the CURRENT space, not the list.
  if (feature === "spaces" && parts.length >= 4) {
    const spaceId = parts[3];
    const spaceHref = `/w/${workspaceId}/spaces/${spaceId}`;

    segments.push({
      label: routeLabels.spaces,
      href: spaceHref,
    });

    // Sub-page inside a space (settings, epics, tasks, teams, notes)
    if (parts.length >= 5 && routeLabels[parts[4]]) {
      segments.push({
        label: routeLabels[parts[4]],
        href: `/w/${workspaceId}/spaces/${spaceId}/${parts[4]}`,
      });
    }

    return segments;
  }

  // 3. Top-level feature pages (tasks, members, teams, notes, settings…)
  const label = routeLabels[feature] || (feature.charAt(0).toUpperCase() + feature.slice(1));
  segments.push({
    label,
    href: `/${parts.slice(0, 3).join("/")}`,
  });

  // 4. Deep sub-page under a top-level feature (e.g. /w/{wid}/tasks/{taskId})
  if (parts.length >= 5 && routeLabels[parts[4]]) {
    segments.push({
      label: routeLabels[parts[4]],
      href: pathname,
    });
  }

  return segments;
}
