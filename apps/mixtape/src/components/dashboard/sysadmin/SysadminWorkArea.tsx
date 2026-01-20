// apps/mixtape/src/components/dashboard/sysadmin/SysadminWorkArea.tsx

// =====================================================
// SYSADMIN WORK AREA - Technical monitoring
// =====================================================

// import { UserIdentity } from "@components/auth/interfaces";

import { useMemo, useState, useCallback } from "react";
import { WorkAreaProps } from "../shared/types";
import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";
import { VStack, Text, SimpleGrid, Card, Badge, HStack, Button, Code } from "@chakra-ui/react";
import { UserIdentity } from "@mixtape/core/types/auth";
import { useOpsSummary, useOpsSnapshot } from "@mixtape/api/hooks/ops/useOps";


// src/components/dashboard/sysadmin/SysadminWorkArea.tsx
interface SysadminWorkAreaProps extends WorkAreaProps {
  identity: UserIdentity;
}

export default function SysadminWorkArea({
  section,
  identity,
}: SysadminWorkAreaProps) {
  const isSuperuser = !!identity?.is_superuser;
  const { data: summary, isLoading, error, refetch: refetchSummary, isFetching } =
    useOpsSummary({ enabled: isSuperuser });
  const { data: snapshot } = useOpsSnapshot({ enabled: isSuperuser });
  const [showSnapshot, setShowSnapshot] = useState(false);

  const handleDownloadSnapshot = useCallback(() => {
    if (!snapshot) return;
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = snapshot.generated_at?.replace(/[:.]/g, "-") || "snapshot";
    link.href = url;
    link.download = `ops-snapshot-${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [snapshot]);

  const handleCopySnapshot = useCallback(async () => {
    if (!snapshot) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    } catch {
      // Swallow errors; clipboard may be unavailable
    }
  }, [snapshot]);

  const lastUpdated = useMemo(() => {
    if (!summary?.timestamp) return null;
    return new Date(summary.timestamp).toLocaleString();
  }, [summary?.timestamp]);

  const backupIssues = useMemo(() => {
    const services = snapshot?.services;
    if (!services || typeof services !== "object") return [];
    const servicesRecord = services as Record<string, unknown>;
    const data = servicesRecord.data;
    if (!data || typeof data !== "object") return [];
    const dataRecord = data as Record<string, unknown>;
    const backups = dataRecord.backups;
    if (!backups || typeof backups !== "object") return [];
    const backupsRecord = backups as Record<string, unknown>;
    const summaryRecord = backupsRecord.summary;
    if (!summaryRecord || typeof summaryRecord !== "object") return [];
    const summary = summaryRecord as Record<string, unknown>;
    const issues = summary.issues;
    if (!Array.isArray(issues)) return [];
    return issues;
  }, [snapshot]);

  if (!isSuperuser) {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">Access Denied</Text>
          <Text>Superuser access is required for sysadmin tools.</Text>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "system-overview") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={6}>
          <HStack justify="space-between">
            <Text fontSize="2xl" fontWeight="bold">🔧 System Overview</Text>
            {summary?.overall_status && (
              <Badge
                colorScheme={
                  summary.overall_status === "healthy"
                    ? "green"
                    : summary.overall_status === "degraded"
                      ? "orange"
                      : "red"
                }
              >
                {summary.overall_status}
              </Badge>
            )}
          </HStack>

          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.500">
              {lastUpdated ? `Last updated ${lastUpdated}` : "No timestamp yet"}
            </Text>
            <HStack gap={2}>
              <Button size="sm" onClick={() => refetchSummary()} loading={isFetching}>
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowSnapshot(prev => !prev)}>
                {showSnapshot ? "Hide snapshot" : "View snapshot"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadSnapshot}
                disabled={!snapshot}
              >
                Download JSON
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopySnapshot}
                disabled={!snapshot}
              >
                Copy JSON
              </Button>
            </HStack>
          </HStack>

          {isLoading && <Text>Loading system summary...</Text>}
          {error && <Text color="red.500">Unable to load summary.</Text>}

          {summary && (
            <>
              <Card.Root>
                <Card.Header>
                  <Text fontSize="lg" fontWeight="semibold">{summary.headline}</Text>
                </Card.Header>
                <Card.Body>
                  <VStack align="stretch" gap={2}>
                    {summary.highlights.map((item, idx) => (
                      <Text key={`${item}-${idx}`}>• {item}</Text>
                    ))}
                  </VStack>
                </Card.Body>
              </Card.Root>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                {summary.tiles.map((tile) => (
                  <Card.Root key={tile.title}>
                    <Card.Header>
                      <HStack justify="space-between">
                        <Text fontSize="md" fontWeight="semibold">{tile.title}</Text>
                        <Badge
                          colorScheme={
                            tile.status === "healthy"
                              ? "green"
                              : tile.status === "degraded"
                                ? "orange"
                                : "red"
                          }
                        >
                          {tile.status}
                        </Badge>
                      </HStack>
                    </Card.Header>
                    <Card.Body>
                      <VStack align="stretch" gap={2}>
                        <Text>{tile.detail}</Text>
                        {tile.hint && (
                          <Text fontSize="sm" color="gray.500">{tile.hint}</Text>
                        )}
                        {tile.title === "Backups" && backupIssues.length > 0 && (
                          <VStack align="stretch" gap={1}>
                            {backupIssues.map((issue: string) => (
                              <Text key={issue} fontSize="sm" color="orange.500">
                                • {issue}
                              </Text>
                            ))}
                          </VStack>
                        )}
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                ))}
              </SimpleGrid>

              {showSnapshot && snapshot && (
                <Card.Root>
                  <Card.Header>
                    <Text fontSize="lg" fontWeight="semibold">Raw snapshot</Text>
                  </Card.Header>
                  <Card.Body>
                    <Code
                      display="block"
                      whiteSpace="pre"
                      fontSize="xs"
                      p={3}
                      borderRadius="md"
                      overflowX="auto"
                    >
                      {JSON.stringify(snapshot, null, 2)}
                    </Code>
                  </Card.Body>
                </Card.Root>
              )}
            </>
          )}
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "performance-metrics") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">📈 Performance Metrics</Text>
          <Text>Performance monitoring coming soon...</Text>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  // Default fallback
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={4}>
        <Text fontSize="xl" fontWeight="bold">Section: {section}</Text>
        <Text>This sysadmin section is under development.</Text>
      </VStack>
    </WorkAreaWrapper>
  );
}
