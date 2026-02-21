import { useQueryState, parseAsBoolean } from "nuqs";

export const useCreateEpicModal = () => {
    const [isOpen, setIsOpen] = useQueryState(
        "create-epic",
        parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
    );

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    return {
        isOpen,
        open,
        close,
        setIsOpen,
    };
};
