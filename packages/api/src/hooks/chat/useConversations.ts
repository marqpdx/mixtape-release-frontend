import { useQuery } from "@tanstack/react-query";
import { fetchConversations } from "@mixtape/api/clients/chat/chatApi";
import type { Conversation } from "@mixtape/core/types/chatTypes";

export const chatQueryKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatQueryKeys.all, "conversations"] as const,
};

export const useConversations = (options?: { enabled?: boolean }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: chatQueryKeys.conversations(),
    queryFn: fetchConversations,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });

  return {
    conversations: (data ?? []) as Conversation[],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
