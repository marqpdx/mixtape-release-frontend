"use client";

import { Box, Flex, Link, Skeleton, Text, Tooltip } from "@chakra-ui/react";
import { IconInfoCircle, IconTarget } from "@tabler/icons-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useColorModeValue } from "@components/ui/color-mode";
import { useRadarInitiatives } from "@mixtape/api/hooks/radar";
import type { RadarInitiative } from "@mixtape/api/clients/radar/radarApi";

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function InitiativeRow({ initiative }: { initiative: RadarInitiative }) {
  const router = useRouter();
  const hoverBg = useColorModeValue("gray.50", "gray.750");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex
      h="44px"
      align="center"
      gap={3}
      px={2}
      cursor="pointer"
      borderRadius="sm"
      _hover={{ bg: hoverBg }}
      onClick={() => router.push(`/radar/${initiative.id}`)}
    >
      <Box color="blue.400" flexShrink={0}>
        <IconTarget size={16} />
      </Box>

      <Text fontSize="sm" flex="1" lineClamp={1} fontWeight="medium">
        {initiative.title}
      </Text>

      <Text fontSize="xs" color={mutedColor} flexShrink={0}>
        Initiative
      </Text>

      <Text fontSize="xs" color={mutedColor} flexShrink={0} minW="32px" textAlign="right">
        {relativeTime(initiative.member_last_active_at)}
      </Text>
    </Flex>
  );
}

export function AtriumOrientationPanel() {
  const { data, isLoading } = useRadarInitiatives();
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const panelBg = useColorModeValue("white", "gray.800");
  const headerColor = useColorModeValue("gray.600", "gray.400");

  if (isLoading) {
    return (
      <Flex direction="column" gap={2}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height="44px" borderRadius="sm" />
        ))}
      </Flex>
    );
  }

  const items = data?.slice(0, 10) ?? [];

  if (items.length === 0) return null;

  return (
    <Box
      bg={panelBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      py={4}
      px={5}
    >
      {/* Panel header */}
      <Flex align="center" justify="space-between" mb={1}>
        <Flex align="center" gap={1}>
          <Text fontSize="xs" fontWeight="medium" color={headerColor} textTransform="uppercase" letterSpacing="wider">
            Recently active
          </Text>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Box color={headerColor} cursor="default">
                <IconInfoCircle size={13} />
              </Box>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <Text fontSize="xs">Sorted by your most recent activity</Text>
            </Tooltip.Content>
          </Tooltip.Root>
        </Flex>

        <Link as={NextLink} href="/radar/my" fontSize="xs" color="blue.400">
          View all →
        </Link>
      </Flex>

      {/* Item rows — no dividers, hover lift only */}
      <Box>
        {items.map((initiative) => (
          <InitiativeRow key={initiative.id} initiative={initiative} />
        ))}
      </Box>
    </Box>
  );
}
