// apps/mixtape/src/app/(authenticated)/studio/[groupSlug]/page.tsx

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Container, HStack, Heading, Skeleton, Spinner, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useGroup } from "@mixtape/api/hooks/groups/useGroups";
import { useAuth } from "@/lib/auth/AuthContext";
import { canUserModerateGroup } from "@mixtape/core/types/groupTypes";

export default function GroupStudioPage() {
  const { groupSlug } = useParams<{ groupSlug: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { group, isLoading: groupLoading } = useGroup(groupSlug);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const chipBg = useColorModeValue("gray.100", "gray.700");

  const isAdmin = group ? canUserModerateGroup(group) : false;
  const isSuperadmin = user?.is_staff || user?.is_superuser;
  const canAccess = isAdmin || isSuperadmin;
  const isReady = !authLoading && !groupLoading;

  // Non-admins redirect to Personal Studio
  useEffect(() => {
    if (!isReady) return;
    if (group && !canAccess) {
      router.replace("/studio");
    }
  }, [isReady, group, canAccess, router]);

  // Loading state — while auth or group resolves
  if (!isReady || (group && !canAccess)) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  // Group not found
  if (!group) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Text color="gray.500">Group not found.</Text>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="5xl" py={8}>

        {/* Scope bar — always visible in Group Studio */}
        <HStack mb={6} gap={2} fontSize="sm" color="gray.500">
          <Text
            as="button"
            _hover={{ color: "blue.500" }}
            onClick={() => router.push("/studio")}
          >
            Studio
          </Text>
          <Text>/</Text>
          <Text fontWeight="medium" color="gray.700">{group.title}</Text>
        </HStack>

        {/* Group header */}
        <Box mb={6}>
          <Heading size="lg" mb={1}>{group.title}</Heading>
          <Text fontSize="sm" color="gray.500">Group Studio</Text>
        </Box>

        {/* Work area chip strip skeleton */}
        <HStack mb={6} gap={2} flexWrap="wrap">
          {[1, 2, 3].map((i) => (
            <Box
              key={i}
              bg={chipBg}
              borderRadius="full"
              px={3}
              py={1}
            >
              <Skeleton height="14px" width="60px" borderRadius="full" />
            </Box>
          ))}
        </HStack>

        {/* Tab navigation skeleton */}
        <HStack mb={6} gap={0} borderBottom="1px solid" borderColor={borderColor}>
          {["Pulse", "Canon", "Command"].map((tab) => (
            <Box
              key={tab}
              px={4}
              py={2}
              fontSize="sm"
              fontWeight="medium"
              color="gray.400"
              borderBottom="2px solid transparent"
            >
              {tab}
            </Box>
          ))}
        </HStack>

        {/* Tab content skeleton (Pulse) */}
        <VStack gap={4} align="stretch">
          {/* Metric strip */}
          <HStack gap={4}>
            {[1, 2, 3, 4].map((i) => (
              <Box
                key={i}
                flex="1"
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                p={4}
              >
                <Skeleton height="24px" mb={1} />
                <Skeleton height="12px" width="60%" />
              </Box>
            ))}
          </HStack>

          {/* Activity feed */}
          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="lg"
            p={5}
          >
            <Text fontWeight="semibold" mb={4}>Activity</Text>
            <VStack gap={3} align="stretch">
              <Skeleton height="36px" borderRadius="md" />
              <Skeleton height="36px" borderRadius="md" />
              <Skeleton height="36px" borderRadius="md" />
              <Skeleton height="36px" borderRadius="md" />
            </VStack>
          </Box>
        </VStack>

      </Container>
    </Box>
  );
}
