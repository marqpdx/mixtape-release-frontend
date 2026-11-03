// packages/api/src/clients/mcpTokens/mcpTokensApi.ts

/**
 * Your own MCP runtime tokens (Service Trust ST-3, Switchboard SW-11.6).
 *
 * Core: /api/me/mcp-tokens/. Every route acts on the signed-in person only.
 * The raw token value is returned exactly once, from mint(); it is never
 * stored anywhere and can never be shown again after this response.
 */

import { axiosInstance } from '@mixtape/api/lib/axiosInstance';

export interface McpRuntimeToken {
  id: string;
  token_prefix: string;
  group_id: string | null;
  group_name: string | null;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  is_valid: boolean;
}

export interface MintedMcpRuntimeToken extends McpRuntimeToken {
  token: string;
}

const BASE = '/api/me/mcp-tokens/';

const mcpTokensApi = {
  list: async (): Promise<McpRuntimeToken[]> =>
    (await axiosInstance.get<{ tokens: McpRuntimeToken[] }>(BASE)).data.tokens,
  mint: async (groupId?: string): Promise<MintedMcpRuntimeToken> =>
    (await axiosInstance.post<MintedMcpRuntimeToken>(BASE, groupId ? { group_id: groupId } : {})).data,
  revoke: async (tokenId: string): Promise<McpRuntimeToken> =>
    (await axiosInstance.post<McpRuntimeToken>(`${BASE}${tokenId}/revoke/`)).data,
};

export default mcpTokensApi;
