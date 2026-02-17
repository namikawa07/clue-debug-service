export interface UserResponse {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export type Team = {
  id: string;
  name: string;
  workspace_id: string;
  description?: string;
  imageUrl?: string;
  memberIds?: string[];
  members?: UserResponse[];
  color?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy support
  $id: string;
  workspaceId: string;
  $createdAt?: string;
  $updatedAt?: string;
};
