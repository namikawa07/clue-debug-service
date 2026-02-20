import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

import { TaskStatus } from "../types";

export const useTaskFilters = () => {
    return useQueryStates({
        spaceId: parseAsString,
        status: parseAsStringEnum(Object.values(TaskStatus)),
        assigneeId: parseAsString,
        creatorId: parseAsString,
        search: parseAsString,
        dueDate: parseAsString,
    });
};