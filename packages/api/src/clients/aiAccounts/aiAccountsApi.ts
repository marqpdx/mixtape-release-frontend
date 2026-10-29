// packages/api/src/clients/aiAccounts/aiAccountsApi.ts

/**
 * Your own AI accounts (Service Trust ST-3).
 *
 * Core: /api/me/ai-accounts/. Every route acts on the signed-in person only;
 * responses never include server account names or paths.
 */

import { axiosInstance } from '@mixtape/api/lib/axiosInstance';

export type AIAccountState = 'none' | 'connecting' | 'ready' | 'needs_sign_in' | 'failed' | 'not_available';

export interface AIAccountStatus {
  state: AIAccountState;
  last_checked?: string | null;
  message?: string | null;
}

export interface AIAccounts {
  claude: AIAccountStatus;
  codex: AIAccountStatus;
}

export interface ClaudeLogin extends AIAccountStatus {
  session: null | {
    status: 'starting' | 'awaiting_auth' | 'complete' | 'failed' | 'expired';
    login_url: string | null;
    expires_at: string;
    is_expired: boolean;
    error: string | null;
  };
}

const BASE = '/api/me/ai-accounts/';

const aiAccountsApi = {
  get: async (): Promise<AIAccounts> => (await axiosInstance.get<AIAccounts>(BASE)).data,
  connectClaude: async (): Promise<AIAccountStatus> =>
    (await axiosInstance.post<AIAccountStatus>(`${BASE}claude/connect/`)).data,
  claudeLogin: async (): Promise<ClaudeLogin> => (await axiosInstance.get<ClaudeLogin>(`${BASE}claude/login/`)).data,
  checkClaude: async (): Promise<AIAccountStatus> =>
    (await axiosInstance.post<AIAccountStatus>(`${BASE}claude/check/`)).data,
  disconnectClaude: async (): Promise<AIAccountStatus> =>
    (await axiosInstance.post<AIAccountStatus>(`${BASE}claude/disconnect/`)).data,
};

export default aiAccountsApi;
