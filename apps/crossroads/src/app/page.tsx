"use client";

import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react";

export default function HomePage() {
  return (
    <Container maxW="container.xl" py={10}>
      <VStack gap={6} align="stretch">
        <Box textAlign="center">
          <Heading size="4xl" mb={4}>
            Crossroads
          </Heading>
          <Text fontSize="xl" color="gray.600">
            Welcome to Crossroads - A community platform
          </Text>
        </Box>

        <Box p={8} borderWidth={1} borderRadius="lg" bg="gray.50">
          <Heading size="lg" mb={4}>
            Public Site Placeholder
          </Heading>
          <Text>
            This is the Crossroads public-facing site served at crossroads.place/
          </Text>
          <Text mt={2}>
            The workspace application is available at /app
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
