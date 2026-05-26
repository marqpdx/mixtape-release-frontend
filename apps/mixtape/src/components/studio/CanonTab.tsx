"use client";

import { Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useGroupCanon } from "@mixtape/api/hooks/studio";
import type { CanonMetrics, CanonDocItem, CanonPathBucket } from "@mixtape/api/clients/studio/studioApi";

// ---------------------------------------------------------------------------
// Status metric strip
// ---------------------------------------------------------------------------

function StatusCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
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
      <Text fontSize="2xl" fontWeight="bold" color={accent}>{value}</Text>
      <Text fontSize="xs" color="gray.500" mt={0.5}>{label}</Text>
    </Box>
  );
}

function StatusStrip({ metrics }: { metrics: CanonMetrics }) {
  return (
    <HStack gap={4} align="stretch">
      <StatusCard label="Canon" value={metrics.canon} accent="green.500" />
      <StatusCard label="Working" value={metrics.working} />
      <StatusCard label="Needs Review" value={metrics.needs_review} accent="orange.400" />
      <StatusCard label="Stale" value={metrics.stale} accent="red.400" />
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Recently updated list
// ---------------------------------------------------------------------------

function DocRow({ item }: { item: CanonDocItem }) {
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const statusColor: Record<string, string> = {
    stale: "red.400",
    working: "gray.400",
    canon: "green.500",
    needs_review: "orange.400",
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
        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{item.title}</Text>
        {item.folder_path && (
          <Text fontSize="xs" color="gray.500" noOfLines={1}>{item.folder_path}</Text>
        )}
      </VStack>
      <Text
        fontSize="xs"
        color={statusColor[item.status] ?? "gray.400"}
        textTransform="capitalize"
        flexShrink={0}
        ml={2}
      >
        {item.status}
      </Text>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Library by path
// ---------------------------------------------------------------------------

function PathBucket({ item }: { item: CanonPathBucket }) {
  const borderColor = useColorModeValue("gray.100", "gray.700");

  return (
    <HStack
      justify="space-between"
      py={1.5}
      borderBottom="1px solid"
      borderColor={borderColor}
      _last={{ border: "none" }}
    >
      <Text fontSize="sm" color="gray.600" fontFamily="mono">{item.path}</Text>
      <Text fontSize="sm" fontWeight="medium">{item.doc_count}</Text>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// CanonTab
// ---------------------------------------------------------------------------

interface CanonTabProps {
  groupSlug: string;
}

export function CanonTab({ groupSlug }: CanonTabProps) {
  const { data, isLoading, error } = useGroupCanon(groupSlug);
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  if (isLoading) {
    return (
      <VStack gap={4} align="stretch">
        <HStack gap={4}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} flex="1" bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={4}>
              <Skeleton height="28px" mb={2} />
              <Skeleton height="12px" width="60%" />
            </Box>
          ))}
        </HStack>
        <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={5}>
          <Skeleton height="16px" width="40%" mb={4} />
          <VStack gap={3} align="stretch">
            {[1, 2, 3].map((i) => <Skeleton key={i} height="36px" borderRadius="md" />)}
          </VStack>
        </Box>
      </VStack>
    );
  }

  if (error) {
    return <Text fontSize="sm" color="red.400">Failed to load canon data.</Text>;
  }

  const { metrics, recently_updated, library_by_path } = data!;
  const hasLibrary = metrics.working + metrics.stale > 0;

  if (!hasLibrary) {
    return (
      <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={8} textAlign="center">
        <Text color="gray.400" fontSize="sm">No library connected to this group yet.</Text>
      </Box>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      <StatusStrip metrics={metrics} />

      {recently_updated.length > 0 && (
        <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={5}>
          <Text fontWeight="semibold" mb={4}>Recently Updated</Text>
          <VStack gap={0} align="stretch">
            {recently_updated.map((item) => (
              <DocRow key={item.id} item={item} />
            ))}
          </VStack>
        </Box>
      )}

      {library_by_path.length > 0 && (
        <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={5}>
          <Text fontWeight="semibold" mb={4}>Library by Path</Text>
          <VStack gap={0} align="stretch">
            {library_by_path.map((item) => (
              <PathBucket key={item.path} item={item} />
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
