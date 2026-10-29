// apps/mixtape/src/components/member/settings/AIAccountsSettings.tsx

'use client';

import { Badge, Box, Button, HStack, Heading, Link, Spinner, Text, VStack } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import {
  useAIAccounts,
  useCheckClaude,
  useClaudeLogin,
  useConnectClaude,
  useDisconnectClaude,
} from '@mixtape/api/hooks/aiAccounts';
import type { AIAccountState } from '@mixtape/api/clients/aiAccounts';
import { toaster } from '@mixtape/core/lib/toaster';

// Your own Claude account, connected so the cloud work you approve runs on it
// and no one else's (Service Trust ST-3; charter "Where your data goes" §3).

const STATE_LABEL: Record<AIAccountState, { label: string; color: string }> = {
  none: { label: 'Not connected', color: 'gray' },
  connecting: { label: 'Signing in', color: 'blue' },
  ready: { label: 'Connected', color: 'green' },
  needs_sign_in: { label: 'Sign in again', color: 'orange' },
  failed: { label: 'Something went wrong', color: 'red' },
  not_available: { label: 'Not available yet', color: 'gray' },
};

function errorDetail(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || 'That didn’t work. Try again in a moment.';
}

export function AIAccountsSettings() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  const { data, isLoading } = useAIAccounts();
  const claude = data?.claude;
  const connecting = claude?.state === 'connecting';
  const { data: login } = useClaudeLogin(connecting);

  const connect = useConnectClaude();
  const check = useCheckClaude();
  const disconnect = useDisconnectClaude();

  const onConnect = () =>
    connect.mutate(undefined, {
      onError: (err) => toaster.create({ title: errorDetail(err), type: 'error' }),
    });
  const onCheck = () =>
    check.mutate(undefined, {
      onError: (err) => toaster.create({ title: errorDetail(err), type: 'error' }),
    });
  const onDisconnect = () =>
    disconnect.mutate(undefined, {
      onSuccess: () => toaster.create({ title: 'Disconnected. Nothing runs on your Claude account now.', type: 'success' }),
      onError: (err) => toaster.create({ title: errorDetail(err), type: 'error' }),
    });

  const state = claude?.state ?? 'none';
  const badge = STATE_LABEL[state];
  const loginUrl = login?.session?.login_url;

  return (
    <VStack align="stretch" gap={4}>
      <Box>
        <Heading size="sm" mb={2}>AI accounts</Heading>
        <Text color={mutedColor} fontSize="sm">
          Some tasks can use a cloud AI model. When you approve one, it runs on your own account,
          never on Mixtape&apos;s or anyone else&apos;s. Nothing runs on your account that you haven&apos;t approved,
          and disconnecting stops it at once.
        </Text>
      </Box>

      <Box bg={cardBg} border="1px" borderColor={borderColor} borderRadius="md" p={4}>
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between">
              <Text fontWeight="semibold">Claude</Text>
              <Badge colorPalette={badge.color}>{badge.label}</Badge>
            </HStack>

            {claude?.message && state !== 'ready' && (
              <Text fontSize="sm" color={mutedColor}>{claude.message}</Text>
            )}
            {claude?.last_checked && state === 'ready' && (
              <Text fontSize="sm" color={mutedColor}>
                Last checked {new Date(claude.last_checked).toLocaleString()}
              </Text>
            )}

            {connecting && (
              <Box>
                {loginUrl ? (
                  <Text fontSize="sm">
                    <Link href={loginUrl} target="_blank" rel="noopener noreferrer" color="blue.500">
                      Open Claude to sign in →
                    </Link>{' '}
                    Come back here when you&apos;re done; this page updates by itself.
                  </Text>
                ) : (
                  <HStack gap={2}>
                    <Spinner size="xs" />
                    <Text fontSize="sm" color={mutedColor}>Getting your sign-in link…</Text>
                  </HStack>
                )}
              </Box>
            )}

            <HStack gap={2}>
              {(state === 'none' || state === 'needs_sign_in' || state === 'failed') && (
                <Button size="sm" colorPalette="blue" onClick={onConnect} loading={connect.isPending}>
                  {state === 'none' ? 'Connect your Claude account' : 'Sign in again'}
                </Button>
              )}
              {state === 'ready' && (
                <Button size="sm" variant="outline" onClick={onCheck} loading={check.isPending}>
                  Check now
                </Button>
              )}
              {(state === 'ready' || state === 'needs_sign_in') && (
                <Button size="sm" variant="ghost" colorPalette="red" onClick={onDisconnect} loading={disconnect.isPending}>
                  Disconnect
                </Button>
              )}
            </HStack>
          </VStack>
        )}
      </Box>
    </VStack>
  );
}
