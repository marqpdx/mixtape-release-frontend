// apps/mixtape/src/components/writing/composer/StatusBar.tsx - Simplified version

'use client';

import { HStack, Button, Text, SimpleGrid } from '@chakra-ui/react';
import { IconDeviceFloppy, IconEraser } from '@tabler/icons-react';

interface StatusBarProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  draftId: string;
  onForceSave: () => void;
  onClearDraft: () => void;
  showSaveButton?: boolean;
  showDraftId?: boolean;
}

export function StatusBar({
  status,
  draftId,
  onForceSave,
  onClearDraft,
  showSaveButton = true,
  showDraftId = true,
}: StatusBarProps) {
  return (
    <HStack
      justify={showDraftId ? "space-between" : "flex-start"}
      py={2}
      fontSize="sm"
    >
      {showDraftId ? (
        <>
          <Text color="text.secondary">
            Draft ID: {draftId.slice(0, 8)}...
          </Text>
          <SimpleGrid
            columns={2}
            gap={3}
            w="100%"
            gridTemplateColumns="repeat(2, 43%)"
            justifyContent="space-between"
          >
            {showSaveButton && status !== 'error' && (
              <Button
                size="sm"
                variant="outline"
                onClick={onForceSave}
                disabled={status === 'saving'}
                w="100%"
              >
                <IconDeviceFloppy size={14} style={{ marginRight: '4px' }} />
                {status === 'saving' ? 'Saving...' : 'Save'}
              </Button>
            )}
            {status === 'error' && (
              <Button size="sm" variant="outline" colorScheme="red" onClick={onForceSave} w="100%">
                Retry Save
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClearDraft} w="100%">
              <IconEraser size={14} style={{ marginRight: '4px' }} />
              Clear Draft
            </Button>
          </SimpleGrid>
        </>
      ) : (
        <SimpleGrid
          columns={2}
          gap={3}
          w="100%"
          gridTemplateColumns="repeat(2, 43%)"
          justifyContent="space-between"
        >
          {showSaveButton && status !== 'error' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onForceSave}
              disabled={status === 'saving'}
              w="100%"
            >
              <IconDeviceFloppy size={14} style={{ marginRight: '4px' }} />
              {status === 'saving' ? 'Saving...' : 'Save'}
            </Button>
          )}
          {status === 'error' && (
            <Button size="sm" variant="outline" colorScheme="red" onClick={onForceSave} w="100%">
              Retry Save
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClearDraft} w="100%">
            <IconEraser size={14} style={{ marginRight: '4px' }} />
            Clear Draft
          </Button>
        </SimpleGrid>
      )}
    </HStack>
  );
}
