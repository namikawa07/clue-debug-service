"use client";

import { useState } from "react";
import { useSpaceId } from "@/features/spaces/hooks/use-space-id";
import { useGetSpace } from "@/features/spaces/api/use-get-space";
import { EditSpaceForm } from "@/features/spaces/components/edit-space-form";
import { CreateEpicForm } from "@/features/epics/components/create-epic-form";
import { PageLoader } from "@/components/page-loader";
import { PageError } from "@/components/page-error";
import { cn } from "@/lib/utils";
import { Settings, BookMarked, ChevronRight } from "lucide-react";

const SECTIONS = [
  { id: "general", label: "General",  icon: Settings,    desc: "Space name & icon" },
  { id: "epics",   label: "Epics",    icon: BookMarked,  desc: "Manage space epics" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export const SpaceSettingsClient = () => {
  const spaceId = useSpaceId();
  const { data: space, isLoading } = useGetSpace({ spaceId });
  const [activeSection, setActiveSection] = useState<SectionId>("general");

  if (isLoading) return <PageLoader />;
  if (!space) return <PageError message="Space not found" />;

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
      <div className="hidden lg:block w-48 shrink-0">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Space Settings
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
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-900">{activeInfo.label}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{activeInfo.desc}</p>
        </div>

        {activeSection === "general" && <EditSpaceForm initialValues={space} />}
        {activeSection === "epics"   && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Create Epic</h3>
            <CreateEpicForm />
          </div>
        )}
      </div>
    </div>
  );
};
