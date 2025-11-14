// src/components/groups/tabs/CoursesTab.tsx
//
import { Heading, Box, Text } from "@chakra-ui/react";

export function CoursesTab({ group }: { group: any }) {
  return (
    <Box>
      <Heading size="lg" mb={4}>Courses</Heading>
      <Text color="gray.600">EarthLab courses will go here...</Text>
    </Box>
  );
}