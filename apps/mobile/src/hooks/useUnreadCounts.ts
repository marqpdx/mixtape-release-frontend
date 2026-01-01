// Hook for managing real-time unread counts
// Fetches initial counts and subscribes to socket events

import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { socketService } from '../services/socket/socketService';
import type { Message } from '../services/messaging/messagingService';

export function useUnreadCounts() {
  const { incrementUnread, updatePreview } = useChatStore();

  useEffect(() => {
    // Subscribe to socket events for new messages
    const handleMessage = (message: Message) => {
      const conversationSlug = message.conversationSlug || message.conversationId;

      if (conversationSlug) {
        // Increment unread count for this conversation
        incrementUnread(conversationSlug);

        // Update conversation preview
        updatePreview(
          conversationSlug,
          message.text,
          message.createdAt,
          message.sender.username
        );

        console.log('[useUnreadCounts] Updated counts for:', conversationSlug);
      }
    };

    // Listen for new messages
    const socket = socketService.getRawSocket();
    if (socket) {
      socket.on('receive_message', handleMessage);

      console.log('[useUnreadCounts] Subscribed to receive_message events');

      return () => {
        socket.off('receive_message', handleMessage);
        console.log('[useUnreadCounts] Unsubscribed from receive_message events');
      };
    }
  }, [incrementUnread, updatePreview]);

  return {
    // Could return methods to manually refresh counts if needed
  };
}
