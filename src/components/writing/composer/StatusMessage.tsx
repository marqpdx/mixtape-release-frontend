// src/components/write/composer/StatusMessage.tsx

'use client';

import { Text } from '@chakra-ui/react';

interface StatusMessageProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

export function StatusMessage({ status }: StatusMessageProps) {
  const getStatusMessage = () => {
    switch (status) {
      case 'error':
        return (
          <Text fontSize="xs" color="red.500">
            • Error saving changes
          </Text>
        );
      case 'saved':
        return (
          <Text fontSize="xs" color="green.600">
            • Title, content & summary auto-saved
          </Text>
        );
      default:
        return null;
    }
  };

  return getStatusMessage();
}