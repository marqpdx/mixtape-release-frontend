// src/content/groupTypes.ts

import { UserIdentity } from "./auth";

// import { EmblemInline } from "./emblemTypes";
// import { IsoDateString, UserIdentity } from "./userTypes";

import {
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconHourglass,
} from "@tabler/icons-react";


// ---------- Shared unions & enums ----------

export type GroupType = 'community' | 'circle' | 'persona' | 'coalition';
export type GroupVisibility = 'public' | 'private' | 'unlisted';
export type GroupRole = 'admin' | 'steward' | 'member';
export type GroupStatus = 'draft' | 'published' | 'archived';
export type MemberType = 'customuser' | 'group' | 'organization';

export type IsoDateString = string; // optionally brand this later



// ---------- Core group models ----------

export interface Group {
  id: string;
  title: string;
  slug: string;
  description: string;
  summary?: string;
  body?: string;
  author_name?: string;
  group_type: GroupType;
  visibility: GroupVisibility;
  display_layout: "classic" | "modern" | "minimal";
  status?: GroupStatus;

  // Parent group/member info for circles
  sponsor_group?: {
    id: string;
    slug?: string;           // For group sponsors
    title?: string;          // For group sponsors
    group_type?: GroupType;  // For group sponsors
    username?: string;       // For member sponsors
    display_name?: string;   // For member sponsors
    type?: 'member';         // Discriminator for member sponsors
  } | null;

  // DEPRECATED: These fields store expired presigned URLs
  // Use profile_image_url and background_image_url instead
  profile_image?: string;
  background_image?: string;

  // Authoritative storage paths (S3 keys) - what gets saved to DB
  profile_image_path?: string;
  background_image_path?: string;

  // Computed presigned URLs (generated on-demand by backend)
  profile_image_url?: string;
  background_image_url?: string;

  is_active: boolean;
  is_member?: boolean;
  submitted_by: string;
  user_roles: GroupRole[] | null;
  created_at: IsoDateString;
  updated_at: IsoDateString;

  // Computed fields
  member_count?: number;
  submitted_by_username?: string;

  // emblem?: EmblemInline | null;
}

/** GROUP MEMBERSHIP - Flattened polymorphic membership */
export interface GroupMembership {
  // Member identity (flattened from polymorphic relationship)
  member_id: string;
  member_type: MemberType;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  display_name: string;
  is_active_user: boolean;
  profile_image?: string;

  // Membership-specific data
  roles: GroupRole[];
  date_joined: IsoDateString;
  is_active: boolean;
  is_pending: boolean;
  invited_by_username?: string;

  // Group context
  group_title: string;
  group_slug: string;
}

/** LIGHTWEIGHT GROUP MEMBER for search/autocomplete */
export interface GroupMemberSuggestion {
  member_id: string;
  member_type: MemberType;
  username?: string;
  display_name: string;
  email?: string;
  roles: GroupRole[];
}

export interface GroupSummary {
  id: string;
  slug: string;
  title: string;
  group_type?: GroupType;
}

export interface GroupFormData {
  title: string;
  description: string;
  summary: string;
  body: string;
  group_type: GroupType;
  visibility: GroupVisibility;
  display_layout: "classic" | "modern" | "minimal";
  status: GroupStatus;
  author_name: string;

  // Only the path fields are stored (URLs are computed on backend)
  profile_image_path?: string;
  background_image_path?: string;
}

// ---------- API Response types ----------

/** Response from /api/groups/ (paginated) */
export interface GroupsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Group[];
}

/** Response from /api/groups/<slug>/members/ */
export interface GroupMembersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GroupMembership[];
}

// ---------- Hook return types ----------

export interface UseGroupsResult {
  groups: Group[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseGroupResult {
  group: Group | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseGroupMembersResult {
  members: GroupMembership[];
  activeMembers: GroupMembership[];
  adminMembers: GroupMembership[];
  stewardMembers: GroupMembership[];
  pendingMembers: GroupMembership[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseGroupMemberSearchResult {
  members: GroupMemberSuggestion[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ---------- Utility functions ----------





/**
 * Check if a group member is a user (vs group/organization)
 */
export const isUserMember = (member: GroupMembership): boolean => {
  return member.member_type === 'customuser';
};

/**
 * Check if user is a member of the group (any role)
 */
export const isGroupMember = (group: Group): boolean => {
  return group.user_roles !== null && group.user_roles.length > 0;
};

/**
 * Get display name with fallback logic
 */
export const getMemberDisplayName = (member: GroupMembership): string => {
  if (member.display_name) return member.display_name;
  if (member.first_name || member.last_name) {
    return `${member.first_name || ''} ${member.last_name || ''}`.trim();
  }
  return member.username || member.member_id;
};

/**
 * Get member username with @ prefix for UI consistency
 */
export const getMemberUsername = (member: GroupMembership): string => {
  if (!member.username) return '';
  return member.username.startsWith('@') ? member.username : `@${member.username}`;
};

/**
 * Check if user can perform admin actions in group
 */
export const canUserAdminGroup = (group: Group): boolean => {
  return hasAnyRole(group, ['admin', 'steward']);
};

/**
 * Check if user can moderate group (admin, steward, or owner)
 */
export const canUserModerateGroup = (group: Group): boolean => {
  return hasAnyRole(group, ['admin', 'steward']);
};

/**
 * Get human-readable group type label
 */
export const getGroupTypeLabel = (groupType: GroupType): string => {
  const labels: Record<GroupType, string> = {
    community: 'Community',
    circle: 'Circle',
    persona: 'Persona',
    coalition: 'Coalition'
  };
  return labels[groupType] || groupType;
};

/**
 * Get human-readable visibility label for groups
 */
export const getGroupVisibilityLabel = (visibility: GroupVisibility): string => {
  const labels: Record<GroupVisibility, string> = {
    public: 'Public',
    private: 'Private',
    unlisted: 'Unlisted'
  };
  return labels[visibility] || visibility;
};


/**
 * Check if user has any of the specified roles in a group
 */
export const hasAnyRole = (group: Group, roles: GroupRole[]): boolean => {
  if (!group.user_roles || group.user_roles.length === 0) return false;
  return group.user_roles.some(role => roles.includes(role));
};

/**
 * Check if user has a specific role in a group
 */
export const hasRole = (group: Group, role: GroupRole): boolean => {
  if (!group.user_roles || group.user_roles.length === 0) return false;
  return group.user_roles.includes(role);
};







/**
 * Get the highest priority role for a user in a group
 * Priority: owner > admin > steward > member
 */
export const getPrimaryRole = (group: Group): GroupRole | null => {
  if (!group.user_roles || group.user_roles.length === 0) return null;

  const rolePriority: GroupRole[] = ['admin', 'steward', 'member'];

  for (const role of rolePriority) {
    if (group.user_roles.includes(role)) {
      return role;
    }
  }

  return null;
};


/**
 * Convert GroupMembership to UserIdentity for compatibility
 * Useful when you need to pass member data to components expecting UserIdentity
 */
export const groupMemberToUserIdentity = (member: GroupMembership): UserIdentity | null => {
  if (!isUserMember(member)) return null;

  return {
    id: member.member_id,
    username: member.username || '',
    email: member.email || '',
    first_name: member.first_name || '',
    last_name: member.last_name || '',
    is_active: member.is_active_user,
    is_staff: false, // Not available in membership data
    is_superuser: false, // Not available in membership data
    date_joined: member.date_joined,
    roles: [], // Group roles are separate from system roles
    profile: member.profile_image || member.display_name ? {
      id: member.member_id,
      slug: member.username || member.member_id,
      display_name: member.display_name,
      quick_intro: '',
      avatar_url: member.profile_image || '',
      created_at: member.date_joined,
      updated_at: member.date_joined,
    } : null,
  };
};

// ---------- Form types ----------

// export interface GroupCreateFormData {
//   title: string;
//   description: string;
//   group_type: GroupType;
//   visibility: GroupVisibility;
//   profile_image?: string;
//   background_image?: string;
// }

// export interface GroupUpdateFormData extends Partial<GroupCreateFormData> {
//   // All fields optional for updates
// }




// ---------- Group types ----------

// export type GroupType = "community" | "circle" | "persona" | "coalition";
// export type GroupVisibility = "public" | "invite_only" | "private" | "hidden";

// Circles: “Open Join vs Invite Only” lives inside scope/settings.
// Keep names consistent with backend enums.
export type CircleJoinMode = "open" | "request" | "invite_only";

// Sponsorship lock (how circles live “inside” a sponsor)
export type SponsorRef =
  | { sponsor_type: "group"; sponsor_id: string }   // community/persona
  | { sponsor_type: "member"; sponsor_id: string }; // member-sponsored circle

// ---------- Form types ----------

export interface GroupCreateFormData {
  // required
  title: string;
  description: string;
  group_type: GroupType;
  visibility: GroupVisibility;

  // optional “common”
  tagline?: string;       // community-ish
  summary?: string;
  body?: string;

  // images (you’ve started moving to path/url split — good)
  profile_image_path?: string;
  background_image_path?: string;

  // circle-ish
  start_date?: string | null; // ISO string
  end_date?: string | null;   // ISO string
  join_mode?: CircleJoinMode; // circle scope policy (MVP)
  allow_share_upward?: boolean; // circle-level gate (MVP: default false)

  // sponsorship (usually injected by wrapper, not user-entered)
  // sponsor?: SponsorRef;
}

export interface GroupUpdateFormData extends Partial<GroupCreateFormData> {}


export interface GroupCreateFormValues
  extends Omit<GroupCreateFormData, "start_date" | "end_date"> {
  start_date?: Date | null;
  end_date?: Date | null;
}


// ---------- Filter/search types ----------

export interface GroupFilters {
  type?: GroupType;
  visibility?: GroupVisibility;
  search?: string;
  user_role?: GroupRole;
}

export interface GroupMemberFilters {
  role?: GroupRole;
  pending?: boolean;
  search?: string;
  member_type?: MemberType;
}


// ---------- Invitation types ----------

// Group Invitation interface
export interface GroupInvitation {
  id: number;
  invited_email?: string | null;
  invited_group?: GroupSummary | null;
  group_detail?: GroupSummary | null;
  invited_by?: {
    id: number;
    username: string;
    email: string;
  } | null;
  group: number;
  message: string;
  invitation_status: "pending" | "joined" | "declined" | "expired";
  invitation_kind?: "invite" | "request";
  created_at: string;
  expires_at?: string | null;
  updated_at: string;
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
