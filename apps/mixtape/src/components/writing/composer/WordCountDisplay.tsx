// src/components/write/composer/WordCountDisplay.tsx

'use client';

import { HStack, Text } from '@chakra-ui/react';
import { IconSunFilled, IconShieldFilled } from '@tabler/icons-react';

interface WordCountDisplayProps {
  wordCount: number;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';
  hasUnsavedChanges?: boolean;
}

export function WordCountDisplay({
  wordCount,
  saveStatus,
  hasUnsavedChanges = false
}: WordCountDisplayProps) {
  const getSaveIcon = () => {
    // Show shield when saving OR when there are unsaved changes
    if (saveStatus === 'saving' || hasUnsavedChanges) {
      return <IconShieldFilled size={10} color="#f59e0b" />; // orange-yellow shield
    }

    switch (saveStatus) {
      case 'saved':
      case 'idle': // idle = no changes since last save = green sun
        return <IconSunFilled size={10} color="#22c55e" />; // green sun when saved/no changes
      case 'error':
        return <IconShieldFilled size={10} color="#ef4444" />; // red shield when error
      default:
        return <IconSunFilled size={10} color="#22c55e" />; // default to green sun
    }
  };

  const getStatusText = () => {
    // Only show status text for certain states
    switch (saveStatus) {
      // case 'saving':
      //   return 'Saving...';
      case 'error':
        return 'Error';
      default:
        return null; // No status text for saved/idle states
    }
  };

  return (
    <HStack gap={2} fontSize="xs" color="gray.500">
      {/* Save Status Icon Only */}
      {getSaveIcon()}

      {/* Status Text (only for saving/error states) */}
      {getStatusText() && (
        <Text fontSize="xs" color="gray.600">
          {getStatusText()}
        </Text>
      )}

      {/* Word Count */}
      <Text>
        Words: {wordCount}
      </Text>
    </HStack>
  );
}
