// apps/mixtape/src/components/member/settings/McpTokensSettings.tsx

'use client';

import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Code,
  HStack,
  Heading,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { useMcpTokens, useMintMcpToken, useRevokeMcpToken } from '@mixtape/api/hooks/mcpTokens';
import { toaster } from '@mixtape/core/lib/toaster';

// MCP runtime tokens let your own AI runtime call Switchboard's MCP tools as
// you (Service Trust ST-3, Switchboard SW-11.6). Shown alongside AI accounts
// since a token only mints once your Claude account is connected.

function errorDetail(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || 'That didn’t work. Try again in a moment.';
}

export function McpTokensSettings() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  const { data: tokens, isLoading } = useMcpTokens();
  const mint = useMintMcpToken();
  const revoke = useRevokeMcpToken();
  const [justMinted, setJustMinted] = useState<string | null>(null);

  const onMint = () =>
    mint.mutate(undefined, {
      onSuccess: (minted) => setJustMinted(minted.token),
      onError: (err) => toaster.create({ title: errorDetail(err), type: 'error' }),
    });

  const onRevoke = (tokenId: string) =>
    revoke.mutate(tokenId, {
      onSuccess: () => {
        if (justMinted) setJustMinted(null);
        toaster.create({ title: 'Token revoked.', type: 'success' });
      },
      onError: (err) => toaster.create({ title: errorDetail(err), type: 'error' }),
    });

  return (
    <VStack align="stretch" gap={4}>
      <Box>
        <Heading size="sm" mb={2}>MCP tokens</Heading>
        <Text color={mutedColor} fontSize="sm">
          A token lets your AI runtime call Switchboard&apos;s read-only tools as you —
          optionally for one Group you belong to. Revoking a token stops it at once.
        </Text>
      </Box>

      {justMinted && (
        <Box bg={cardBg} border="1px" borderColor="orange.300" borderRadius="md" p={4}>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Copy this token now — it won&apos;t be shown again.
          </Text>
          <Code p={2} borderRadius="md" fontSize="sm" wordBreak="break-all" display="block">
            {justMinted}
          </Code>
        </Box>
      )}

      <Box bg={cardBg} border="1px" borderColor={borderColor} borderRadius="md" p={4}>
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <VStack align="stretch" gap={3}>
            {tokens && tokens.length > 0 ? (
              tokens.map((token) => (
                <HStack key={token.id} justify="space-between">
                  <VStack align="start" gap={0}>
                    <HStack>
                      <Text fontFamily="mono" fontSize="sm">{token.token_prefix}…</Text>
                      {token.group_name && <Badge colorPalette="purple">{token.group_name}</Badge>}
                      <Badge colorPalette={token.is_valid ? 'green' : 'gray'}>
                        {token.is_valid ? 'Active' : 'Revoked'}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color={mutedColor}>
                      Created {new Date(token.created_at).toLocaleDateString()}
                      {token.last_used_at && ` · Last used ${new Date(token.last_used_at).toLocaleDateString()}`}
                    </Text>
                  </VStack>
                  {token.is_valid && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => onRevoke(token.id)}
                      loading={revoke.isPending}
                    >
                      Revoke
                    </Button>
                  )}
                </HStack>
              ))
            ) : (
              <Text fontSize="sm" color={mutedColor}>No MCP tokens yet.</Text>
            )}

            <Box>
              <Button size="sm" colorPalette="blue" onClick={onMint} loading={mint.isPending}>
                Mint a new token
              </Button>
            </Box>
          </VStack>
        )}
      </Box>
    </VStack>
  );
}
