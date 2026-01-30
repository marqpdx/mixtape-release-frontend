// apps/mixtape/src/components/dashboard/sysadmin/SysadminWorkArea.tsx

"use client";

import { useMemo, useCallback } from "react";
import { WorkAreaProps } from "../shared/types";
import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";
import {
  VStack,
  Text,
  SimpleGrid,
  Card,
  Badge,
  HStack,
  Button,
  Code,
  Table,
  Box,
} from "@chakra-ui/react";
import { UserIdentity } from "@mixtape/core/types/auth";
import { useOpsSummary, useOpsSnapshot } from "@mixtape/api/hooks/ops/useOps";

interface SysadminWorkAreaProps extends WorkAreaProps {
  identity: UserIdentity;
}

// Type helpers for snapshot data
interface ServiceState {
  active_state?: string;
  sub_state?: string;
  uptime_seconds?: number;
  memory_bytes?: number;
  status?: string;
  pressure?: string;
  ownership?: {
    primary_resource?: string;
    burst_tolerance?: string;
    starvation_sensitivity?: string;
    recovery?: string;
    blast_radius?: string;
  };
}

interface ServiceUnits {
  units?: Record<string, ServiceState>;
}

interface BackupsSummary {
  status?: string;
  issues?: string[];
}

interface ProcessInfo {
  pid: number;
  command: string;
  rss_bytes: number;
  cpu_percent: number;
  elapsed_seconds: number;
}

// Helper to format bytes
function formatBytes(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// Helper to format uptime
function formatUptime(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null) return "—";
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

// Status colors
function getStatusColor(status: string | undefined): string {
  if (status === "healthy" || status === "active" || status === "ok") return "green";
  if (status === "degraded" || status === "concerning" || status === "warn") return "orange";
  if (status === "critical" || status === "failed" || status === "inactive" || status === "crit") return "red";
  return "gray";
}

// Status badge component
function StatusBadge({ status }: { status: string | undefined }) {
  return <Badge colorScheme={getStatusColor(status)}>{status || "unknown"}</Badge>;
}

// Emoji map for tiles
const TILE_EMOJI: Record<string, string> = {
  "Core services": "⚡",
  "Storage": "💾",
  "Background work": "⚙️",
  "Backups": "🗄️",
  // Fallbacks
  "Database": "🗃️",
  "API": "🌐",
  "Message Broker": "📨",
  "Workers": "👷",
  "Memory": "🧠",
  "Disk": "💿",
  "Network": "🌐",
};

function getTileEmoji(title: string): string {
  return TILE_EMOJI[title] || "📊";
}

// Service detail card
function ServiceCard({
  name,
  state,
  showOwnership = false,
}: {
  name: string;
  state: ServiceState | undefined;
  showOwnership?: boolean;
}) {
  if (!state) {
    return (
      <Card.Root borderLeftWidth="4px" borderLeftColor="gray.300">
        <Card.Header>
          <HStack justify="space-between">
            <Text fontWeight="semibold">{name}</Text>
            <Badge colorScheme="gray">no data</Badge>
          </HStack>
        </Card.Header>
      </Card.Root>
    );
  }

  const status = state.status || state.active_state;

  return (
    <Card.Root borderLeftWidth="4px" borderLeftColor={`${getStatusColor(status)}.500`}>
      <Card.Header>
        <HStack justify="space-between">
          <Text fontWeight="semibold">{name}</Text>
          <StatusBadge status={status} />
        </HStack>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={2}>
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">State</Text>
            <Text fontSize="sm">{state.active_state} / {state.sub_state}</Text>
          </HStack>
          {state.uptime_seconds !== undefined && (
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">Uptime</Text>
              <Text fontSize="sm">{formatUptime(state.uptime_seconds)}</Text>
            </HStack>
          )}
          {state.memory_bytes !== undefined && state.memory_bytes > 0 && (
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">Memory</Text>
              <Text fontSize="sm">{formatBytes(state.memory_bytes)}</Text>
            </HStack>
          )}
          {state.pressure && state.pressure !== "expected" && (
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">Pressure</Text>
              <Badge colorScheme={state.pressure === "concerning" ? "orange" : "red"}>
                {state.pressure}
              </Badge>
            </HStack>
          )}
          {showOwnership && state.ownership && (
            <Box mt={2} pt={2} borderTopWidth="1px">
              <Text fontSize="xs" color="gray.500" mb={1}>Resource Profile</Text>
              <Text fontSize="xs">{state.ownership.primary_resource}</Text>
              <Text fontSize="xs" color="gray.500">
                Burst: {state.ownership.burst_tolerance} |
                Starvation: {state.ownership.starvation_sensitivity}
              </Text>
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

// Multi-unit service card (e.g., seaweedfs, backups)
function MultiUnitServiceCard({
  name,
  data,
  backupsSummary,
}: {
  name: string;
  data: ServiceUnits | undefined;
  backupsSummary?: BackupsSummary;
}) {
  const units = data?.units || {};
  const unitNames = Object.keys(units);

  // Determine overall status from units or backup summary
  const overallStatus = backupsSummary?.status ||
    (unitNames.some(u => units[u]?.active_state === "failed") ? "critical" :
     unitNames.some(u => units[u]?.active_state === "inactive") ? "degraded" : "healthy");

  if (unitNames.length === 0) {
    return (
      <Card.Root borderLeftWidth="4px" borderLeftColor="gray.300">
        <Card.Header>
          <HStack justify="space-between">
            <Text fontWeight="semibold">{name}</Text>
            <Badge colorScheme="gray">no data</Badge>
          </HStack>
        </Card.Header>
      </Card.Root>
    );
  }

  return (
    <Card.Root borderLeftWidth="4px" borderLeftColor={`${getStatusColor(overallStatus)}.500`}>
      <Card.Header>
        <HStack justify="space-between">
          <Text fontWeight="semibold">{name}</Text>
          {backupsSummary && <StatusBadge status={backupsSummary.status} />}
        </HStack>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={2}>
          {unitNames.map((unitName) => {
            const unit = units[unitName];
            const shortName = unitName.replace(/^crossroads-/, "").replace(/\.service$/, "").replace(/\.timer$/, " (timer)");
            return (
              <HStack key={unitName} justify="space-between">
                <Text fontSize="sm">{shortName}</Text>
                <StatusBadge status={unit?.status || unit?.active_state} />
              </HStack>
            );
          })}
          {backupsSummary?.issues && backupsSummary.issues.length > 0 && (
            <Box mt={2} pt={2} borderTopWidth="1px">
              <Text fontSize="xs" color="orange.500">Issues:</Text>
              {backupsSummary.issues.map((issue, idx) => (
                <Text key={idx} fontSize="xs" color="orange.500">• {issue}</Text>
              ))}
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

export default function SysadminWorkArea({
  section,
  identity,
}: SysadminWorkAreaProps) {
  const isSuperuser = !!identity?.is_superuser;
  const { data: summary, isLoading, error, refetch: refetchSummary, isFetching } =
    useOpsSummary({ enabled: isSuperuser });
  const { data: snapshot, refetch: refetchSnapshot } = useOpsSnapshot({ enabled: isSuperuser });

  const handleRefresh = useCallback(() => {
    refetchSummary();
    refetchSnapshot();
  }, [refetchSummary, refetchSnapshot]);

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

  // Extract data from snapshot
  const services = useMemo(() => {
    const svc = snapshot?.services as { data?: Record<string, unknown> } | undefined;
    return (svc?.data || {}) as Record<string, ServiceState | ServiceUnits>;
  }, [snapshot]);

  const systemData = useMemo(() => {
    const sys = snapshot?.system as { data?: Record<string, unknown> } | undefined;
    return sys?.data || {};
  }, [snapshot]);

  const diskData = useMemo(() => {
    const disk = snapshot?.disk as { data?: Record<string, unknown> } | undefined;
    return disk?.data || {};
  }, [snapshot]);

  const networkData = useMemo(() => {
    const net = snapshot?.network as { data?: Record<string, unknown> } | undefined;
    return net?.data || {};
  }, [snapshot]);

  const processData = useMemo(() => {
    const proc = snapshot?.processes as { data?: { top_rss?: ProcessInfo[]; top_cpu?: ProcessInfo[] } } | undefined;
    return proc?.data || {};
  }, [snapshot]);

  const applicationData = useMemo(() => {
    const app = snapshot?.application as { data?: Record<string, unknown> } | undefined;
    return app?.data || {};
  }, [snapshot]);

  const backupsSummary = useMemo(() => {
    const backups = services.backups as ServiceUnits & { summary?: BackupsSummary } | undefined;
    return backups?.summary;
  }, [services]);

  const lastUpdated = useMemo(() => {
    if (!summary?.timestamp) return null;
    return new Date(summary.timestamp).toLocaleString();
  }, [summary?.timestamp]);

  // Access check
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

  // =========================================================================
  // SYSTEM OVERVIEW
  // =========================================================================
  if (section === "system-overview") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={6}>
          <HStack justify="space-between">
            <Text fontSize="2xl" fontWeight="bold">System Overview</Text>
            {summary?.overall_status && (
              <Badge
                colorScheme={
                  summary.overall_status === "healthy" ? "green" :
                  summary.overall_status === "degraded" ? "orange" : "red"
                }
                fontSize="md"
                px={3}
                py={1}
              >
                {summary.overall_status}
              </Badge>
            )}
          </HStack>

          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.500">
              {lastUpdated ? `Last updated ${lastUpdated}` : "Loading..."}
            </Text>
            <Button size="sm" onClick={handleRefresh} loading={isFetching}>
              Refresh
            </Button>
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
                    {summary.highlights.map((item, idx) => {
                      // Color bullets based on content
                      const isWarning = item.toLowerCase().includes("attention") ||
                        item.toLowerCase().includes("elevated") ||
                        item.toLowerCase().includes("building up");
                      const isOk = item.toLowerCase().includes("no urgent") ||
                        item.toLowerCase().includes("healthy");
                      const bulletColor = isWarning ? "orange.500" : isOk ? "green.500" : "gray.600";
                      const bullet = isWarning ? "⚠️" : isOk ? "✅" : "•";
                      return (
                        <Text key={idx} color={bulletColor}>
                          {bullet} {item}
                        </Text>
                      );
                    })}
                  </VStack>
                </Card.Body>
              </Card.Root>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
                {summary.tiles.map((tile) => (
                  <Card.Root
                    key={tile.title}
                    borderLeftWidth="4px"
                    borderLeftColor={`${getStatusColor(tile.status)}.500`}
                  >
                    <Card.Header>
                      <HStack justify="space-between">
                        <Text fontSize="md" fontWeight="semibold">
                          {getTileEmoji(tile.title)} {tile.title}
                        </Text>
                        <StatusBadge status={tile.status} />
                      </HStack>
                    </Card.Header>
                    <Card.Body>
                      <VStack align="stretch" gap={2}>
                        <Text>{tile.detail}</Text>
                        {tile.hint && (
                          <Text fontSize="sm" color="gray.500">{tile.hint}</Text>
                        )}
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                ))}
              </SimpleGrid>
            </>
          )}
        </VStack>
      </WorkAreaWrapper>
    );
  }

  // =========================================================================
  // MISSION CRITICAL SERVICES
  // =========================================================================
  if (section === "svc-postgres") {
    const postgres = services.postgres as ServiceState;
    const activeConns = applicationData.postgres_active_connections as number | undefined;
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Database (PostgreSQL)</Text>
            <StatusBadge status={postgres?.status} />
          </HStack>
          <ServiceCard name="postgresql" state={postgres} showOwnership />
          {activeConns !== undefined && (
            <Card.Root>
              <Card.Body>
                <HStack justify="space-between">
                  <Text>Active Connections</Text>
                  <Text fontWeight="bold">{activeConns}</Text>
                </HStack>
              </Card.Body>
            </Card.Root>
          )}
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "svc-django") {
    const django = services.django as ServiceState;
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">API (Django)</Text>
            <StatusBadge status={django?.status} />
          </HStack>
          <ServiceCard name="crossroads-api" state={django} showOwnership />
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "svc-rabbitmq") {
    const rabbitmq = services.rabbitmq as ServiceState;
    const connCount = applicationData.rabbitmq_connection_count as number | undefined;
    const queueDepth = applicationData.celery_queue_depth as number | undefined;
    const vhost = applicationData.rabbitmq_vhost as string | undefined;
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Message Broker (RabbitMQ)</Text>
            <StatusBadge status={rabbitmq?.status} />
          </HStack>
          <ServiceCard name="rabbitmq-server" state={rabbitmq} showOwnership />
          <Card.Root>
            <Card.Body>
              <VStack align="stretch" gap={2}>
                <HStack justify="space-between">
                  <Text>Connections</Text>
                  <Text fontWeight="bold">{connCount ?? "—"}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text>Celery Queue Depth</Text>
                  <Text fontWeight="bold" color={queueDepth && queueDepth >= 500 ? "orange.500" : undefined}>
                    {queueDepth ?? "—"}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.500">VHost</Text>
                  <Text fontSize="sm">{vhost || "—"}</Text>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "svc-backups") {
    const backups = services.backups as ServiceUnits;
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Backups</Text>
            <StatusBadge status={backupsSummary?.status} />
          </HStack>
          <MultiUnitServiceCard name="Backup Units" data={backups} backupsSummary={backupsSummary} />
        </VStack>
      </WorkAreaWrapper>
    );
  }

  // =========================================================================
  // CORE SERVICES
  // =========================================================================
  if (section === "svc-celery") {
    const celery = services.celery as ServiceState;
    const queueDepth = applicationData.celery_queue_depth as number | undefined;
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Workers (Celery)</Text>
            <StatusBadge status={celery?.status} />
          </HStack>
          <ServiceCard name="crossroads-celery" state={celery} showOwnership />
          <Card.Root>
            <Card.Body>
              <HStack justify="space-between">
                <Text>Queue Depth</Text>
                <Text fontWeight="bold" color={queueDepth && queueDepth >= 500 ? "orange.500" : undefined}>
                  {queueDepth ?? "—"} tasks
                </Text>
              </HStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "svc-nginx") {
    const nginx = services.nginx as ServiceState;
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Proxy (Nginx)</Text>
            <StatusBadge status={nginx?.status} />
          </HStack>
          <ServiceCard name="nginx" state={nginx} showOwnership />
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "svc-seaweedfs") {
    const seaweedfs = services.seaweedfs as ServiceUnits;
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">Storage (SeaweedFS)</Text>
          <MultiUnitServiceCard name="SeaweedFS Units" data={seaweedfs} />
        </VStack>
      </WorkAreaWrapper>
    );
  }

  // =========================================================================
  // FEATURE SERVICES
  // =========================================================================
  if (section === "svc-inkwell") {
    const inkwell = services.inkwell as ServiceState;
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Inkwell (LLM)</Text>
            <StatusBadge status={inkwell?.status} />
          </HStack>
          <ServiceCard name="crossroads-inkwell" state={inkwell} showOwnership />
          <Card.Root>
            <Card.Body>
              <Text fontSize="sm" color="gray.500">
                Inkwell is memory-dominant. High memory usage during model loading is expected.
              </Text>
            </Card.Body>
          </Card.Root>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "svc-lanternmail") {
    const lanternmail = services.lanternmail as ServiceState;
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Lanternmail (Email)</Text>
            <StatusBadge status={lanternmail?.status} />
          </HStack>
          <ServiceCard name="crossroads-lanternmail" state={lanternmail} />
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "svc-livewire") {
    const livewire = services.livewire as ServiceState;
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Livewire (Realtime)</Text>
            <StatusBadge status={livewire?.status} />
          </HStack>
          <ServiceCard name="crossroads-livewire" state={livewire} />
        </VStack>
      </WorkAreaWrapper>
    );
  }

  // =========================================================================
  // RESOURCES
  // =========================================================================
  if (section === "res-memory") {
    const memory = systemData.memory_bytes as { total?: number; available?: number; used?: number } | undefined;
    const swap = systemData.swap_bytes as { total?: number; used?: number } | undefined;
    const memUsedPct = memory?.total ? ((memory.total - (memory.available || 0)) / memory.total * 100) : 0;
    const swapUsedPct = swap?.total ? (swap.used || 0) / swap.total * 100 : 0;

    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">Memory</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Card.Root>
              <Card.Header>
                <Text fontWeight="semibold">RAM</Text>
              </Card.Header>
              <Card.Body>
                <VStack align="stretch" gap={2}>
                  <HStack justify="space-between">
                    <Text>Total</Text>
                    <Text fontWeight="bold">{formatBytes(memory?.total)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Available</Text>
                    <Text fontWeight="bold">{formatBytes(memory?.available)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Used</Text>
                    <Text fontWeight="bold" color={memUsedPct > 90 ? "red.500" : undefined}>
                      {memUsedPct.toFixed(1)}%
                    </Text>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Header>
                <HStack justify="space-between">
                  <Text fontWeight="semibold">Swap</Text>
                  {swapUsedPct >= 20 && <Badge colorScheme="orange">elevated</Badge>}
                </HStack>
              </Card.Header>
              <Card.Body>
                <VStack align="stretch" gap={2}>
                  <HStack justify="space-between">
                    <Text>Total</Text>
                    <Text fontWeight="bold">{formatBytes(swap?.total)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Used</Text>
                    <Text fontWeight="bold" color={swapUsedPct >= 50 ? "red.500" : swapUsedPct >= 20 ? "orange.500" : undefined}>
                      {formatBytes(swap?.used)} ({swapUsedPct.toFixed(1)}%)
                    </Text>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "res-disk") {
    const root = diskData.root as { total?: number; used?: number; free?: number; free_percent?: number } | undefined;
    const inodes = diskData.inodes as { total?: number; used?: number; free?: number } | undefined;

    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">Disk</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Card.Root>
              <Card.Header>
                <HStack justify="space-between">
                  <Text fontWeight="semibold">Root Partition</Text>
                  {root?.free_percent !== undefined && root.free_percent < 10 && (
                    <Badge colorScheme="red">low space</Badge>
                  )}
                </HStack>
              </Card.Header>
              <Card.Body>
                <VStack align="stretch" gap={2}>
                  <HStack justify="space-between">
                    <Text>Total</Text>
                    <Text fontWeight="bold">{formatBytes(root?.total)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Used</Text>
                    <Text fontWeight="bold">{formatBytes(root?.used)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Free</Text>
                    <Text fontWeight="bold" color={root?.free_percent !== undefined && root.free_percent < 10 ? "red.500" : undefined}>
                      {formatBytes(root?.free)} ({root?.free_percent?.toFixed(1)}%)
                    </Text>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Header>
                <Text fontWeight="semibold">Inodes</Text>
              </Card.Header>
              <Card.Body>
                <VStack align="stretch" gap={2}>
                  <HStack justify="space-between">
                    <Text>Total</Text>
                    <Text fontWeight="bold">{inodes?.total?.toLocaleString() || "—"}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Used</Text>
                    <Text fontWeight="bold">{inodes?.used?.toLocaleString() || "—"}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Free</Text>
                    <Text fontWeight="bold">{inodes?.free?.toLocaleString() || "—"}</Text>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "res-network") {
    const tcpConns = networkData.tcp_connections as number | undefined;
    const listeningCount = networkData.listening_port_count as number | undefined;
    const topPorts = networkData.top_listening_ports as Array<{ port: number; count: number }> | undefined;

    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xl" fontWeight="bold">Network</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Card.Root>
              <Card.Body>
                <HStack justify="space-between">
                  <Text>TCP Connections</Text>
                  <Text fontWeight="bold">{tcpConns ?? "—"}</Text>
                </HStack>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Body>
                <HStack justify="space-between">
                  <Text>Listening Ports</Text>
                  <Text fontWeight="bold">{listeningCount ?? "—"}</Text>
                </HStack>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
          {topPorts && topPorts.length > 0 && (
            <Card.Root>
              <Card.Header>
                <Text fontWeight="semibold">Top Listening Ports</Text>
              </Card.Header>
              <Card.Body>
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Port</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">Sockets</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {topPorts.map((p) => (
                      <Table.Row key={p.port}>
                        <Table.Cell>{p.port}</Table.Cell>
                        <Table.Cell textAlign="right">{p.count}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Card.Body>
            </Card.Root>
          )}
        </VStack>
      </WorkAreaWrapper>
    );
  }

  // =========================================================================
  // DIAGNOSTICS
  // =========================================================================
  if (section === "diag-processes") {
    const topRss = processData.top_rss || [];
    const topCpu = processData.top_cpu || [];

    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Top Processes</Text>
            <Button size="sm" onClick={handleRefresh} loading={isFetching}>
              Refresh
            </Button>
          </HStack>
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <Card.Root>
              <Card.Header>
                <Text fontWeight="semibold">By Memory (RSS)</Text>
              </Card.Header>
              <Card.Body>
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>PID</Table.ColumnHeader>
                      <Table.ColumnHeader>Command</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">Memory</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {topRss.map((p) => (
                      <Table.Row key={p.pid}>
                        <Table.Cell>{p.pid}</Table.Cell>
                        <Table.Cell>{p.command}</Table.Cell>
                        <Table.Cell textAlign="right">{formatBytes(p.rss_bytes)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Card.Body>
            </Card.Root>
            <Card.Root>
              <Card.Header>
                <Text fontWeight="semibold">By CPU</Text>
              </Card.Header>
              <Card.Body>
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>PID</Table.ColumnHeader>
                      <Table.ColumnHeader>Command</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">CPU %</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {topCpu.map((p) => (
                      <Table.Row key={p.pid}>
                        <Table.Cell>{p.pid}</Table.Cell>
                        <Table.Cell>{p.command}</Table.Cell>
                        <Table.Cell textAlign="right">{p.cpu_percent.toFixed(1)}%</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "diag-snapshot") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Raw Snapshot</Text>
            <HStack gap={2}>
              <Button size="sm" onClick={handleRefresh} loading={isFetching}>
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadSnapshot} disabled={!snapshot}>
                Download JSON
              </Button>
            </HStack>
          </HStack>
          <Text fontSize="sm" color="gray.500">
            Generated at: {snapshot?.generated_at || "—"}
          </Text>
          {snapshot && (
            <Card.Root>
              <Card.Body>
                <Code
                  display="block"
                  whiteSpace="pre"
                  fontSize="xs"
                  p={3}
                  borderRadius="md"
                  overflowX="auto"
                  maxH="600px"
                  overflowY="auto"
                >
                  {JSON.stringify(snapshot, null, 2)}
                </Code>
              </Card.Body>
            </Card.Root>
          )}
        </VStack>
      </WorkAreaWrapper>
    );
  }

  // =========================================================================
  // DEFAULT FALLBACK
  // =========================================================================
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={4}>
        <Text fontSize="xl" fontWeight="bold">Section: {section}</Text>
        <Text>This sysadmin section is under development.</Text>
      </VStack>
    </WorkAreaWrapper>
  );
}
