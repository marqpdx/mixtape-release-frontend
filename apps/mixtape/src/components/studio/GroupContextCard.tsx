"use client";

import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { PersonalGroupItem, StudioActivityItem } from "@mixtape/api/clients/studio/studioApi";
import { useRouter } from "next/navigation";

interface Props {
  group: PersonalGroupItem;
  digestItems: StudioActivityItem[];
}

function relativeTime(ts: string | null): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function GroupContextCard({ group, digestItems }: Props) {
  const router = useRouter();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const itemBorder = useColorModeValue("gray.100", "gray.700");
  const roleBg = useColorModeValue("gray.100", "gray.700");

  const top3 = digestItems.slice(0, 3);

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <HStack justify="space-between" align="start" mb={top3.length > 0 ? 3 : 0}>
        <VStack align="start" gap={0}>
          <Text fontWeight="semibold" fontSize="sm">{group.name}</Text>
          <Text
            fontSize="xs"
            bg={roleBg}
            px={1.5}
            py={0.5}
            borderRadius="sm"
            textTransform="capitalize"
            color={mutedColor}
          >
            {group.role}
          </Text>
        </VStack>
        <Button
          size="xs"
          variant="outline"
          onClick={() => router.push(`/studio/${group.slug}`)}
        >
          Go →
        </Button>
      </HStack>

      {top3.length > 0 ? (
        <VStack gap={0} align="stretch">
          {top3.map((item) => (
            <HStack
              key={item.id}
              justify="space-between"
              py={2}
              borderTop="1px solid"
              borderColor={itemBorder}
            >
              <VStack align="start" gap={0} flex={1} minW={0}>
                <Text fontSize="xs" fontWeight="medium" lineClamp={1}>{item.verb}</Text>
                {item.summary && (
                  <Text fontSize="xs" color={mutedColor} lineClamp={1}>{item.summary}</Text>
                )}
              </VStack>
              <Text fontSize="xs" color={mutedColor} flexShrink={0} ml={2}>
                {relativeTime(item.timestamp)}
              </Text>
            </HStack>
          ))}
        </VStack>
      ) : (
        <Text fontSize="xs" color={mutedColor}>Quiet.</Text>
      )}
    </Box>
  );
}
