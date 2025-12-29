// src/stores/conversationStore.ts - FIXED VERSION

"use client";

import { Conversation } from "@components/chat/interfaces";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { create } from "zustand";

interface ConversationStatus {
  last_viewed_at: string | null;
  is_muted?: boolean;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
}

interface ConversationStore {
  selectedConversationSlug: string | null;
  setSelectedConversation: (slug: string | null) => void;

  conversations: Conversation[];
  refetchConversations: () => Promise<void>;
  setConversations: (convos: Conversation[]) => void;

  unreadCounts: Record<string, number>;
  incrementUnread: (slug: string) => void;
  clearUnread: (slug: string) => void;

  conversationStatus: Record<string, ConversationStatus>;
  setConversationStatus: (slug: string, updates: Partial<ConversationStatus>) => void;

  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  selectedConversationSlug: null,

  setSelectedConversation: (slug) =>
    set((state) => {
      const newState = { ...state, selectedConversationSlug: slug };
      if (slug && state.unreadCounts[slug]) {
        newState.unreadCounts = { ...state.unreadCounts, [slug]: 0 };
      }
      return newState;
    }),

  conversations: [],
  setConversations: (convos) => set({ conversations: convos }),

  // 🔧 FIX: Use get() to access current state, making this function stable
  refetchConversations: async () => {
    try {
      console.log("🔄 Store: Fetching conversations...");
      const res = await axiosInstance.get("/api/chat/conversations");
      console.log(`✅ Store: Fetched ${res.data.length} conversations`);

      // Directly call set instead of going through setConversations
      set({ conversations: res.data });
    } catch (err) {
      console.error("❌ Store: Failed to refetch conversations", err);
    }
  },

  unreadCounts: {},

  incrementUnread: (slug) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [slug]: (state.unreadCounts[slug] || 0) + 1,
      },
    })),

  clearUnread: (slug) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [slug]: 0,
      },
    })),

  conversationStatus: {},

  setConversationStatus: (slug, updates) =>
    set((state) => ({
      conversationStatus: {
        ...state.conversationStatus,
        [slug]: {
          ...state.conversationStatus[slug],
          ...updates,
        },
      },
    })),

  isTyping: false,
  setIsTyping: (typing) => set({ isTyping: typing }),
}));