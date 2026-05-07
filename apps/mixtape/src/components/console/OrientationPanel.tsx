"use client";

import {
  Badge,
  Box,
  HStack,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useColorModeValue } from "@components/ui/color-mode";
import { useOrientation } from "@hooks/console/useConsole";

function formatRelative(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function OrientationPanel() {
  const { data, isLoading } = useOrientation();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.750");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  if (isLoading) {
    return (
      <VStack gap={2} align="stretch">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} h="48px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  const initiatives = data?.initiatives ?? [];
  const groups = data?.groups ?? [];

  if (initiatives.length === 0 && groups.length === 0) {
    return (
      <Text fontSize="sm" color={mutedColor}>
        No active initiatives or groups yet.
      </Text>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {initiatives.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Initiatives
          </Text>
          <VStack gap={1} align="stretch">
            {initiatives.map((ini) => (
              <Link key={ini.id} href={`/aperture`}>
                <HStack
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="md"
                  px={3}
                  py={2}
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  justify="space-between"
                >
                  <Text fontSize="sm" flex={1} lineClamp={1}>
                    {ini.title}
                  </Text>
                  <HStack gap={2}>
                    <Badge size="sm" colorPalette="green" variant="subtle">
                      {ini.status}
                    </Badge>
                    <Text fontSize="xs" color={mutedColor}>
                      {formatRelative(ini.updated_at)}
                    </Text>
                  </HStack>
                </HStack>
              </Link>
            ))}
          </VStack>
        </Box>
      )}

      {groups.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Groups
          </Text>
          <VStack gap={1} align="stretch">
            {groups.map((group) => (
              <HStack
                key={group.id}
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="md"
                px={3}
                py={2}
                justify="space-between"
                gap={2}
              >
                <Link href={`/groups/${group.slug}`} style={{ flex: 1, minWidth: 0 }}>
                  <Text fontSize="sm" lineClamp={1} _hover={{ textDecoration: "underline" }}>
                    {group.title}
                  </Text>
                </Link>
                <HStack gap={2} flexShrink={0}>
                  <Text fontSize="xs" color={mutedColor}>
                    {formatRelative(group.updated_at)}
                  </Text>
                  <Link href={`/groups/${group.slug}/workbench`}>
                    <Text fontSize="xs" color="blue.500" _hover={{ textDecoration: "underline" }}>
                      workbench
                    </Text>
                  </Link>
                </HStack>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
