// packages/api/src/clients/chat/chatApi.ts

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
  DeviceSession,
  ParticipantDeviceGroup,
  TrustDeviceResponse,
  KeyBundle,
  PostKeyBundleItem,
  PostKeyBundlesResponse,
} from '@mixtape/core/types/chatTypes';
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
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
 * Upload a voice message to a conversation.
 * Uses multipart/form-data — same storage pattern as seed voice notes.
 * @param conversationSlug - Conversation slug
 * @param uri - Local file URI from useNativeVoiceRecorder
 * @param mimeType - Audio MIME type (e.g. 'audio/m4a')
 * @param fileName - File name (e.g. 'seed-voice.m4a')
 * @param durationSeconds - Recording duration in seconds
 */
export async function uploadVoiceMessage(
  conversationSlug: string,
  uri: string,
  mimeType: string,
  fileName: string,
  durationSeconds: number
): Promise<Message> {
  const formData = new FormData();
  formData.append('audio', { uri, type: mimeType, name: fileName } as any);
  formData.append('duration', String(durationSeconds));

  const response = await axiosInstance.post<Message>(
    `/api/chat/conversations/${conversationSlug}/voice-upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

/**
 * Upload a voice message from a web Blob (MediaRecorder output).
 * Web FormData handles multipart/form-data boundary automatically — do not set Content-Type.
 *
 * @param iv - base64 AES-GCM IV, set when `blob` is already E2E-encrypted ciphertext
 *   (Private/Ephemeral conversations, LW-C3). Server stores it opaquely and skips transcription.
 * @param keyVersion - conversation key version that encrypted `blob` (LW-C4). Required when iv is set.
 */
export async function uploadVoiceMessageBlob(
  conversationSlug: string,
  blob: Blob,
  durationSeconds: number,
  iv?: string,
  keyVersion?: number
): Promise<Message> {
  const ext = iv ? 'bin' : blob.type.includes('webm') ? 'webm' : blob.type.includes('ogg') ? 'ogg' : 'mp4';
  const formData = new FormData();
  formData.append('audio', blob, `voice-message.${ext}`);
  formData.append('duration', String(Math.round(durationSeconds)));
  if (iv) {
    formData.append('iv', iv);
    formData.append('key_version', String(keyVersion ?? 1));
  }
  const response = await axiosInstance.post<Message>(
    `/api/chat/conversations/${conversationSlug}/voice-upload`,
    formData
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

// ============================================================================
// DEVICE VERIFICATION API FUNCTIONS (Phase B)
// ============================================================================

export async function registerDeviceSession(
  deviceId: string,
  platform: string,
  deviceName: string
): Promise<DeviceSession> {
  const response = await axiosInstance.post<DeviceSession>('/api/chat/devices', {
    device_id: deviceId,
    platform,
    device_name: deviceName,
  });
  return response.data;
}

export async function fetchMyDevices(): Promise<DeviceSession[]> {
  const response = await axiosInstance.get<DeviceSession[]>('/api/chat/devices');
  return response.data;
}

export async function revokeDevice(deviceId: string): Promise<void> {
  await axiosInstance.delete(`/api/chat/devices/${deviceId}`);
}

export async function fetchConversationDevices(slug: string): Promise<ParticipantDeviceGroup[]> {
  const response = await axiosInstance.get<ParticipantDeviceGroup[]>(
    `/api/chat/conversations/${slug}/devices`
  );
  return response.data;
}

export async function trustDevice(slug: string, deviceId: string): Promise<TrustDeviceResponse> {
  const response = await axiosInstance.post<TrustDeviceResponse>(
    `/api/chat/conversations/${slug}/devices/${deviceId}/trust`
  );
  return response.data;
}

// ============================================================================
// E2E KEY MANAGEMENT API FUNCTIONS (Phase C)
// ============================================================================

export async function registerDeviceKey(deviceId: string, publicKey: string): Promise<void> {
  await axiosInstance.post('/api/chat/devices/register-key', { device_id: deviceId, public_key: publicKey });
}

export async function fetchMyConversationKey(
  slug: string,
  deviceId: string,
  version?: number
): Promise<KeyBundle> {
  const response = await axiosInstance.get<KeyBundle>(
    `/api/chat/conversations/${slug}/my-key`,
    {
      headers: { "X-Device-ID": deviceId },
      params: version !== undefined ? { version } : undefined,
    }
  );
  return response.data;
}

export async function postConversationKeyBundles(
  slug: string,
  bundles: PostKeyBundleItem[]
): Promise<PostKeyBundlesResponse> {
  const response = await axiosInstance.post<PostKeyBundlesResponse>(
    `/api/chat/conversations/${slug}/keys`,
    { bundles }
  );
  return response.data;
}

// ============================================================================
// MENTIONS API FUNCTIONS
// ============================================================================

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
