// src/components/chat/ChatRealtimeWire.tsx
"use client";

import { useEffect } from "react";
import { getSocket } from "@mixtape/api/lib/socket";
import { useChatUnread } from "@/contexts/ChatUnreadContext";
import { useConversationStore } from "@/stores/conversationStore";

/**
 * ChatRealtimeWire - Sets up global socket listeners for chat events
 *
 * This component handles:
 * - Initial unread count bootstrap from server
 * - Real-time unread count updates
 * - New conversation notifications
 * - Message notifications (future: toasts)
 */
type UnreadCountPayload = {
  conversationSlug?: string;
  count?: number;
  countDelta?: number;
};

type NewMessagePayload = {
  conversationSlug?: string;
  conversationId?: string;
};

export function ChatRealtimeWire() {
  const { setAllUnreads, incrementUnread, resetUnread } = useChatUnread();
  const { refetchConversations } = useConversationStore();

  useEffect(() => {
    console.log('[ChatRealtimeWire] Component mounted, checking for socket...');

    let pollInterval: NodeJS.Timeout | null = null;
    let cleanupFn: (() => void) | null = null;

    // Try to get socket and set up listeners
    const trySetup = () => {
      const socket = getSocket();

      if (!socket) {
        console.log('[ChatRealtimeWire] No socket available yet, will poll...');
        return false;
      }

      console.log('[ChatRealtimeWire] Socket found:', { connected: socket.connected, id: socket.id });

      // Clear polling once we have a socket
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }

      // Function to set up all listeners
      const setupListeners = () => {
        console.log('[ChatRealtimeWire] 📡 Setting up global chat event listeners');

      // Handle new conversation created
      const handleConversationCreated = (payload: Record<string, unknown>) => {
        console.log('[ChatRealtimeWire] 🆕 New conversation created:', payload);
        refetchConversations();
      };

      // Bootstrap unreads on connection
      const handleUnreadBootstrap = (unreads: Record<string, number>) => {
        console.log('[ChatRealtimeWire] 📬 Unread bootstrap received:', unreads);
        setAllUnreads(unreads);
      };

      // Handle unread count updates
      const handleUnreadCount = ({ conversationSlug, count, countDelta }: UnreadCountPayload) => {
        console.log('[ChatRealtimeWire] 📊 Unread count update:', { conversationSlug, count, countDelta });
        if (!conversationSlug) return;

        if (count !== undefined) {
          if (count === 0) {
            resetUnread(conversationSlug);
          } else {
            setAllUnreads((prev) => ({ ...prev, [conversationSlug]: count }));
          }
        } else if (countDelta !== undefined) {
          incrementUnread(conversationSlug, countDelta);
        }
      };

      // Handle new message notifications
      const handleNewMessage = (payload: NewMessagePayload) => {
        console.log('[ChatRealtimeWire] 🔔 ========== NEW MESSAGE EVENT ==========');
        console.log('[ChatRealtimeWire] 🔔 Full payload:', JSON.stringify(payload, null, 2));

        const { conversations } = useConversationStore.getState();
        const conversationSlug = payload.conversationSlug || payload.conversationId;

        console.log('[ChatRealtimeWire] 🔍 Extracted conversationSlug:', conversationSlug);
        console.log('[ChatRealtimeWire] 🔍 Current conversations:', conversations.map(c => c.slug));

        if (conversationSlug) {
          const convExists = conversations.some(c => c.slug === conversationSlug);
          console.log('[ChatRealtimeWire] 🔍 Does conversation exist locally?', convExists);

          if (!convExists) {
            console.log('[ChatRealtimeWire] 🔄 ✨ TRIGGERING REFETCH - Message for unknown conversation');
            refetchConversations();
          } else {
            console.log('[ChatRealtimeWire] ⏭️  Conversation already exists, skipping refetch');
          }
        } else {
          console.log('[ChatRealtimeWire] ⚠️  No conversationSlug found in payload!');
        }

        console.log('[ChatRealtimeWire] 🔔 ========================================');
      };

      // Register listeners
      socket.on("conversation_created", handleConversationCreated);
      socket.on("conversation:unread_bootstrap", handleUnreadBootstrap);
      socket.on("conversation:unread_count", handleUnreadCount);
      socket.on("message:new", handleNewMessage);

      console.log('[ChatRealtimeWire] ✅ Global chat listeners registered');
      console.log('[ChatRealtimeWire] 📡 Listening for: conversation_created, conversation:unread_bootstrap, conversation:unread_count, message:new');

        // Return cleanup function
        return () => {
          console.log('[ChatRealtimeWire] 🧹 Cleaning up global chat listeners');
          socket.off("conversation_created", handleConversationCreated);
          socket.off("conversation:unread_bootstrap", handleUnreadBootstrap);
          socket.off("conversation:unread_count", handleUnreadCount);
          socket.off("message:new", handleNewMessage);
        };
      };

      // Set up listeners immediately if already connected
      if (socket.connected) {
        console.log('[ChatRealtimeWire] Socket already connected, setting up listeners now');
        cleanupFn = setupListeners();
        return true;
      }

      // Otherwise, wait for connect event
      console.log('[ChatRealtimeWire] Socket not connected yet, waiting for connect event');
      const handleConnect = () => {
        console.log('[ChatRealtimeWire] 🔌 Socket connected! Setting up listeners...');
        cleanupFn = setupListeners();
      };

      socket.once('connect', handleConnect);

      // Store cleanup that removes the connect listener
      cleanupFn = () => {
        socket.off('connect', handleConnect);
      };

      return true;
    };

    // Try initial setup
    if (!trySetup()) {
      // Socket not available yet, poll every 500ms
      console.log('[ChatRealtimeWire] Starting socket availability polling...');
      pollInterval = setInterval(() => {
        console.log('[ChatRealtimeWire] Polling for socket...');
        trySetup();
      }, 500);
    }

    // Cleanup function
    return () => {
      console.log('[ChatRealtimeWire] Component unmounting, cleaning up...');
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [setAllUnreads, incrementUnread, resetUnread, refetchConversations]);

  return null;
}
