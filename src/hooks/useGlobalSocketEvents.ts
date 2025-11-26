// src/hooks/chat/useGlobalSocketEvents.ts

import { getSocket } from "@/lib/socket";
import { useConversationStore } from "@/stores/conversationStore";
import { useEffect } from "react";

export const useGlobalSocketEvents = () => {
  const {
    selectedConversationSlug,
    incrementUnread,
    setConversationStatus,
    clearUnread,
  } = useConversationStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.warn("Socket: No socket instance found for global listeners.");
      return;
    }

    // 🔄 New conversation pushed in real-time
    const handleConversationCreated = (data: any) => {
      console.log("Socket: 📥 conversation_created", data);
      // You might want to trigger a refetch or merge into store
    };

    // 🧠 Updated fields (e.g., last_viewed_at, mute)
    const handleConversationUpdated = (data: any) => {
      console.log("Socket: 🧩 conversation_updated", data);
      const { slug, updatedFields } = data;
      setConversationStatus(slug, updatedFields);
    };

    // 📩 New message
    const handleReceiveMessage = (data: any) => {
      console.log("Socket: 📬 receive_message", data);
      const { conversationSlug } = data;

      if (conversationSlug !== selectedConversationSlug) {
        incrementUnread(conversationSlug);
      } else {
        clearUnread(conversationSlug); // optional
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
  }, [selectedConversationSlug, incrementUnread, setConversationStatus, clearUnread]);
};
