"use client";

import { useState } from "react";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { EditWorkspaceForm } from "@/features/workspaces/components/edit-workspace-form";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { WorkspaceSpacesList } from "@/features/workspaces/components/workspace-spaces-list";
import { WorkspaceMembersList } from "@/features/workspaces/components/workspace-members-list";
import { WorkspaceTeamsList } from "@/features/workspaces/components/workspace-teams-list";
import { WorkspaceJoinRequestsList } from "@/features/workspaces/components/workspace-join-requests-list";
import { cn } from "@/lib/utils";
import {
  Settings,
  LayoutGrid,
  Users,
  UserCheck,
  Shield,
  ChevronRight,
} from "lucide-react";

const SECTIONS = [
  { id: "general",  label: "General",       icon: Settings,    desc: "Workspace name & icon" },
  { id: "members",  label: "Members",        icon: Users,       desc: "Manage access & roles" },
  { id: "spaces",   label: "Spaces",         icon: LayoutGrid,  desc: "All workspace spaces" },
  { id: "teams",    label: "Teams",          icon: UserCheck,   desc: "Organize your team" },
  { id: "requests", label: "Join Requests",  icon: Shield,      desc: "Pending access requests" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export const WorkspaceIdSettingsClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: initialValues, isLoading } = useGetWorkspace({ workspaceId });
  const [activeSection, setActiveSection] = useState<SectionId>("general");

  if (isLoading) return <PageLoader />;
  if (!initialValues) return <PageError message="Workspace not found" />;

  const activeInfo = SECTIONS.find((s) => s.id === activeSection)!;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* ── Mobile: horizontal tab bar ── */}
      <div className="lg:hidden flex gap-1 overflow-x-auto pb-1 border-b border-gray-200 mb-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap shrink-0 transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Icon size={14} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* ── Desktop: left sidebar nav ── */}
      <div className="hidden lg:block w-52 shrink-0">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Settings
            </p>
          </div>
          <nav className="p-2 space-y-0.5">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left group",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon
                    size={15}
                    className={cn(
                      "shrink-0",
                      isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  <span className="truncate">{section.label}</span>
                  {isActive && (
                    <ChevronRight size={13} className="ml-auto text-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">
        {/* Section header */}
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-900">{activeInfo.label}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{activeInfo.desc}</p>
        </div>

        {/* Content */}
        {activeSection === "general"  && <EditWorkspaceForm initialValues={initialValues} />}
        {activeSection === "spaces"   && <WorkspaceSpacesList />}
        {activeSection === "members"  && <WorkspaceMembersList />}
        {activeSection === "teams"    && <WorkspaceTeamsList />}
        {activeSection === "requests" && <WorkspaceJoinRequestsList />}
      </div>
    </div>
  );
};
