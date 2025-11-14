// src/content/groupTypes.ts

import { EmblemInline } from "./emblemTypes";
import { IsoDateString, UserIdentity } from "./userTypes";


// ---------- Shared unions & enums ----------

export type GroupType = 'community' | 'circle' | 'persona' | 'coalition';
export type GroupVisibility = 'public' | 'invite_only' | 'private' | 'hidden';
export type GroupRole = 'admin' | 'steward' | 'member';
export type GroupStatus = 'draft' | 'published' | 'archived';
export type MemberType = 'customuser' | 'group' | 'organization';



// ---------- Core group models ----------

export interface Group {
  id: string;
  title: string;
  slug: string;
  description: string;
  summary?: string;           // ⚠️ ADD
  body?: string;              // ⚠️ ADD
  author_name?: string;       // ⚠️ ADD
  group_type: GroupType;
  visibility: GroupVisibility;
  display_layout: "classic" | "modern" | "minimal";
  status?: GroupStatus;            // ⚠️ ADD
  profile_image?: string;
  background_image?: string;
  is_active: boolean;
  submitted_by: string;
  user_roles: GroupRole[] | null; // or GroupRole[] if you fully control the backend vocab
  created_at: IsoDateString;
  updated_at: IsoDateString;

  // Computed fields
  member_count?: number;
  submitted_by_username?: string;

  emblem?: EmblemInline | null;  // ✅ This is correct
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

export interface GroupFormData {
  title: string;
  description: string;
  summary: string;
  body: string;
  // group_type: "community" | "circle" | "persona" | "coalition";
  group_type: GroupType;
  visibility: GroupVisibility;
  display_layout: "classic" | "modern" | "minimal";
  status: GroupStatus;
  author_name: string;
  profile_image?: string;      // ✨ Changed from File | string | null
  background_image?: string;   // ✨ Changed from File | string | null
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
 * Get human-readable visibility label
 */
export const getVisibilityLabel = (visibility: GroupVisibility): string => {
  const labels: Record<GroupVisibility, string> = {
    public: 'Public',
    invite_only: 'Invite Only',
    private: 'Private',
    hidden: 'Hidden'
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
    last_login: null, // Not available in membership data
    roles: [], // Not available in membership data
  };
};

// ---------- Form types ----------

export interface GroupCreateFormData {
  title: string;
  description: string;
  group_type: GroupType;
  visibility: GroupVisibility;
  profile_image?: string;
  background_image?: string;
}

export interface GroupUpdateFormData extends Partial<GroupCreateFormData> {
  // All fields optional for updates
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
