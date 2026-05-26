"use client";

import { Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useStudioGroupPulse } from "@mixtape/api/hooks/studio";
import type { GroupPulseMetrics, StudioActivityItem } from "@mixtape/api/clients/studio/studioApi";

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({ label, value }: { label: string; value: number }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      flex="1"
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      minW="0"
    >
      <Text fontSize="2xl" fontWeight="bold">{value}</Text>
      <Text fontSize="xs" color="gray.500" mt={0.5}>{label}</Text>
    </Box>
  );
}

function MetricStrip({ metrics }: { metrics: GroupPulseMetrics }) {
  return (
    <HStack gap={4} align="stretch">
      <MetricCard label="Active Threads" value={metrics.active_threads} />
      <MetricCard label="Pending Approvals" value={metrics.pending_approvals} />
      <MetricCard label="New Members (7d)" value={metrics.new_members} />
      <MetricCard label="Ops in Flight" value={metrics.loom_ops_in_flight} />
    </HStack>
  );
}

function MetricStripSkeleton() {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
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
          <Skeleton height="28px" mb={2} />
          <Skeleton height="12px" width="60%" />
        </Box>
      ))}
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

function ActivityRow({ item }: { item: StudioActivityItem }) {
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const relativeTime = (ts: string | null) => {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <HStack
      justify="space-between"
      py={2}
      borderBottom="1px solid"
      borderColor={borderColor}
      _last={{ border: "none" }}
    >
      <VStack align="start" gap={0} flex={1} minW={0}>
        <Text fontSize="sm" fontWeight="medium" lineClamp={1}>{item.verb}</Text>
        {item.summary && (
          <Text fontSize="xs" color="gray.500" lineClamp={1}>{item.summary}</Text>
        )}
      </VStack>
      <Text fontSize="xs" color="gray.400" flexShrink={0} ml={2}>
        {relativeTime(item.timestamp)}
      </Text>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// PulseTab
// ---------------------------------------------------------------------------

interface PulseTabProps {
  groupSlug: string;
}

export function PulseTab({ groupSlug }: PulseTabProps) {
  const { data, isLoading, error } = useStudioGroupPulse(groupSlug);
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  if (isLoading) {
    return (
      <VStack gap={4} align="stretch">
        <MetricStripSkeleton />
        <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={5}>
          <Text fontWeight="semibold" mb={4}>Activity</Text>
          <VStack gap={3} align="stretch">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} height="36px" borderRadius="md" />)}
          </VStack>
        </Box>
      </VStack>
    );
  }

  if (error) {
    return <Text fontSize="sm" color="red.400">Failed to load pulse data.</Text>;
  }

  return (
    <VStack gap={4} align="stretch">
      <MetricStrip metrics={data!.metrics} />

      <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={5}>
        <Text fontWeight="semibold" mb={4}>Activity</Text>
        {data!.activity.length === 0 ? (
          <Text fontSize="sm" color="gray.400">No recent activity.</Text>
        ) : (
          <VStack gap={0} align="stretch">
            {data!.activity.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}
