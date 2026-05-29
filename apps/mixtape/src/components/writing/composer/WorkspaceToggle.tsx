// src/components/write/composer/WorkspaceToggle.tsx

'use client';

import { Box, IconButton, VStack } from '@chakra-ui/react';
import { IconSparkles, IconBook2 } from '@tabler/icons-react';

interface WorkspaceToggleProps {
  workspaceOpen: boolean;
  onToggle: () => void;
  isLb?: boolean;
  lbDeskOpen?: boolean;
  onLbToggle?: () => void;
}

export function WorkspaceToggle({
  workspaceOpen,
  onToggle,
  isLb,
  lbDeskOpen,
  onLbToggle,
}: WorkspaceToggleProps) {
  if (workspaceOpen || lbDeskOpen) return null;

  return (
    <Box
      w="48px"
      bg="gray.50"
      borderLeft="1px solid"
      borderColor="gray.200"
      h="100%"
      position="relative"
    >
      <VStack
        position="absolute"
        top="16px"
        left="50%"
        transform="translateX(-50%)"
        gap={2}
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
          _hover={{ bg: 'green.100', shadow: 'md' }}
        >
          <IconSparkles size={16} color="green" />
        </IconButton>

        {isLb && onLbToggle && (
          <IconButton
            size="sm"
            variant="ghost"
            bg="teal.50"
            border="1px solid"
            borderColor="teal.200"
            borderRadius="full"
            shadow="sm"
            onClick={onLbToggle}
            title="Open Living Book Desk"
            _hover={{ bg: 'teal.100', shadow: 'md' }}
          >
            <IconBook2 size={16} color="teal" />
          </IconButton>
        )}
      </VStack>
    </Box>
  );
}
