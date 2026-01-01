// Chat/Conversation API client
// Shared between web and mobile apps

import {
  Conversation,
  Message,
  ConversationsListResponse,
  MessagesListResponse,
  UnreadsResponse,
  CreateConversationRequest,
  CreateMessageRequest,
} from '@mixtape/core/types/chatTypes';
import { axiosInstance } from '../../lib/axiosInstance';
import { unwrapListResponse } from '../../lib/utils';

// ============================================================================
// CONVERSATION API FUNCTIONS
// ============================================================================

/**
 * Fetch all conversations for the current user
 */
export async function fetchConversations(): Promise<Conversation[]> {
  const response = await axiosInstance.get<ConversationsListResponse>('/api/chat/conversations');
  return unwrapListResponse<Conversation>(response.data);
}

/**
 * Fetch a single conversation by slug
 */
export async function fetchConversation(slug: string): Promise<Conversation> {
  const response = await axiosInstance.get<Conversation>(`/api/chat/conversations/${slug}`);
  return response.data;
}

/**
 * Create a new conversation
 * @param participants - Array of usernames to include in conversation
 * @param title - Optional conversation title
 */
export async function createConversation(
  participants: string[],
  title?: string
): Promise<Conversation> {
  const requestData: CreateConversationRequest = {
    participants,
    title,
  };

  const response = await axiosInstance.post<Conversation>(
    '/api/chat/conversations',
    requestData
  );
  return response.data;
}

/**
 * Search conversations by participant name/username
 * @param query - Search query string
 */
export async function searchConversations(query: string): Promise<Conversation[]> {
  const response = await axiosInstance.get<ConversationsListResponse>(
    '/api/chat/conversations/search',
    { params: { q: query } }
  );
  return unwrapListResponse<Conversation>(response.data);
}

/**
 * Fetch unread counts for all conversations
 * @returns Record mapping conversation slug to unread count
 */
export async function fetchUnreadCounts(): Promise<Record<string, number>> {
  const response = await axiosInstance.get<UnreadsResponse>(
    '/api/chat/conversations/unreads'
  );
  return response.data.unreads;
}

/**
 * Mark a conversation as read
 * @param slug - Conversation slug
 * @param readAt - Optional timestamp (defaults to now)
 * @param lastMessageId - Optional last message ID that was read
 */
export async function markConversationAsRead(
  slug: string,
  readAt?: string,
  lastMessageId?: string
): Promise<UnreadsResponse> {
  const response = await axiosInstance.post<UnreadsResponse>(
    `/api/chat/conversations/${slug}/read`,
    {
      read_at: readAt || new Date().toISOString(),
      last_message_id: lastMessageId,
    }
  );
  return response.data;
}

// ============================================================================
// MESSAGE API FUNCTIONS
// ============================================================================

/**
 * Fetch messages for a conversation
 * @param conversationSlug - Conversation slug
 * @param limit - Number of messages to fetch (default 50, max 100)
 * @param offset - Pagination offset
 */
export async function fetchMessages(
  conversationSlug: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> {
  const response = await axiosInstance.get<MessagesListResponse>(
    `/api/chat/conversations/${conversationSlug}/messages`,
    { params: { limit, offset } }
  );
  return unwrapListResponse<Message>(response.data);
}

/**
 * Create a new message in a conversation
 * Note: In production, prefer using Socket.IO for real-time messaging
 * This is useful for initial message history loading or offline scenarios
 * @param conversationSlug - Conversation slug
 * @param text - Message text content
 */
export async function createMessage(
  conversationSlug: string,
  text: string
): Promise<Message> {
  const requestData: CreateMessageRequest = { text };

  const response = await axiosInstance.post<Message>(
    `/api/chat/conversations/${conversationSlug}/messages`,
    requestData
  );
  return response.data;
}

/**
 * React to a message
 * @param messageId - Message UUID
 * @param reactionName - Reaction emoji name (e.g., 'thumbs_up', 'heart')
 */
export async function reactToMessage(
  messageId: string,
  reactionName: string
): Promise<void> {
  await axiosInstance.post(`/api/chat/messages/${messageId}/react`, {
    reaction_name: reactionName,
  });
}

// ============================================================================
// MENTIONS API FUNCTIONS
// ============================================================================

export interface MentionSuggestion {
  type: 'user' | 'group';
  id: string;
  username?: string;
  display_name: string;
  avatar_url?: string;
}

/**
 * Get mention autocomplete suggestions
 * @param query - Search query (username/name fragment)
 * @param conversationSlug - Optional conversation context for filtering
 */
export async function fetchMentionSuggestions(
  query: string,
  conversationSlug?: string
): Promise<MentionSuggestion[]> {
  const params: any = { q: query };
  if (conversationSlug) {
    params.conversation_id = conversationSlug;
  }

  const response = await axiosInstance.get<{ suggestions: MentionSuggestion[] }>(
    '/api/chat/mention-autocomplete',
    { params }
  );
  return response.data.suggestions;
}
