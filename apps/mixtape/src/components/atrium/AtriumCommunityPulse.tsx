"use client";

import { Box, Flex, NativeSelect, Skeleton, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePersonalGroups, useStudioGroupPulse } from "@mixtape/api/hooks/studio";
import type { StudioActivityItem } from "@mixtape/api/clients/studio/studioApi";

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ActivityRow({ item }: { item: StudioActivityItem }) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  return (
    <Flex align="baseline" gap={1} py={2} borderBottomWidth="1px" borderColor={useColorModeValue("gray.100", "gray.700")} _last={{ borderBottomWidth: 0 }}>
      <Text fontSize="sm" flex="1" lineClamp={1}>
        {item.summary}
      </Text>
      <Text fontSize="xs" color={mutedColor} flexShrink={0}>
        {relativeTime(item.timestamp)}
      </Text>
    </Flex>
  );
}

export function AtriumCommunityPulse() {
  const { user: identity } = useAuth();
  const { data: groups, isLoading: groupsLoading } = usePersonalGroups();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_GROUP_SLUG ?? "crossroads";
  const visibleGroups = identity?.is_superuser
    ? (groups ?? [])
    : (groups ?? []).filter((g) => g.slug !== defaultSlug);

  const activeSlug = selectedSlug ?? visibleGroups[0]?.slug ?? null;
  const { data: pulse, isLoading: pulseLoading } = useStudioGroupPulse(activeSlug ?? "");

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerColor = useColorModeValue("gray.600", "gray.400");

  const isLoading = groupsLoading || (!!activeSlug && pulseLoading);

  if (isLoading) {
    return (
      <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="md" py={5} px={5} h="100%">
        <Flex direction="column" gap={2}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height="36px" borderRadius="sm" />
          ))}
        </Flex>
      </Box>
    );
  }

  if (visibleGroups.length === 0) {
    return (
      <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="md" py={5} px={5} h="100%">
        <Text fontSize="sm" color={headerColor}>
          No groups yet.{" "}
          <Text as="span" color="blue.400">Find your community →</Text>
        </Text>
      </Box>
    );
  }

  const activeGroup = visibleGroups.find((g) => g.slug === activeSlug) ?? visibleGroups[0];
  const items = pulse?.activity?.slice(0, 7) ?? [];

  return (
    <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="md" py={5} px={5} h="100%">
      {/* Header */}
      <Flex align="center" justify="space-between" mb={3}>
        <Text fontSize="xs" fontWeight="medium" color={headerColor} textTransform="uppercase" letterSpacing="wider">
          {activeGroup.name}
        </Text>

        {visibleGroups.length > 1 && (
          <NativeSelect.Root size="xs" width="auto">
            <NativeSelect.Field
              value={activeSlug ?? ""}
              onChange={(e) => setSelectedSlug(e.target.value)}
            >
              {visibleGroups.map((g) => (
                <option key={g.slug} value={g.slug}>{g.name}</option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        )}
      </Flex>

      {/* Activity rows */}
      {items.length > 0 ? (
        <Box>
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </Box>
      ) : (
        <Text fontSize="sm" color={headerColor}>
          No recent activity yet.
        </Text>
      )}
    </Box>
  );
}
