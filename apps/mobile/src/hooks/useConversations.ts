// apps/mobile/src/hooks/useConversations.ts

// Hook for fetching and managing conversations
// Supports filtering by scope (personal vs group)

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchConversations } from '@mixtape/api/clients/chat/chatApi';
import type { Conversation } from '@mixtape/core/types/chatTypes';

interface UseConversationsOptions {
  scope?: 'personal' | 'group';
  groupSlug?: string;
}

const conversationsQueryKey = ['conversations'];

export function useConversations(options: UseConversationsOptions = {}) {
  const { scope, groupSlug } = options;

  const {
    data: allConversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: conversationsQueryKey,
    queryFn: fetchConversations,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const conversations = useMemo(() => {
    if (scope === 'personal') {
      return allConversations.filter(
        (c) => !c.contexts || c.contexts.length === 0
      );
    }
    if (scope === 'group' && groupSlug) {
      return allConversations.filter((c) =>
        c.contexts?.some((ctx) => ctx.anchor?.slug === groupSlug)
      );
    }
    return allConversations;
  }, [allConversations, scope, groupSlug]);

  return {
    conversations,
    loading: isLoading,
    error: error as Error | null,
    refresh: refetch,
  };
}
