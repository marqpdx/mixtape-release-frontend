"use client";

import { Box, Container, Heading, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { MyGroupsList } from "@/components/studio/MyGroupsList";
import { PersonalActivitySection } from "@/components/studio/PersonalActivitySection";
import { PersonalStudioFeed } from "@/components/studio/PersonalStudioFeed";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={5}
      mb={4}
    >
      <Text fontWeight="semibold" mb={4}>{title}</Text>
      {children}
    </Box>
  );
}

export default function PersonalStudioPage() {
  const bgColor = useColorModeValue("gray.50", "gray.900");

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="4xl" py={8}>

        <Box mb={8}>
          <Heading size="lg" mb={1}>Studio</Heading>
          <Text fontSize="sm" color="gray.500">Personal</Text>
        </Box>

        <Section title="My Groups">
          <MyGroupsList />
        </Section>

        <Section title="Activity">
          <PersonalActivitySection />
        </Section>

        <Section title="My Content">
          <PersonalStudioFeed />
        </Section>

      </Container>
    </Box>
  );
}
