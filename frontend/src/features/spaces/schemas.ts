import { z } from "zod";

export const createSpaceSchema = z.object({
    name: z.string().trim().min(1, "Required"),
    image: z
        .union([
            z.instanceof(File),
            z.string().transform((value) => (value === "" ? undefined : value)),
        ])
        .optional(),
    workspaceId: z.string(),
    teamId: z.string().optional(),
});

export const updateSpaceSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Must be 1 or more characters")
        .optional(),
    image: z
        .union([
            z.instanceof(File),
            z.string().transform((value) => (value === "" ? undefined : value)),
        ])
        .optional(),
    teamId: z.string().optional(),
});
