// src/components/dashboard/shared/WorkAreaErrorDisplay.tsx

import React from 'react';
import { Box, Text } from '@chakra-ui/react';

interface WorkAreaErrorDisplayProps {
  error: Error | string | null;
}

/**
 * Reusable error display component for work area landing pages
 * Shows a styled error message box
 */
export function WorkAreaErrorDisplay({ error }: WorkAreaErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Box
      mt={4}
      p={4}
      bg="red.50"
      borderRadius="md"
      border="1px solid"
      borderColor="red.200"
    >
      <Text color="red.600" fontSize="sm">
        {errorMessage}
      </Text>
    </Box>
  );
}

export default WorkAreaErrorDisplay;
