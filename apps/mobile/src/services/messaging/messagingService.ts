// services/messaging/messagingService.ts
// Mobile messaging service using Livewire WebSocket event format

import { socketService } from '../socket/socketService';

export interface Message {
  messageId: string;
  conversationId: string;
  conversationSlug: string;
  text: string;
  createdAt: string;
  sender: {
    username: string;
    avatarUrl?: string;
  };
  conversationTitle?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface TypingIndicator {
  conversationSlug: string;
  username: string;
  isTyping: boolean;
}

class MessagingService {
  /**
   * Send a message using Livewire's expected event format
   */
  sendMessage(conversationId: string, content: string): void {
    console.log('[MessagingService] Emitting send_message:', { message: content, conversationSlug: conversationId });
    socketService.emit('send_message', {
      conversationSlug: conversationId,
      message: content,
    });
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId: string, conversationId: string): void {
    socketService.emit('message:read', {
      messageId,
      conversationId,
    });
  }

  /**
   * Mark conversation as read
   */
  markConversationAsRead(conversationId: string): void {
    socketService.emit('conversation:read', {
      conversationId,
    });
  }

  /**
   * Send typing indicator using Livewire's expected event format
   */
  startTyping(conversationId: string): void {
    socketService.emit('start_typing', {
      conversationSlug: conversationId,
    });
  }

  /**
   * Stop typing indicator using Livewire's expected event format
   */
  stopTyping(conversationId: string): void {
    socketService.emit('stop_typing', {
      conversationSlug: conversationId,
    });
  }

  /**
   * Join a conversation room using Livewire's expected event format
   */
  joinConversation(conversationId: string): void {
    console.log('[MessagingService] Emitting join_conversation for:', conversationId);
    socketService.emit('join_conversation', { conversationSlug: conversationId });
  }

  /**
   * Leave a conversation room using Livewire's expected event format
   */
  leaveConversation(conversationId: string): void {
    socketService.emit('leave_conversation', { conversationSlug: conversationId });
  }

  /**
   * Listen for new messages using Livewire's event format
   */
  onMessage(callback: (message: Message) => void): () => void {
    // Livewire emits 'receive_message' when a message is sent
    socketService.on('receive_message', callback);

    // Return cleanup function
    return () => socketService.off('receive_message', callback);
  }

  /**
   * Listen for typing indicators using Livewire's event format
   */
  onTyping(callback: (data: TypingIndicator) => void): () => void {
    // Livewire emits 'user_typing' for typing indicators
    socketService.on('user_typing', callback);

    return () => socketService.off('user_typing', callback);
  }

  /**
   * Listen for message read receipts
   */
  onMessageRead(callback: (data: { messageId: string; userId: string }) => void): () => void {
    socketService.on('message:read', callback);

    return () => socketService.off('message:read', callback);
  }

  /**
   * Listen for conversation updates
   */
  onConversationUpdate(callback: (conversation: Conversation) => void): () => void {
    socketService.on('conversation:updated', callback);

    return () => socketService.off('conversation:updated', callback);
  }
}

export const messagingService = new MessagingService();