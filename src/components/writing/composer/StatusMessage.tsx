// src/components/write/composer/StatusMessage.tsx

'use client';

import { Text } from '@chakra-ui/react';

interface StatusMessageProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  mode?: 'solo' | 'collab';
}

export function StatusMessage({ status, mode = 'solo' }: StatusMessageProps) {
  const getStatusMessage = () => {
    switch (status) {
      case 'saving':
        return (
          <Text fontSize="xs" color="gray.500">
            • Saving...
          </Text>
        );
      case 'error':
        return (
          <Text fontSize="xs" color="red.500">
            • Error saving changes
          </Text>
        );
      case 'saved':
        return (
          <Text fontSize="xs" color="green.600">
            {mode === 'collab'
              ? '• Collaborative content auto-saved'
              : '• Title, content & summary auto-saved'}
          </Text>
        );
      default:
        return null;
    }
  };

  return getStatusMessage();
}