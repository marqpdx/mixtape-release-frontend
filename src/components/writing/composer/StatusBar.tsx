// src/components/write/composer/StatusBar.tsx - Simplified version

'use client';

import { HStack, Button, Text } from '@chakra-ui/react';
import { IconDeviceFloppy } from '@tabler/icons-react';

interface StatusBarProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  draftId: string;
  onForceSave: () => void;
  onClearDraft: () => void;
  showSaveButton?: boolean;
}

export function StatusBar({ status, draftId, onForceSave, onClearDraft, showSaveButton = true }: StatusBarProps) {
  return (
    <HStack justify="space-between" py={2} fontSize="sm">
      <Text color="text.secondary">
        Draft ID: {draftId.slice(0, 8)}...
      </Text>

      <HStack gap={2}>
        {showSaveButton && (
          <Button
            size="xs"
            variant="outline"
            onClick={onForceSave}
            disabled={status === 'saving'}
          >
            <IconDeviceFloppy size={14} style={{ marginRight: '4px' }} />
            {status === 'saving' ? 'Saving...' : 'Save'}
          </Button>
        )}
        {status === 'error' && (
          <Button size="xs" variant="outline" colorScheme="red" onClick={onForceSave}>
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