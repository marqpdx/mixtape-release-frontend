// src/components/dashboard/shared/WorkAreaEmptyState.tsx

import React from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';

interface WorkAreaEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  actionDisabled?: boolean;
}

/**
 * Reusable empty state component for work area landing pages
 * Displays when there's no content to show
 */
export function WorkAreaEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled = false,
}: WorkAreaEmptyStateProps) {
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box textAlign="center" py={12}>
      <Box
        as="div"
        mb={4}
        color="gray.500"
        css={{
          '& svg': {
            margin: '0 auto',
          },
        }}
      >
        {icon}
      </Box>
      <Heading size="md" mb={2}>
        {title}
      </Heading>
      <Text color={textColor} mb={4}>
        {description}
      </Text>
      <Button
        colorScheme="green"
        onClick={onAction}
        disabled={actionDisabled}
      >
        {actionLabel}
      </Button>
    </Box>
  );
}

export default WorkAreaEmptyState;
