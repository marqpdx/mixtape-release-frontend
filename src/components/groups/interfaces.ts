// src/components/groups/interfaces.ts

// TODO clean this file up - remove legacy interfaces and comments

import {
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconHourglass,
} from "@tabler/icons-react";
import { Group, GroupMembership, GroupStatus, GroupType, GroupVisibility } from "content/groupTypes";

// import { Group, GroupMembership } from "content/groupTypes";

// Main Group interface matching backend response
// export interface Group {
//   id: string;
//   visibility_display: string;
//   group_type_display: string;
//   members: GroupMembership[];
//   created_at: string;
//   updated_at: string;
//   slug: string;
//   summary: string;
//   title: string;
//   sponsor_object_id: string;
//   author_name: string;
//   body: string;
//   status: "draft" | "published" | "archived";
//   published_at: string | null;
//   display_layout: "classic" | "modern" | "minimal";
//   description: string;
//   group_type: "community" | "circle";
//   profile_image: string | null;
//   background_image: string | null;
//   visibility: "public" | "invite_only" | "private" | "hidden";
//   submitted_by: string;
//   sponsor_content_type: number;
//   author: string;
//   member_count?: number; // Computed field, may not always be present
// }

// Backend User Profile interface
// export interface BackendUserProfile {
//   id: string;
//   display_name: string;
//   profile_image: string;
//   background_image: string;
//   slug: string;
//   quick_intro: string;
//   bio_json: Record<string, any>;
//   bio_markdown: string;
//   avatar: string;
//   created_at: string;
//   updated_at: string;
//   profile_image_visibility: "public" | "members" | "admins";
//   background_image_visibility: "public" | "members" | "admins";
// }

// // Backend User interface
// export interface BackendUser {
//   id: string;
//   username: string;
//   email: string;
//   first_name: string;
//   last_name: string;
//   is_active: boolean;
//   is_staff: boolean;
//   is_superuser: boolean;
//   roles: string[];
//   date_joined: string;
//   last_login: string | null;
//   profile: BackendUserProfile;
// }

// Group Membership interface (matching backend structure)
// export interface GroupMembership {
//   id: number;
//   group: string; // UUID of the group
//   role: string;
//   is_active: boolean;
//   is_pending: boolean;
//   date_joined: string;
//   member_type: "customuser" | "group";
//   member_data: BackendUser | Group;
// }

// Group Invitation interface
export interface GroupInvitation {
  id: number;
  invited_email: string;
  invited_by?: {
    id: number;
    username: string;
    email: string;
  } | null;
  group: number;
  message: string;
  invitation_status: "pending" | "joined" | "declined" | "expired";
  created_at: string;
  expires_at?: string | null;
  updated_at: string;
}

// Legacy interfaces (keeping for compatibility)
// export interface MemberProfile {
//   id: number;
//   name: string;
//   profile_image: string;
//   background_image: string;
//   quick_intro: string;
//   bio: string;
//   avatar: string;
//   created: string;
//   updated: string;
//   profile_image_visibility: string;
//   background_image_visibility: string;
// }

// export interface MemberUser {
//   id: number;
//   username: string;
//   email: string;
//   first_name: string;
//   last_name: string;
//   is_active: boolean;
//   is_staff: boolean;
//   is_superuser: boolean;
//   roles: string[];
//   date_joined: string;
//   last_login: string | null;
//   profile: MemberProfile;
// }

// export interface Member {
//   id: number;
//   user: MemberUser;
//   role: string;
//   date_joined: string;
//   status: string;
//   last_active: string | null;
// }

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription_status: 'subscribed' | 'unsubscribed' | 'pending' | 'never_invited';
  invited_at?: string;
}

// Asset interfaces
export interface ImageFields {
  exif_data?: Record<string, any> | null;
}

export interface VideoFields {
  duration_seconds?: number;
  resolution?: string;
  codec?: string;
}

export interface DocumentFields {
  page_count?: number;
  author?: string;
}

export interface AudioFields {
  duration_seconds?: number;
  bitrate?: number;
  codec?: string;
}

export interface Asset {
  id: string;
  type: string;
  content_type: string;
  object_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  folder_path?: string;
  upload_status: "queued" | "completed" | "failed";
  created: string;
  privacy: "public" | "partners" | "members" | "admins";
  image_fields?: ImageFields;
  video_fields?: VideoFields;
  document_fields?: DocumentFields;
  audio_fields?: AudioFields;
}

export interface GroupAsset {
  id: string;
  group: string;
  title: string;
  description: string;
  asset: Asset;
  uploaded_by?: string;
  is_featured?: boolean;
  sort_order?: number;
  is_deleted?: boolean;
}

export interface AssetTypeOption {
  label: string;
  value: string;
}

export interface SelectItem<T = string> {
  label: string;
  value: T;
}

// User interfaces for other contexts
export interface UserProfile {
  name: string;
  avatar?: string | null;
  bio?: string;
  location?: string;
  keywords?: string[];
}

// export interface User {
//   id: number;
//   username: string;
//   profile: UserProfile;
// }

// Avatar size type for Chakra UI v3
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

// For API responses
export interface GroupMembersResponse {
  results: GroupMembership[];
  count: number;
  next?: string;
  previous?: string;
}

// Props for components
export interface GroupMemberListProps {
  group: Group;
  members: GroupMembership[];
  isLoading?: boolean;
  error?: string | null;
  showPrivateInfo?: boolean;
  onMemberClick?: (membership: GroupMembership) => void;
  canEditMember?: (membership: GroupMembership) => boolean;
  avatarSize?: {
    grid?: AvatarSize;
    table?: AvatarSize;
  };
}

// For UniversalDataTable compatibility - transforms GroupMembership to table format
export interface MemberTableItem extends GroupMembership {
  // These properties help UniversalDataTable work correctly
  title?: string; // Will be display_name or username
  name?: string; // Will be display_name or username
  description?: string; // Will be bio_markdown or quick_intro
  profile_image?: string; // Will be profile_image or avatar
  created_at?: string; // Will be date_joined
  slug?: string; // Will be username for navigation
}

// Invitation status icon mapping
const STROKEWIDTH = 3;

export const invitationStatusIconMap: Record<
  GroupInvitation["invitation_status"],
  {
    icon: React.ElementType;
    color: string;
    label: string;
    strokeWidth?: number;
  }
> = {
  pending: {
    icon: IconClock,
    color: "orange.400",
    label: "Pending",
    strokeWidth: STROKEWIDTH,
  },
  joined: {
    icon: IconCircleCheck,
    color: "green.400",
    label: "Joined",
    strokeWidth: STROKEWIDTH,
  },
  declined: {
    icon: IconCircleX,
    color: "red.400",
    label: "Declined",
    strokeWidth: STROKEWIDTH,
  },
  expired: {
    icon: IconHourglass,
    color: "gray.400",
    label: "Expired",
    strokeWidth: STROKEWIDTH,
  },
};

// Type guards for member_data
// export const isBackendUser = (memberData: BackendUser | Group): memberData is BackendUser => {
//   return 'username' in memberData && 'email' in memberData;
// };

// export const isGroup = (memberData: BackendUser | Group): memberData is Group => {
//   return 'group_type' in memberData && 'visibility' in memberData;
// };

// Helper types for form handling


// Policy resource map (if still needed)
type PolicyResourceMap = {
  toggleRole: string;
  editProfile: number;
  viewAdminDashboard: undefined;
  deleteUser: number;
};