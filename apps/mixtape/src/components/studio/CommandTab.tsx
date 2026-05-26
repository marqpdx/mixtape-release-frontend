"use client";

import { Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useGroupCommand } from "@mixtape/api/hooks/studio";
import type { CommandMetrics, ActiveOp } from "@mixtape/api/clients/studio/studioApi";

// ---------------------------------------------------------------------------
// Metric strip
// ---------------------------------------------------------------------------

function MetricCard({ label, value }: { label: string; value: number | string }) {
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

function MetricStrip({ metrics }: { metrics: CommandMetrics }) {
  const passRate = metrics.schema_pass_rate !== null
    ? `${Math.round(metrics.schema_pass_rate * 100)}%`
    : "—";

  return (
    <HStack gap={4} align="stretch">
      <MetricCard label="Ops in Flight" value={metrics.ops_in_flight} />
      <MetricCard label="Awaiting Approval" value={metrics.awaiting_approval} />
      <MetricCard label="Schema Pass Rate" value={passRate} />
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Active ops list
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  running: "blue.400",
  pending: "orange.400",
  succeeded: "green.400",
  failed: "red.400",
};

function OpRow({ op }: { op: ActiveOp }) {
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const monoColor = useColorModeValue("gray.600", "gray.400");

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
      py={2.5}
      borderBottom="1px solid"
      borderColor={borderColor}
      _last={{ border: "none" }}
      align="start"
    >
      <VStack align="start" gap={0.5} flex={1} minW={0}>
        <Text fontSize="sm" fontWeight="medium" lineClamp={1}>{op.verb}</Text>
        <Text fontSize="xs" color={monoColor} fontFamily="mono" lineClamp={1}>{op.tool_name}</Text>
        {op.description && (
          <Text fontSize="xs" color="gray.500" lineClamp={1}>{op.description}</Text>
        )}
      </VStack>
      <VStack align="end" gap={0.5} flexShrink={0} ml={3}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color={STATUS_COLORS[op.status] ?? "gray.400"}
          textTransform="capitalize"
        >
          {op.status}
        </Text>
        <Text fontSize="xs" color="gray.400">{relativeTime(op.created_at)}</Text>
      </VStack>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// CommandTab
// ---------------------------------------------------------------------------

interface CommandTabProps {
  groupSlug: string;
}

export function CommandTab({ groupSlug }: CommandTabProps) {
  const { data, isLoading, error } = useGroupCommand(groupSlug);
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  if (isLoading) {
    return (
      <VStack gap={4} align="stretch">
        <HStack gap={4}>
          {[1, 2, 3].map((i) => (
            <Box key={i} flex="1" bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={4}>
              <Skeleton height="28px" mb={2} />
              <Skeleton height="12px" width="60%" />
            </Box>
          ))}
        </HStack>
        <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={5}>
          <Skeleton height="16px" width="30%" mb={4} />
          <VStack gap={3} align="stretch">
            {[1, 2, 3].map((i) => <Skeleton key={i} height="52px" borderRadius="md" />)}
          </VStack>
        </Box>
      </VStack>
    );
  }

  if (error) {
    return <Text fontSize="sm" color="red.400">Failed to load command data.</Text>;
  }

  const { metrics, active_ops } = data!;

  return (
    <VStack gap={4} align="stretch">
      <MetricStrip metrics={metrics} />

      <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={5}>
        <Text fontWeight="semibold" mb={4}>Active Ops</Text>
        {active_ops.length === 0 ? (
          <Text fontSize="sm" color="gray.400">No active ops.</Text>
        ) : (
          <VStack gap={0} align="stretch">
            {active_ops.map((op) => (
              <OpRow key={op.id} op={op} />
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}
