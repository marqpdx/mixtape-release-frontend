// components/writing/composer/CollaborationIndicator.tsx
/**
 * Collaboration indicator for StatusBar
 * Shows collaboration status and opens management dialog
 */

'use client';

import { Button, HStack, Text, Badge } from '@chakra-ui/react';
// import { Button } from '@/components/ui/button';
import type { DispatchContent } from '@mixtape/core/types/dispatchTypes';

interface CollaborationIndicatorProps {
  isCollaborative: boolean;
  dispatchContent: DispatchContent | null;
  onManageClick: () => void;
}

export function CollaborationIndicator({
  isCollaborative,
  dispatchContent,
  onManageClick,
}: CollaborationIndicatorProps) {
  if (!isCollaborative || !dispatchContent) {
    // Solo mode
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onManageClick}
        _hover={{ bg: 'gray.100' }}
      >
        <HStack gap={1.5}>
          <Text fontSize="lg">👤</Text>
          <Text fontSize="sm" color="gray.600">
            Solo editing
          </Text>
        </HStack>
      </Button>
    );
  }

  // Collaborative mode
  const editors = dispatchContent.editor_count;
  const commenters = dispatchContent.commenter_count;

  // Build summary text
  const parts: string[] = [];
  if (editors > 0) {
    parts.push(`${editors} editor${editors > 1 ? 's' : ''}`);
  }
  if (commenters > 0) {
    parts.push(`${commenters} reviewer${commenters > 1 ? 's' : ''}`);
  }
  const summary = parts.join(', ');

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onManageClick}
      _hover={{ bg: 'blue.50' }}
    >
      <HStack gap={1.5}>
        <Text fontSize="lg">👥</Text>
        <Text fontSize="sm" color="blue.600" fontWeight="medium">
          {summary}
        </Text>
        {dispatchContent.has_collaborative_edits && (
          <Badge colorScheme="green" size="sm">
            Live
          </Badge>
        )}
      </HStack>
    </Button>
  );
}
