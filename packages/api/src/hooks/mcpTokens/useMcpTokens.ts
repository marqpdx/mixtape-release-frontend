// packages/api/src/hooks/mcpTokens/useMcpTokens.ts

/**
 * React Query hooks for your own MCP runtime tokens (Service Trust ST-3, SW-11.6).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mcpTokensApi } from '../../clients/mcpTokens';

export const mcpTokensKeys = {
  all: ['mcp-tokens'] as const,
};

export function useMcpTokens() {
  return useQuery({ queryKey: mcpTokensKeys.all, queryFn: () => mcpTokensApi.list() });
}

export function useMintMcpToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId?: string) => mcpTokensApi.mint(groupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mcpTokensKeys.all }),
  });
}

export function useRevokeMcpToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) => mcpTokensApi.revoke(tokenId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mcpTokensKeys.all }),
  });
}
