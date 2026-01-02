// src/components/groups/tabs/MembersTab.tsx

import { Heading, Box, Text } from "@chakra-ui/react";
import type { Group } from "@mixtape/core/types/groupTypes";

export function MembersTab({ group }: { group: Group }) {
  void group;
  return (
    <Box>
      <Heading size="lg" mb={4}>Members</Heading>
      <Text color="gray.600">Member directory will go here...</Text>
    </Box>
  );
}
