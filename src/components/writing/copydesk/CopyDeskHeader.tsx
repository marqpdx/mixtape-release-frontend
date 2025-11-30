// src/components/write/copydesk/CopyDeskHeader.tsx

import React from 'react';
import {
  Box,
  HStack,
  Text,
  Button,
  IconButton
} from '@chakra-ui/react';
import { IconSeparatorVertical } from '@tabler/icons-react';

export interface CopyDeskHeaderProps {
  draftId?: string;
  onToggle: () => void;
  onCollapseAll: () => void;
}

export function CopyDeskHeader({
  draftId,
  onToggle,
  onCollapseAll
}: CopyDeskHeaderProps) {
  return (
    <HStack justify="space-between" align="center">
      <Box>
        <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={1}>
          Copy Desk
        </Text>
        <Text fontSize="xs" color="gray.500">
          {draftId ? "Editing saved draft" : "Editorial assistants & writing tools"}
        </Text>
      </Box>

      <HStack gap={2}>
        <Button
          size="xs"
          variant="ghost"
          onClick={onCollapseAll}
          title="Collapse all sections"
          fontSize="xs"
          color="gray.500"
        >
          Collapse All
        </Button>

        <IconButton
          size="sm"
          variant="ghost"
          bg="red.50"
          border="1px solid"
          borderColor="red.200"
          borderRadius="full"
          onClick={onToggle}
          title="Close Copy Desk"
          _hover={{ bg: "red.100" }}
        >
          <IconSeparatorVertical size={16} color="red" />
        </IconButton>
      </HStack>
    </HStack>
  );
}