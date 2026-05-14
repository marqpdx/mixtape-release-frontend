// lib/chat/setupConversationSocket.ts

import { useConversationStore } from "@/stores/conversationStore";
import { Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";

type ConversationMessage = {
  id: string;
  text: string;
  created_at: string;
  sender: { username: string };
};

type MessageEventPayload = {
  sender?: { username?: string } | string;
  text?: string;
  createdAt?: string;
  conversationSlug: string;
  messageId?: string;
};

type TypingEventPayload = {
  username: string;
  conversationSlug: string;
  isTyping: boolean;
};

export const setupConversationSocket = (
  socket: Socket,
  slug: string,
  setMessages: Dispatch<SetStateAction<ConversationMessage[]>>,
  setTypingUsers: Dispatch<SetStateAction<string[]>>,
): () => void => {

  console.log('[setupConversationSocket] Setting up socket for conversation:', slug);
  console.log('[setupConversationSocket] Socket connected?', socket.connected);

  socket.emit("join_conversation", { conversationSlug: slug });
  console.log("[setupConversationSocket] 🧩 Emitted join_conversation for", slug);

  const messageHandler = ({
    sender,
    text,
    createdAt,
    conversationSlug,
    messageId,
  }: MessageEventPayload) => {
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
    const senderUsername =
      typeof sender === 'string' ? sender : sender?.username ?? 'Unknown';

      setMessages((prev) => {
        const newMessage = {
          sender: { username: senderUsername },
          text: text || '',
          created_at: createdAt || new Date().toISOString(),
          id: messageId || `temp-${Date.now()}-${Math.random()}`,
        };
        console.log('📨 Adding message to state:', newMessage);
        return [newMessage, ...prev];
      });
    } else {
      // 🔔 Increment unread count for background conversations
      console.log('📬 Message is for different conversation, incrementing unread');
      incrementUnread(conversationSlug);
    }
  };

  const typingHandler = ({ username, conversationSlug, isTyping }: TypingEventPayload) => {
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
