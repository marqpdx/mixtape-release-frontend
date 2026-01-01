// Hook for fetching and managing conversations
// Supports filtering by scope (personal vs group)

import { useState, useEffect, useCallback } from 'react';
import { fetchConversations } from '@mixtape/api/clients/chat/chatApi';
import type { Conversation } from '@mixtape/core/types/chatTypes';

interface UseConversationsOptions {
  scope?: 'personal' | 'group';
  groupSlug?: string;
}

export function useConversations(options: UseConversationsOptions = {}) {
  const { scope, groupSlug } = options;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all conversations from API
      const allConversations = await fetchConversations();

      // Client-side filtering based on scope
      let filtered = allConversations;

      if (scope === 'personal') {
        // Personal conversations have no context associations
        filtered = allConversations.filter(
          (c) => !c.contexts || c.contexts.length === 0
        );
      } else if (scope === 'group' && groupSlug) {
        // Group conversations have context matching the group slug
        filtered = allConversations.filter((c) =>
          c.contexts?.some((ctx) => ctx.anchor?.slug === groupSlug)
        );
      }

      setConversations(filtered);
    } catch (err) {
      console.error('[useConversations] Error loading conversations:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [scope, groupSlug]);

  // Load conversations on mount and when filters change
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    loading,
    error,
    refresh: loadConversations,
  };
}
