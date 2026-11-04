// packages/api/src/hooks/aiAccounts/useAIAccounts.ts

/**
 * React Query hooks for your own AI accounts (Service Trust ST-3).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiAccountsApi } from '../../clients/aiAccounts';

export const aiAccountsKeys = {
  all: ['ai-accounts'] as const,
  claudeLogin: () => [...aiAccountsKeys.all, 'claude-login'] as const,
};

export function useAIAccounts() {
  return useQuery({ queryKey: aiAccountsKeys.all, queryFn: () => aiAccountsApi.get() });
}

/**
 * Polls while a sign-in is under way, so the link appears and the state turns to ready.
 * When the sign-in ends (ready, failed…), the accounts query is refreshed, which ends the polling.
 */
export function useClaudeLogin(enabled: boolean) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: aiAccountsKeys.claudeLogin(),
    queryFn: async () => {
      const login = await aiAccountsApi.claudeLogin();
      if (login.state !== 'connecting') {
        queryClient.invalidateQueries({ queryKey: aiAccountsKeys.all, exact: true });
      }
      return login;
    },
    enabled,
    refetchInterval: enabled ? 3000 : false,
  });
}

function useAccountMutation<T>(fn: () => Promise<T>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: aiAccountsKeys.all }),
  });
}

export const useConnectClaude = () => useAccountMutation(() => aiAccountsApi.connectClaude());
export const useCheckClaude = () => useAccountMutation(() => aiAccountsApi.checkClaude());
export const useDisconnectClaude = () => useAccountMutation(() => aiAccountsApi.disconnectClaude());

/** Sends the code Claude shows after you approve. */
export function useSendClaudeLoginCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => aiAccountsApi.sendClaudeLoginCode(code),
    onSettled: () => queryClient.invalidateQueries({ queryKey: aiAccountsKeys.all }),
  });
}
