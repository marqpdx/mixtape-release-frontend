// Hook for fetching and managing conversation message history
// Supports pagination and merges with real-time messages

import { useState, useEffect, useCallback } from 'react';
import { fetchMessages } from '@mixtape/api/clients/chat/chatApi';
import type { Message } from '@mixtape/core/types/chatTypes';

interface UseConversationMessagesOptions {
  conversationId: string;
  limit?: number;
}

export function useConversationMessages({
  conversationId,
  limit = 50,
}: UseConversationMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchMessages(conversationId, limit, 0);
      setMessages(data);
      setOffset(data.length);
      setHasMore(data.length >= limit);
    } catch (err) {
      console.error('[useConversationMessages] Error loading messages:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, limit]);

  // Load more messages (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      setError(null);

      const data = await fetchMessages(conversationId, limit, offset);

      if (data.length === 0) {
        setHasMore(false);
      } else {
        // Prepend older messages to the list
        setMessages((prev) => [...data, ...prev]);
        setOffset((prev) => prev + data.length);
        setHasMore(data.length >= limit);
      }
    } catch (err) {
      console.error('[useConversationMessages] Error loading more messages:', err);
      setError(err as Error);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, limit, offset, hasMore, loadingMore]);

  // Add a new message (for real-time updates)
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Check if message already exists (avoid duplicates)
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  // Update a message (for optimistic updates or edits)
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m))
    );
  }, []);

  // Remove a message
  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  // Refresh messages (pull-to-refresh)
  const refresh = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await loadMessages();
  }, [loadMessages]);

  // Load messages on mount or when conversation changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    addMessage,
    updateMessage,
    removeMessage,
  };
}
