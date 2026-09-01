import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react";

export default function WhatWeDoAndWhyPage() {
  return (
    <Box py={{ base: 14, md: 20 }}>
      <Container maxW="920px" px={{ base: 5, md: 8 }}>
        <VStack align="start" gap={6}>
          <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
            About
          </Text>
          <Heading
            as="h1"
            fontFamily='Georgia, "Times New Roman", serif'
            fontWeight="400"
            fontSize={{ base: "3xl", md: "4xl" }}
            letterSpacing="0"
          >
            What we do, and why
          </Heading>
          <Text color="#5C6880" lineHeight="1.8" maxW="70ch">
            This page is the next part of the story arc. We will use it to describe what Crossroads does, why the work takes these forms, and how the offerings relate back to mission, vision, and practice.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
