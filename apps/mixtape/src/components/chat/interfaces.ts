export type Conversation = {
  id: string;
  slug: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  participants: string[];
  last_message?: string;
};