'use client';

import { Box, VStack, HStack, Text, Badge, Spinner } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { useVersionHistory } from '@mixtape/api/hooks/stackroom/usePuddlejump';
import type { SourceFileVersion } from '@mixtape/core/types/puddlejump';

interface VersionHistoryPanelProps {
  sourceFileId: string | null;
  filename?: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function VersionEntry({ version }: { version: SourceFileVersion }) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box
      borderWidth={1}
      borderColor={borderColor}
      borderRadius="md"
      p={3}
    >
      <HStack justify="space-between" mb={1}>
        <HStack gap={2}>
          <Text fontSize="sm" fontWeight="semibold">
            v{version.version_number}
          </Text>
          {version.is_approved && (
            <Badge size="sm" colorPalette="green">Canon</Badge>
          )}
          {version.ai_assisted && (
            <Badge size="sm" colorPalette="purple">AI</Badge>
          )}
        </HStack>
        <Text fontSize="xs" color={mutedColor}>
          {timeAgo(version.created_at)}
        </Text>
      </HStack>

      {version.change_summary && (
        <Text fontSize="xs" color={mutedColor} mb={1}>
          {version.change_summary}
        </Text>
      )}

      <HStack gap={2} fontSize="xs" color={mutedColor}>
        {version.actor?.username && (
          <Text>by @{version.actor.username}</Text>
        )}
        {version.ai_assisted && version.ai_agent && (
          <Text>via {version.ai_agent}</Text>
        )}
      </HStack>

      {version.is_approved && version.approved_by && (
        <Text fontSize="xs" color="green.600" mt={1}>
          Approved by @{version.approved_by.username}
          {version.approved_at ? ` ${timeAgo(version.approved_at)}` : ''}
        </Text>
      )}
    </Box>
  );
}

export default function VersionHistoryPanel({ sourceFileId, filename }: VersionHistoryPanelProps) {
  const { versions, isLoading, error } = useVersionHistory(sourceFileId);
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  if (!sourceFileId) {
    return (
      <Box p={4}>
        <Text fontSize="sm" color={mutedColor}>
          Select a file to view its version history.
        </Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="sm" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text fontSize="sm" color="red.500">
          Failed to load version history.
        </Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      {filename && (
        <Text fontSize="sm" fontWeight="semibold" mb={3}>
          {filename}
        </Text>
      )}

      {versions.length === 0 ? (
        <Text fontSize="sm" color={mutedColor}>
          No versions recorded yet.
        </Text>
      ) : (
        <VStack gap={2} align="stretch">
          {versions.map((version) => (
            <VersionEntry key={version.id} version={version} />
          ))}
        </VStack>
      )}
    </Box>
  );
}
