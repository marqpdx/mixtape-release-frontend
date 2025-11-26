// src/components/chat/ChatRealtimeWire.tsx
"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
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
export function ChatRealtimeWire() {
  const { setAllUnreads, incrementUnread, resetUnread, unreads } = useChatUnread();
  const { refetchConversations } = useConversationStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.warn('[ChatRealtimeWire] No socket available, skipping setup');
      return;
    }

    console.log('[ChatRealtimeWire] Setting up global chat event listeners');

    // Handle new conversation created
    const handleConversationCreated = (payload: any) => {
      console.log('[ChatRealtimeWire] 🆕 New conversation created:', payload);
      // Refetch conversations to include the new one
      refetchConversations();
    };

    // Bootstrap unreads on connection
    const handleUnreadBootstrap = (unreads: Record<string, number>) => {
      console.log('[ChatRealtimeWire] 📬 Unread bootstrap received:', unreads);
      setAllUnreads(unreads);
    };

    // Handle unread count updates
    const handleUnreadCount = ({ conversationSlug, count, countDelta }: any) => {
      console.log('[ChatRealtimeWire] 📊 Unread count update:', { conversationSlug, count, countDelta });

      if (count !== undefined) {
        // Absolute count (e.g., after marking as read)
        if (count === 0) {
          resetUnread(conversationSlug);
        } else {
          // Set absolute count - calculate delta from current
          setAllUnreads((prev) => ({ ...prev, [conversationSlug]: count }));
        }
      } else if (countDelta !== undefined) {
        // Relative delta (e.g., new message arrived)
        incrementUnread(conversationSlug, countDelta);
      }
    };

    // Handle new message notifications (for toasts in the future)
    const handleNewMessage = (payload: any) => {
      console.log('[ChatRealtimeWire] 🔔 New message notification:', payload);
      // TODO: Show toast notification
      // For now, just log it
    };

    // Register listeners
    socket.on("conversation_created", handleConversationCreated);
    socket.on("conversation:unread_bootstrap", handleUnreadBootstrap);
    socket.on("conversation:unread_count", handleUnreadCount);
    socket.on("message:new", handleNewMessage);

    console.log('[ChatRealtimeWire] ✅ Global chat listeners registered');

    // Cleanup
    return () => {
      console.log('[ChatRealtimeWire] Cleaning up global chat listeners');
      socket.off("conversation_created", handleConversationCreated);
      socket.off("conversation:unread_bootstrap", handleUnreadBootstrap);
      socket.off("conversation:unread_count", handleUnreadCount);
      socket.off("message:new", handleNewMessage);
    };
  }, [setAllUnreads, incrementUnread, resetUnread, refetchConversations]);

  return null; // This component doesn't render anything
}
