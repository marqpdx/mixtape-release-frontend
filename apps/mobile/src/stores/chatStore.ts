// Zustand store for chat state management
// Manages unread counts and conversation previews across screens

import { create } from 'zustand';

interface ConversationPreview {
  text: string;
  timestamp: string;
  senderUsername: string;
}

interface ChatStore {
  // Unread counts by conversation slug
  unreadCounts: Record<string, number>;

  // Last message previews by conversation slug
  conversationPreviews: Record<string, ConversationPreview>;

  // Actions
  setUnreadCount: (slug: string, count: number) => void;
  incrementUnread: (slug: string) => void;
  clearUnread: (slug: string) => void;
  setUnreadCounts: (counts: Record<string, number>) => void;

  updatePreview: (slug: string, text: string, timestamp: string, senderUsername: string) => void;
  clearAllUnreads: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  unreadCounts: {},
  conversationPreviews: {},

  // Set specific unread count
  setUnreadCount: (slug, count) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [slug]: count },
    })),

  // Increment unread count
  incrementUnread: (slug) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [slug]: (state.unreadCounts[slug] || 0) + 1,
      },
    })),

  // Clear unread count for a conversation
  clearUnread: (slug) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [slug]: 0 },
    })),

  // Set all unread counts at once (for initial load)
  setUnreadCounts: (counts) =>
    set({ unreadCounts: counts }),

  // Update conversation preview
  updatePreview: (slug, text, timestamp, senderUsername) =>
    set((state) => ({
      conversationPreviews: {
        ...state.conversationPreviews,
        [slug]: { text, timestamp, senderUsername },
      },
    })),

  // Clear all unreads (useful for logout)
  clearAllUnreads: () =>
    set({ unreadCounts: {}, conversationPreviews: {} }),
}));
