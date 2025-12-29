// packages/api/src/hooks/useGlobalSocketEvents.ts

import { getSocket } from "../lib/socket";
import { useEffect } from "react";

export interface GlobalSocketEventsCallbacks {
  selectedConversationSlug: string | null;
  onConversationCreated?: (data: any) => void;
  onConversationUpdated?: (slug: string, updatedFields: any) => void;
  onReceiveMessage?: (conversationSlug: string) => void;
  incrementUnread: (slug: string) => void;
  setConversationStatus: (slug: string, fields: any) => void;
  clearUnread: (slug: string) => void;
}

/**
 * Hook to set up global socket event listeners
 *
 * @param callbacks - Callbacks for handling socket events (usually from a store)
 *
 * @example
 * ```tsx
 * function ChatProvider() {
 *   const store = useConversationStore();
 *   useGlobalSocketEvents({
 *     selectedConversationSlug: store.selectedConversationSlug,
 *     incrementUnread: store.incrementUnread,
 *     setConversationStatus: store.setConversationStatus,
 *     clearUnread: store.clearUnread,
 *   });
 *   return <>{children}</>;
 * }
 * ```
 */
export const useGlobalSocketEvents = (callbacks: GlobalSocketEventsCallbacks) => {
  const {
    selectedConversationSlug,
    onConversationCreated,
    onConversationUpdated,
    onReceiveMessage,
    incrementUnread,
    setConversationStatus,
    clearUnread,
  } = callbacks;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.warn("Socket: No socket instance found for global listeners.");
      return;
    }

    // 🔄 New conversation pushed in real-time
    const handleConversationCreated = (data: any) => {
      console.log("Socket: 📥 conversation_created", data);
      onConversationCreated?.(data);
    };

    // 🧠 Updated fields (e.g., last_viewed_at, mute)
    const handleConversationUpdated = (data: any) => {
      console.log("Socket: 🧩 conversation_updated", data);
      const { slug, updatedFields } = data;
      if (onConversationUpdated) {
        onConversationUpdated(slug, updatedFields);
      } else {
        setConversationStatus(slug, updatedFields);
      }
    };

    // 📩 New message
    const handleReceiveMessage = (data: any) => {
      console.log("Socket: 📬 receive_message", data);
      const { conversationSlug } = data;

      if (onReceiveMessage) {
        onReceiveMessage(conversationSlug);
      } else {
        // Default behavior
        if (conversationSlug !== selectedConversationSlug) {
          incrementUnread(conversationSlug);
        } else {
          clearUnread(conversationSlug);
        }
      }
    };

    socket.on("conversation_created", handleConversationCreated);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("conversation_created", handleConversationCreated);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [
    selectedConversationSlug,
    onConversationCreated,
    onConversationUpdated,
    onReceiveMessage,
    incrementUnread,
    setConversationStatus,
    clearUnread,
  ]);
};
