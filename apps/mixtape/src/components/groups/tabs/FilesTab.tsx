// src/components/groups/tabs/FilesTab.tsx

import { Box, Heading, Text } from "@chakra-ui/react";

export function FilesTab({ group }: { group: any }) {
  return (
    <Box>
      <Heading size="lg" mb={4}>Files & Resources</Heading>
      <Text color="gray.600">Shared documents and media gallery will go here...</Text>
    </Box>
  );
}