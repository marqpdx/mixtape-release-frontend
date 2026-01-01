// hooks/useMessaging.ts

import { useEffect, useCallback, useState } from 'react';
import { messagingService, Message, TypingIndicator } from '../services/messaging/messagingService';
import { useSocket } from './useSocket';

export function useMessaging(conversationId: string | null) {
  const { isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  // Join conversation when component mounts and conversationId is available
  useEffect(() => {
    if (conversationId && isConnected) {
      console.log('[useMessaging] Joining conversation:', conversationId);
      messagingService.joinConversation(conversationId);

      return () => {
        console.log('[useMessaging] Leaving conversation:', conversationId);
        messagingService.leaveConversation(conversationId);
      };
    } else {
      console.log('[useMessaging] Not joining - conversationId:', conversationId, 'isConnected:', isConnected);
    }
  }, [conversationId, isConnected]);

  // Listen for new messages
  const onMessage = useCallback((callback: (message: Message) => void) => {
    return messagingService.onMessage(callback);
  }, []);

  // Listen for typing indicators
  useEffect(() => {
    if (!conversationId) return;

    const cleanup = messagingService.onTyping((data: TypingIndicator) => {
      if (data.conversationSlug === conversationId) {
        if (data.isTyping) {
          // User started typing
          setTypingUsers(prev => {
            const existing = prev.find(u => u.username === data.username);
            if (existing) return prev;
            return [...prev, data];
          });
        } else {
          // User stopped typing
          setTypingUsers(prev => prev.filter(u => u.username !== data.username));
        }
      }
    });

    return cleanup;
  }, [conversationId]);

  // Send message
  const sendMessage = useCallback((content: string) => {
    if (!conversationId) return;
    messagingService.sendMessage(conversationId, content);
  }, [conversationId]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!conversationId) return;
    messagingService.startTyping(conversationId);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    messagingService.stopTyping(conversationId);
  }, [conversationId]);

  // Mark as read
  const markAsRead = useCallback((messageId: string) => {
    if (!conversationId) return;
    messagingService.markAsRead(messageId, conversationId);
  }, [conversationId]);

  return {
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    onMessage,
    typingUsers,
    isConnected,
  };
}