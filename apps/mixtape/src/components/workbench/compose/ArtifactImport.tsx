// src/components/workbench/compose/ArtifactImport.tsx
'use client';

import { Box, Text, VStack } from '@chakra-ui/react';

interface ArtifactImportProps {
  groupId: string;
  onDraftCreated?: (draftId: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ArtifactImport(_props: ArtifactImportProps) {
  return (
    <VStack align="stretch" gap={4}>
      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={2}>
          Import from Stackroom
        </Text>
        <Text fontSize="sm" color="gray.600">
          Search and import content from Stackroom artifacts.
        </Text>
      </Box>

      <Box
        border="2px dashed"
        borderColor="gray.300"
        borderRadius="md"
        p={8}
        textAlign="center"
        bg="gray.50"
      >
        <Text fontSize="xl" mb={2}>
          🚧 Coming Soon
        </Text>
        <Text fontSize="sm" color="gray.600" mb={4}>
          Stackroom integration will allow you to create drafts from existing artifacts and research.
        </Text>
        <Text fontSize="xs" color="gray.500">
          For now, use the Stackroom WorkArea to browse artifacts, then copy content to Rich Text mode.
        </Text>
      </Box>
    </VStack>
  );
}
