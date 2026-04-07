// src/components/write/composer/WorkspaceToggle.tsx

'use client';

import { Box, IconButton } from '@chakra-ui/react';
import { IconSparkles } from '@tabler/icons-react';

interface WorkspaceToggleProps {
  workspaceOpen: boolean;
  onToggle: () => void;
}

export function WorkspaceToggle({ workspaceOpen, onToggle }: WorkspaceToggleProps) {
  if (workspaceOpen) return null;

  return (
    <Box
      w="48px"
      bg="gray.50"
      borderLeft="1px solid"
      borderColor="gray.200"
      h="100%"
      position="relative"
    >
      <Box
        position="absolute"
        top="16px"
        left="50%"
        transform="translateX(-50%)"
        zIndex={1001}
      >
        <IconButton
          size="sm"
          variant="ghost"
          bg="green.50"
          border="1px solid"
          borderColor="green.200"
          borderRadius="full"
          shadow="sm"
          onClick={onToggle}
          title="Open Copy Desk"
          _hover={{ bg: "green.100", shadow: "md" }}
        >
          <IconSparkles size={16} color="green" />
        </IconButton>
      </Box>
    </Box>
  );
}