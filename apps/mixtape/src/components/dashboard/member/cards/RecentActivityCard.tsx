"use client";

import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useNotificationsPage } from "@mixtape/api/hooks/activity/useActivity";
import type { UserIdentity } from "@mixtape/core/types/auth";
import DashboardCard from "./DashboardCard";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface RecentActivityCardProps {
  identity: UserIdentity;
  onViewAll: () => void;
}

export default function RecentActivityCard({ identity, onViewAll }: RecentActivityCardProps) {
  void identity;
  const { page, isLoading } = useNotificationsPage({});
  const items = page?.results?.slice(0, 5) ?? [];

  const timeColor = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  return (
    <DashboardCard
      title="Recent Activity"
      viewAllOnClick={onViewAll}
      isLoading={isLoading}
      isEmpty={items.length === 0}
      emptyMessage="No recent activity"
    >
      <VStack gap={0} align="stretch">
        {items.map((item) => (
          <HStack
            key={item.id}
            px={2}
            py={2}
            borderRadius="md"
            _hover={{ bg: hoverBg }}
            cursor={item.action_url ? "pointer" : "default"}
            onClick={() => {
              if (item.action_url) window.location.href = item.action_url;
            }}
          >
            <Box flex="1" minW={0}>
              <Text fontSize="sm" lineClamp={1}>
                {item.actor_name && (
                  <Text as="span" fontWeight="medium">{item.actor_name} </Text>
                )}
                {item.verb || item.action_code || "activity"}
                {item.object_name && (
                  <Text as="span"> {item.object_name}</Text>
                )}
              </Text>
            </Box>
            <Text fontSize="xs" color={timeColor} flexShrink={0}>
              {timeAgo(item.last_occurred_at)}
            </Text>
          </HStack>
        ))}
      </VStack>
    </DashboardCard>
  );
}
