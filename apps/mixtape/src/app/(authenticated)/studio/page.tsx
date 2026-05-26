// apps/mixtape/src/app/(authenticated)/studio/page.tsx

"use client";

import { Box, Container, Heading, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

export default function PersonalStudioPage() {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="4xl" py={8}>

        {/* Header skeleton */}
        <Box mb={8}>
          <Heading size="lg" mb={1}>Studio</Heading>
          <Text fontSize="sm" color="gray.500">Personal</Text>
        </Box>

        {/* My Groups section skeleton */}
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg"
          p={5}
          mb={4}
        >
          <Text fontWeight="semibold" mb={4}>My Groups</Text>
          <VStack gap={3} align="stretch">
            <Skeleton height="48px" borderRadius="md" />
            <Skeleton height="48px" borderRadius="md" />
            <Skeleton height="48px" borderRadius="md" />
          </VStack>
        </Box>

        {/* Activity feed skeleton */}
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg"
          p={5}
          mb={4}
        >
          <Text fontWeight="semibold" mb={4}>Activity</Text>
          <VStack gap={3} align="stretch">
            <Skeleton height="36px" borderRadius="md" />
            <Skeleton height="36px" borderRadius="md" />
            <Skeleton height="36px" borderRadius="md" />
            <Skeleton height="36px" borderRadius="md" />
          </VStack>
        </Box>

        {/* My Content skeleton */}
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="lg"
          p={5}
        >
          <Text fontWeight="semibold" mb={4}>My Content</Text>
          <VStack gap={3} align="stretch">
            <Skeleton height="36px" borderRadius="md" />
            <Skeleton height="36px" borderRadius="md" />
          </VStack>
        </Box>

      </Container>
    </Box>
  );
}
