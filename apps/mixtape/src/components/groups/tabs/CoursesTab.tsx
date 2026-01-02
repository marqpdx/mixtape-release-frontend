// src/components/groups/tabs/CoursesTab.tsx
//
import { Heading, Box, Text } from "@chakra-ui/react";
import type { Group } from "@mixtape/core/types/groupTypes";

export function CoursesTab({ group }: { group: Group }) {
  void group;
  return (
    <Box>
      <Heading size="lg" mb={4}>Courses</Heading>
      <Text color="gray.600">EarthLab courses will go here...</Text>
    </Box>
  );
}
