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
  right_now: string;
  skills: string;
  work_areas: string;
  practice_area: string;
  location: string;
  quick_link: string;
  who_are_you: string;
  why_are_you_here: string;
  avatar_url: string;
  profile_image: string;
  background_image: string;
  profile_image_url?: string | null;
  background_image_url?: string | null;
  bio_json: Record<string, unknown>;
  bio_markdown: string;
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
  right_now?: string;
  skills?: string;
  work_areas?: string;
  practice_area?: string;
  location?: string;
  quick_link?: string;
  who_are_you?: string;
  why_are_you_here?: string;
  avatar_url?: string;
  profile_image?: string;
  background_image?: string;
  bio_json?: Record<string, unknown>;
  bio_markdown?: string;
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
