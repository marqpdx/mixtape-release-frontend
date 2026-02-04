// apps/mixtape/src/components/write/composer/StatusMessage.tsx

'use client';

import { Text } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

interface StatusMessageProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  mode?: 'solo' | 'collab';
  onShowSavedChange?: (visible: boolean) => void;
}

export function StatusMessage({
  status,
  mode = 'solo',
  onShowSavedChange,
}: StatusMessageProps) {
  const [showSaved, setShowSaved] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== 'saved') {
      setShowSaved(false);
      onShowSavedChange?.(false);
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      return;
    }
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => {
      setShowSaved(true);
      onShowSavedChange?.(true);
    }, 300);
    hideTimer.current = setTimeout(() => {
      setShowSaved(false);
      onShowSavedChange?.(false);
    }, 2750);
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [status, onShowSavedChange]);

  const getStatusMessage = () => {
    switch (status) {
      // case 'saving':
      //   return (
      //     <Text fontSize="xs" color="gray.500">
      //       • Saving...
      //     </Text>
      //   );
      case 'error':
        return (
          <Text fontSize="xs" color="red.500">
            • Error saving changes
          </Text>
        );
      default:
        return null;
    }
  };

  if (showSaved) {
    return (
      <Text fontSize="xs" color="green.600">
        {mode === 'collab'
          ? '• Collaborative content auto-saved'
          : '• Title, content & summary auto-saved'}
      </Text>
    );
  }

  return getStatusMessage();
}
