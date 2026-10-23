"use client";

import { Box, Container, Heading, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { LoungeView } from "@/components/studio/LoungeView";

export default function PersonalStudioPage() {
  const bgColor = useColorModeValue("gray.50", "gray.900");

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="2xl" py={8}>

        <Box mb={6}>
          <Heading size="lg" mb={1}>Lounge</Heading>
          <Text fontSize="sm" color="gray.500">Studio — Personal</Text>
        </Box>

        <LoungeView />

      </Container>
    </Box>
  );
}
