export type Space = {
    id: string;
    name: string;
    description?: string;
    workspace_id: string;
    imageUrl?: string;
    image_url?: string;
    moderator_id?: string;
    // Legacy support
    workspaceId: string;
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    $collectionId?: string;
    $databaseId?: string;
    $permissions?: string[];
};
