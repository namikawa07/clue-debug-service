"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateEpicForm } from "./create-epic-form";

import { useCreateEpicModal } from "../hooks/use-create-epic-modal";

export const CreateEpicModal = () => {
    const { isOpen, setIsOpen, close } = useCreateEpicModal();

    return (
        <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
            <CreateEpicForm onCancel={close} />
        </ResponsiveModal>
    );
};
