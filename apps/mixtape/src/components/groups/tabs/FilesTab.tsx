// src/components/groups/tabs/FilesTab.tsx

import { Box, Heading, Text } from "@chakra-ui/react";
import type { Group } from "@mixtape/core/types/groupTypes";

export function FilesTab({ group }: { group: Group }) {
  void group;
  return (
    <Box>
      <Heading size="lg" mb={4}>Files & Resources</Heading>
      <Text color="gray.600">Shared documents and media gallery will go here...</Text>
    </Box>
  );
}
