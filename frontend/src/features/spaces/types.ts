import { Models } from "node-appwrite";

export type Space = Models.Document & {
    name: string;
    workspaceId: string;
    imageUrl?: string;
    teamId?: string;
    // Legacy support for Appwrite document fields
    id: string;
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    $collectionId?: string;
    $databaseId?: string;
    $permissions?: string[];
};
