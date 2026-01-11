// apps/crossroads/src/app/about/page.tsx

"use client";

import { Box, Heading, Text } from "@chakra-ui/react";

export default function AboutPage() {
  return (
    <Box maxW="800px" mx="auto" py={16} px={6}>
      <Heading as="h1" size="xl" mb={4}>
        About
      </Heading>
      <Text fontSize="lg">
        Crossroads is a co-created community for makers, teachers, artists,
        learners, botanists, writers, scientists, carers, and others.
      </Text>
    </Box>
  );
}
