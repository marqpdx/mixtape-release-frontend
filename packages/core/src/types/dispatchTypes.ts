export type TipTapDoc = {
  type?: string;
  content?: any[];
};

// User type (minimal for collaboration)
export interface CollaboratorUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

// Collaborator roles
export type CollaboratorRole = 'editor' | 'commenter';

export interface DispatchCollaborator {
  id: number;
  user: CollaboratorUser;
  invited_by: CollaboratorUser | null;
  role: CollaboratorRole;
  role_display: string;
  created_at: string;
}

// DispatchContent (collaborative infrastructure)
export interface DispatchContent {
  id: string;  // UUID
  yjs_document_id: string;  // UUID

  // Collaborators
  collaborators: CollaboratorUser[];
  collaborator_details: DispatchCollaborator[];
  collaborator_count: number;
  editor_count: number;
  commenter_count: number;

  // Content snapshot
  content_snapshot: TipTapDoc;
  snapshot_updated_at: string | null;

  // Yjs state
  yjs_state_updated_at: string | null;
  last_edited_by: CollaboratorUser | null;
  last_edited_at: string | null;

  // Lifecycle
  is_archived: boolean;
  is_active: boolean;

  // Rescind capability
  can_be_rescinded: boolean;
  has_collaborative_edits: boolean;
  created_by: CollaboratorUser | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Collaboration status response
export interface CollaborationStatus {
  is_collaborative: boolean;
  dispatch_content: DispatchContent | null;
}

// Request types
export interface EnableCollaborationRequest {
  collaborators?: Array<{
    user_id: number;
    role: CollaboratorRole;
  }>;
}

export interface AddCollaboratorsRequest {
  user_ids: number[];
  role: CollaboratorRole;
}

export interface RemoveCollaboratorsRequest {
  user_ids: number[];
}

// Collaborator profile for dispatch documents
export interface DispatchCollaboratorProfile {
  id: string;
  display_name: string;
  profile_image: string;
  background_image: string;
  slug: string;
  quick_intro: string;
  bio: string;
  avatar: string;
  created_at: string;
  updated_at: string;
  profile_image_visibility: string;
  background_image_visibility: string;
}

// Extended collaborator with full user info
export interface DispatchCollaboratorFull {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  roles: string[];
  date_joined: string;
  last_login: string | null;
  profile: DispatchCollaboratorProfile;
}

// Dispatch document
export interface DispatchDocument {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: any;
  folder?: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  is_archived: boolean;
  created_by: string; // UUID of creator
  collaborators: DispatchCollaboratorFull[];
}