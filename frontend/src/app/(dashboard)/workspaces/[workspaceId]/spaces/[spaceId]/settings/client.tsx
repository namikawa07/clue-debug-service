"use client";

import { CreateEpicForm } from "@/features/epics/components/create-epic-form";
import { useSpaceId } from "@/features/spaces/hooks/use-space-id";

export const SpaceSettingsClient = () => {
    const spaceId = useSpaceId();

    return (
        <div className="w-full lg:max-w-xl">
            <CreateEpicForm />
        </div>
    );
};
