
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

export interface DispatchCollaborator {
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

export interface DispatchDocument {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: any; // Replace with actual structure once known
  folder?: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  is_archived: boolean;
  created_by: string; // UUID of creator
  collaborators: DispatchCollaborator[];
}

