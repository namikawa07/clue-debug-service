"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { CreateSpaceForm } from "./create-space-form";
import { useCreateSpaceModal } from "../hooks/use-create-space-modal";

export const CreateSpaceModal = () => {
    const { isOpen, setIsOpen, close } = useCreateSpaceModal();

    return (
        <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
            <CreateSpaceForm onCancel={close} />
        </ResponsiveModal>
    );
};
