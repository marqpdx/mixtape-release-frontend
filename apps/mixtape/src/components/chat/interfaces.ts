export type TrustProfile = "standard" | "private" | "ephemeral";

export type Conversation = {
  id: string;
  slug: string;
  name: string | null;
  is_group: boolean;
  trust_profile: TrustProfile;
  created_at: string;
  participants: string[];
  last_message?: string;
  next_rotation_due_at?: string | null;
};