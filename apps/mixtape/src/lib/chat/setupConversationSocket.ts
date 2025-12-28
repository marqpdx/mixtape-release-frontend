// lib/chat/setupConversationSocket.ts

import { useConversationStore } from "@/stores/conversationStore";
import { Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";

export const setupConversationSocket = (
  socket: Socket,
  slug: string,
  setMessages: Dispatch<SetStateAction<any[]>>,
  setTypingUsers: Dispatch<SetStateAction<string[]>>,
): () => void => {

  console.log('[setupConversationSocket] Setting up socket for conversation:', slug);
  console.log('[setupConversationSocket] Socket connected?', socket.connected);

  socket.emit("join_conversation", { conversationSlug: slug });
  console.log("[setupConversationSocket] 🧩 Emitted join_conversation for", slug);

  const messageHandler = ({ sender, text, createdAt, conversationSlug, messageId }: any) => {
    console.log('📨 receive_message event received:', {
      sender,
      text,
      createdAt,
      conversationSlug,
      messageId,
      currentSlug: slug
    });

    const {
      conversations,
      selectedConversationSlug,
      incrementUnread,
      refetchConversations,
    } = useConversationStore.getState();

    // 🆕 If message is for a conversation we don't have yet, refetch to get it
    // This handles the case where recipient receives first message in a new conversation
    const convExists = conversations.some(c => c.slug === conversationSlug);
    if (!convExists) {
      console.log('🔄 Message received for unknown conversation, refetching conversations');
      refetchConversations();
    }

    if (conversationSlug === slug) {
      console.log('✅ Message is for current conversation, adding to messages');

      // Backend sends sender as { username, avatarUrl }, so extract username
      const senderUsername = sender?.username || sender;

      setMessages((prev) => {
        const newMessage = {
          sender: { username: senderUsername },
          text: text || '',
          created_at: createdAt || new Date().toISOString(),
          id: messageId || `temp-${Date.now()}-${Math.random()}`,
        };
        console.log('📨 Adding message to state:', newMessage);
        return [...prev, newMessage];
      });
    } else {
      // 🔔 Increment unread count for background conversations
      console.log('📬 Message is for different conversation, incrementing unread');
      incrementUnread(conversationSlug);
    }
  };

  const typingHandler = ({ username, conversationSlug, isTyping }: any) => {
    if (conversationSlug !== slug) return;

    setTypingUsers((prev) => {
      if (isTyping && !prev.includes(username)) {
        return [...prev, username];
      } else if (!isTyping && prev.includes(username)) {
        return prev.filter((u) => u !== username);
      }
      return prev;
    });
  };

  socket.on("receive_message", messageHandler);
  socket.on("user_typing", typingHandler);

  return () => {
    socket.off("receive_message", messageHandler);
    socket.off("user_typing", typingHandler);
  };
};