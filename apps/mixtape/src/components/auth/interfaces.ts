// src/components/auth/interfaces.ts
// Form interfaces for auth components
// For UserIdentity and auth types, see @mixtape/core/types/auth.ts

export interface AuthShared {
  email: string;
}

export interface LoginFormProps {
  identifier: string;
  password: string;
}

export interface RegisterFormProps extends AuthShared {
  username: string;
  first_name: string;
  last_name: string;
  password: string;
}

export type ResetPasswordForm = AuthShared;

export interface FormProps<T> {
  formProps?: T;
  onSubmit?: (values: T) => void;
}

// Profile-related interfaces (keep these here as they're specific to profile editing)
export interface UserProfile {
  id: number;
  display_name?: string;
  slug: string;
  profile_image?: string;
  background_image?: string;
  quick_intro?: string;
  bio_json?: string;
  avatar?: string;
  self_description?: string;
  created?: string;
  updated?: string;
  visibility_profile_image?: "public" | "member";
  visibility_background_image?: "public" | "member";
}

export type ProfileEditFormData = {
  name?: string;
  bio_json?: string;
  quick_intro?: string;
  avatar?: string;
  profile_image?: string;
  self_description?: string;
  background_image?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  regenerate_slug?: boolean;
  autosave_bio?: boolean;
};
