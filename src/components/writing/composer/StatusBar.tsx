// src/components/write/composer/StatusBar.tsx - Simplified version

'use client';

import { HStack, Button, Text } from '@chakra-ui/react';

interface StatusBarProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  draftId: string;
  onForceSave: () => void;
  onClearDraft: () => void;
}

export function StatusBar({ status, draftId, onForceSave, onClearDraft }: StatusBarProps) {
  return (
    <HStack justify="space-between" py={2} fontSize="sm">
      <Text color="text.secondary">
        Draft ID: {draftId.slice(0, 8)}...
      </Text>

      <HStack gap={2}>
        {status === 'error' && (
          <Button size="xs" variant="outline" onClick={onForceSave}>
            Retry Save
          </Button>
        )}
        <Button size="xs" variant="ghost" onClick={onClearDraft}>
          Clear Draft
        </Button>
      </HStack>
    </HStack>
  );
}