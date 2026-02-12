"use client";

import { CreateEpicForm } from "@/features/epics/components/create-epic-form";
import { useProjectId } from "@/features/projects/hooks/use-project-id";

export const ProjectSettingsClient = () => {
    const projectId = useProjectId();

    return (
        <div className="w-full lg:max-w-xl">
            <CreateEpicForm />
        </div>
    );
};
