// packages/core/src/types/memberTypes.ts

/**
 * Member Profile Types
 *
 * A "Member" is a user who is part of the Mixtape community.
 * Every user becomes a member of at least the default group.
 * The Member Profile is the public-facing representation.
 */

/**
 * Combined Member data from /api/members/ endpoint
 * Merges User account data with UserProfile data
 */
export interface MemberProfile {
  // From User
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
  roles: string[];

  // From UserProfile
  slug: string;
  display_name: string;
  quick_intro: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Data for updating a member profile
 * Only profile fields can be updated (not core user fields)
 */
export interface MemberProfileUpdate {
  display_name?: string;
  quick_intro?: string;
  avatar_url?: string;
}

/**
 * Hook return type for useMemberProfile
 */
export interface UseMemberProfileResult {
  member: MemberProfile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook return type for useMemberProfiles (list)
 */
export interface UseMemberProfilesResult {
  members: MemberProfile[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
