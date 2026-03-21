// Hook for managing real-time unread counts
// Fetches initial counts and subscribes to socket events

import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { socketService } from '../services/socket/socketService';
import type { Message } from '../services/messaging/messagingService';
import { useAuthStore } from '../stores/authStore';
import { useSocket } from './useSocket';

interface UnreadCountPayload {
  conversationSlug?: string;
  count?: number;
  countDelta?: number;
}

export function useUnreadCounts() {
  const currentUsername = useAuthStore((state) => state.user?.username);
  const { isConnected } = useSocket();
  const {
    unreadCounts,
    incrementUnread,
    updatePreview,
    clearUnread,
    activeConversationId,
    setUnreadCounts,
    setUnreadCount,
  } = useChatStore();

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Subscribe to socket events for new messages
    const handleMessage = (message: Message) => {
      const conversationSlug = message.conversationSlug || message.conversationId;

      if (conversationSlug) {
        // Update conversation preview
        updatePreview(
          conversationSlug,
          message.text,
          message.createdAt,
          message.sender.username
        );

        if (message.sender.username === currentUsername) {
          return;
        }

        if (activeConversationId === conversationSlug) {
          clearUnread(conversationSlug);
          return;
        }

        incrementUnread(conversationSlug);

        console.log('[useUnreadCounts] Updated counts for:', conversationSlug);
      }
    };

    const handleUnreadBootstrap = (counts: Record<string, number>) => {
      setUnreadCounts(counts);
    };

    const handleUnreadCount = ({
      conversationSlug,
      count,
      countDelta,
    }: UnreadCountPayload) => {
      if (!conversationSlug) {
        return;
      }

      if (count !== undefined) {
        setUnreadCount(conversationSlug, count);
        return;
      }

      if (countDelta !== undefined) {
        if (countDelta <= 0) {
          clearUnread(conversationSlug);
        } else {
          incrementUnread(conversationSlug);
        }
      }
    };

    // Listen for new messages
    const socket = socketService.getRawSocket();
    if (socket) {
      socket.on('receive_message', handleMessage);
      socket.on('conversation:unread_bootstrap', handleUnreadBootstrap);
      socket.on('conversation:unread_count', handleUnreadCount);

      console.log('[useUnreadCounts] Subscribed to receive_message events');

      return () => {
        socket.off('receive_message', handleMessage);
        socket.off('conversation:unread_bootstrap', handleUnreadBootstrap);
        socket.off('conversation:unread_count', handleUnreadCount);
        console.log('[useUnreadCounts] Unsubscribed from receive_message events');
      };
    }
  }, [
    activeConversationId,
    clearUnread,
    currentUsername,
    incrementUnread,
    isConnected,
    setUnreadCount,
    setUnreadCounts,
    updatePreview,
  ]);

  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    void import('../services/notifications/notificationService').then(({ notificationService }) => {
      void notificationService.syncBadgeCount(totalUnread);
    });
  }, [unreadCounts]);

  return {
    // Could return methods to manually refresh counts if needed
  };
}
