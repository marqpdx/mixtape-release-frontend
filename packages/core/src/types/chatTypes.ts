// Chat/Conversation types for Mixtape
// Used by both web and mobile apps

export interface ConversationContext {
  id: string;
  slug: string;
  anchor?: {
    id: string;
    slug?: string;
    title?: string;
  };
}

export interface Conversation {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  participants: string[]; // Array of usernames
  contexts?: ConversationContext[]; // Group/context associations
  created_at: string;
  updated_at: string;
  last_message?: {
    text: string;
    created_at: string;
    sender: string;
  };
}

export interface Message {
  id: string;
  conversation: string; // conversation slug
  sender: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  text: string;
  created_at: string;
  reactions?: MessageReaction[];
  mentions?: MessageMention[];
  reaction_summary?: Record<string, number>;
  // Voice message fields (only present when message_type === 'voice')
  message_type?: 'text' | 'voice';
  audio_file_url?: string | null;
  audio_duration_seconds?: number | null;
  transcript_text?: string | null;
  transcript_status?: 'pending' | 'done' | 'failed' | null;
}

export interface MessageReaction {
  id: string;
  user: string; // username
  reaction_name: string;
  created_at: string;
}

export interface MessageMention {
  id: string;
  mentionee_type: 'user' | 'group';
  mentionee_id: string;
  mention_text: string;
}

export interface ConversationStatusTracker {
  conversation: string; // slug
  unread_count: number;
  last_read_at?: string;
  last_viewed_at?: string;
  is_muted: boolean;
}

// API Response types
export interface ConversationsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Conversation[];
}

export interface MessagesListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Message[];
}

export interface UnreadsResponse {
  unreads: Record<string, number>; // { conversationSlug: unreadCount }
}

// API Request types
export interface CreateConversationRequest {
  participants: string[]; // Array of usernames
  title?: string;
}

export interface CreateMessageRequest {
  text: string;
}
