// src/components/groups/tabs/MembersTab.tsx

import { Heading, Box, Text } from "@chakra-ui/react";


export function MembersTab({ group }: { group: any }) {
  return (
    <Box>
      <Heading size="lg" mb={4}>Members</Heading>
      <Text color="gray.600">Member directory will go here...</Text>
    </Box>
  );
}