// src/types/auth.ts

/**
 * User roles in the system
 */
export type Role = 'admin' | 'steward' | 'member';

/**
 * System permissions following Resource:Action pattern
 */
export type Permission =
  // User management
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  // Content management
  | 'posts:read'
  | 'posts:write'
  | 'posts:delete'
  | 'posts:publish'
  // Member management
  | 'members:read'
  | 'members:write'
  | 'members:invite'
  // Admin operations
  | 'admin:access'
  | 'admin:settings';

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  slug: string;
  display_name: string;
  quick_intro: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

/**
 * Complete user identity with auth information
 */
export interface UserIdentity {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  roles: Role[];
  profile: UserProfile | null;
  groups?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  identifier: string; // username or email
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Auth API response for login/refresh
 */
export interface AuthResponse {
  success: boolean;
  access: string;
  access_expires: number;
  refresh?: string; // Should not be sent if using httpOnly cookies
  refresh_expires?: number;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  detail?: string; // Error message
  code?: string; // Error code
}

/**
 * Auth error codes from backend
 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'user_not_found'
  | 'user_inactive'
  | 'no_refresh_cookie'
  | 'invalid_refresh_token'
  | 'token_expired'
  | 'unknown_error';

/**
 * Auth error with structured information
 */
export interface AuthError extends Error {
  code?: AuthErrorCode;
  status?: number;
  detail?: string;
}
