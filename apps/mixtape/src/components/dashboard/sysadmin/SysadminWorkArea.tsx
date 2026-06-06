// apps/mixtape/src/components/dashboard/sysadmin/SysadminWorkArea.tsx

"use client";

import { useMemo, useCallback, useDeferredValue, useEffect, useState } from "react";
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
  Field,
  Input,
  NativeSelect,
  Separator,
  Flex,
  Grid,
  Progress,
  Tabs,
} from "@chakra-ui/react";
import { UserIdentity } from "@mixtape/core/types/auth";
import type {
  BuildLogEntry,
  OpsApplicationSurface,
  OpsApplicationSurfacesSection,
  OpsBackupsDetailSection,
  OpsLivewireDetailSection,
  OpsPostgresDetailSection,
  ProjectStatusDecision,
  ProjectStatusTimelineEntry,
} from "@mixtape/api/clients/ops/opsApi";
import { useBuildLogEntries, useOpsSummary, useOpsSnapshot, useProjectStatus } from "@mixtape/api/hooks/ops/useOps";

interface SysadminWorkAreaProps extends WorkAreaProps {
  identity: UserIdentity;
}

// Type helpers for snapshot data
interface ServiceState {
  active_state?: string;
  sub_state?: string;
  uptime_seconds?: number;
  memory_bytes?: number;
  last_trigger_timestamp?: string;
  last_trigger_age_seconds?: number;
  result?: string;
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

type BackupMonitor = NonNullable<NonNullable<OpsBackupsDetailSection["data"]>["monitors"]>[string];

interface QuickListItem {
  key: string;
  label: string;
  status: string;
  detail: string;
  hint?: string;
}

const BUILD_LOG_PAGE_SIZE = 25;
const PROJECT_STATUS_QUEUE_ORDER: Record<string, number> = {
  blocked: 0,
  in_progress: 1,
  pending: 2,
  complete: 3,
};

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
  if (status === "stale" || status === "unavailable") return "gray";
  return "gray";
}

// Status badge component
function StatusBadge({ status }: { status: string | undefined }) {
  return <Badge colorScheme={getStatusColor(status)}>{status || "unknown"}</Badge>;
}

function QuickListPanel({ items }: { items: QuickListItem[] }) {
  return (
    <Card.Root position={{ base: "static", xl: "sticky" }} top="6">
      <Card.Header>
        <VStack align="stretch" gap={1}>
          <Text fontSize="lg" fontWeight="semibold">QuickList</Text>
          <Text fontSize="sm" color="gray.500">
            Scan current service state before drilling into cards and work areas.
          </Text>
        </VStack>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={3}>
          {items.map((item) => (
            <HStack key={item.key} align="start" gap={3}>
              <Box
                mt="1.5"
                boxSize="10px"
                borderRadius="full"
                bg={`${getStatusColor(item.status)}.500`}
                flexShrink={0}
              />
              <VStack align="stretch" gap={0.5} flex="1">
                <HStack justify="space-between" align="start" gap={2}>
                  <Text fontSize="sm" fontWeight="semibold">
                    {item.label}
                  </Text>
                  <StatusBadge status={item.status} />
                </HStack>
                <Text fontSize="sm">{item.detail}</Text>
                {item.hint && (
                  <Text fontSize="xs" color="gray.500">
                    {item.hint}
                  </Text>
                )}
              </VStack>
            </HStack>
          ))}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function formatAge(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null) return "—";
  return `${formatUptime(seconds)} ago`;
}

function formatDateTime(value: string | undefined | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function formatQueueState(value: string | undefined): string {
  if (!value) return "Pending";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getQueueStateColor(value: string | undefined): string {
  if (value === "complete") return "green";
  if (value === "in_progress") return "orange";
  if (value === "blocked") return "red";
  return "gray";
}

function getCheckpointPercent(decision: ProjectStatusDecision): number {
  const total = decision.checkpoint_counts.total;
  if (!total) return 0;
  return Math.round((decision.checkpoint_counts.done / total) * 100);
}

function formatTimelineSource(value: string | undefined): string {
  if (value === "build_log") return "Build log";
  if (value === "inbox") return "Inbox";
  return value || "Unknown";
}

function getTimelineSourceColor(value: string | undefined): string {
  if (value === "build_log") return "teal";
  if (value === "inbox") return "orange";
  return "gray";
}

// Emoji map for tiles
const TILE_EMOJI: Record<string, string> = {
  "Core services": "⚡",
  "Storage": "💾",
  "Background work": "⚙️",
  "Backups": "🗄️",
  "Application Surfaces": "🖥️",
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
  const [buildLogSearch, setBuildLogSearch] = useState("");
  const [buildLogRepo, setBuildLogRepo] = useState("");
  const [buildLogOffset, setBuildLogOffset] = useState(0);
  const [expandedEntryId, setExpandedEntryId] = useState<number | null>(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectQueueState, setProjectQueueState] = useState("");
  const [projectTimelineSearch, setProjectTimelineSearch] = useState("");
  const [projectTimelineRepo, setProjectTimelineRepo] = useState("");
  const [projectTimelineWorkEffort, setProjectTimelineWorkEffort] = useState("");
  const [projectTimelineSource, setProjectTimelineSource] = useState("");
  const deferredBuildLogSearch = useDeferredValue(buildLogSearch);
  const deferredProjectSearch = useDeferredValue(projectSearch);
  const deferredProjectTimelineSearch = useDeferredValue(projectTimelineSearch);
  const { data: summary, isLoading, error, refetch: refetchSummary, isFetching } =
    useOpsSummary({ enabled: isSuperuser });
  const { data: snapshot, refetch: refetchSnapshot } = useOpsSnapshot({ enabled: isSuperuser });
  const {
    data: projectStatus,
    isLoading: projectStatusLoading,
    isFetching: projectStatusFetching,
    error: projectStatusError,
    refetch: refetchProjectStatus,
  } = useProjectStatus({ enabled: isSuperuser });
  const {
    data: buildLogData,
    isLoading: buildLogLoading,
    isFetching: buildLogFetching,
    error: buildLogError,
    refetch: refetchBuildLog,
  } = useBuildLogEntries(
    {
      q: deferredBuildLogSearch.trim() || undefined,
      repo: buildLogRepo || undefined,
      limit: BUILD_LOG_PAGE_SIZE,
      offset: buildLogOffset,
    },
    { enabled: isSuperuser },
  );

  const handleRefresh = useCallback(() => {
    refetchSummary();
    refetchSnapshot();
  }, [refetchSummary, refetchSnapshot]);

  const handleRefreshBuildLog = useCallback(() => {
    refetchBuildLog();
  }, [refetchBuildLog]);

  const handleRefreshProjectStatus = useCallback(() => {
    refetchProjectStatus();
  }, [refetchProjectStatus]);

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

  useEffect(() => {
    setBuildLogOffset(0);
  }, [deferredBuildLogSearch, buildLogRepo]);

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

  const applicationSection = useMemo(() => {
    return (snapshot?.application || {}) as Record<string, unknown>;
  }, [snapshot]);

  const applicationSnapshotMeta = useMemo(() => {
    return snapshot?.application as { collected_at?: string | null; expires_at?: string | null; source?: string | null } | undefined;
  }, [snapshot]);

  const postgresDetail = useMemo(() => {
    return snapshot?.postgres_detail as OpsPostgresDetailSection | undefined;
  }, [snapshot]);

  const applicationSurfaces = useMemo(() => {
    return snapshot?.application_surfaces as OpsApplicationSurfacesSection | undefined;
  }, [snapshot]);

  const livewireDetail = useMemo(() => {
    return snapshot?.livewire_detail as OpsLivewireDetailSection | undefined;
  }, [snapshot]);

  const applicationSurfaceEntries = useMemo(() => {
    const surfaces = applicationSurfaces?.data?.surfaces || {};
    return Object.entries(surfaces) as Array<[string, OpsApplicationSurface]>;
  }, [applicationSurfaces]);

  const applicationSurfaceSummary = useMemo(() => {
    const total = applicationSurfaceEntries.length;
    const healthy = applicationSurfaceEntries.filter(([, surface]) => surface.status === "healthy").length;
    const degraded = applicationSurfaceEntries.filter(([, surface]) => surface.status === "degraded").length;
    const critical = applicationSurfaceEntries.filter(([, surface]) => surface.status === "critical").length;
    return { total, healthy, degraded, critical };
  }, [applicationSurfaceEntries]);

  const backupsSummary = useMemo(() => {
    const backups = services.backups as ServiceUnits & { summary?: BackupsSummary } | undefined;
    return backups?.summary;
  }, [services]);

  const backupsDetail = useMemo(() => {
    return snapshot?.backups_detail as OpsBackupsDetailSection | undefined;
  }, [snapshot]);

  const backupMonitorEntries = useMemo(() => {
    return Object.entries(
      backupsDetail?.data?.monitors || {},
    ) as Array<[string, BackupMonitor]>;
  }, [backupsDetail]);

  const lastUpdated = useMemo(() => {
    if (!summary?.timestamp) return null;
    return new Date(summary.timestamp).toLocaleString();
  }, [summary?.timestamp]);

  const buildLogEntries = buildLogData?.results || [];
  const buildLogRepoChoices = buildLogData?.repo_choices || [];
  const buildLogCount = buildLogData?.count || 0;
  const buildLogPageStart = buildLogCount === 0 ? 0 : buildLogOffset + 1;
  const buildLogPageEnd = Math.min(buildLogOffset + buildLogEntries.length, buildLogCount);

  const projectDecisions = useMemo(() => {
    const search = deferredProjectSearch.trim().toLowerCase();
    return (projectStatus?.decisions || [])
      .filter((decision) => {
        if (projectQueueState && decision.queue_state !== projectQueueState) return false;
        if (!search) return true;
        return [
          decision.name,
          decision.path,
          decision.class,
          decision.status,
          decision.library,
        ].some((value) => value.toLowerCase().includes(search));
      })
      .sort((a, b) => {
        const queueDelta = (PROJECT_STATUS_QUEUE_ORDER[a.queue_state] ?? 99) - (PROJECT_STATUS_QUEUE_ORDER[b.queue_state] ?? 99);
        if (queueDelta !== 0) return queueDelta;
        return a.path.localeCompare(b.path);
      });
  }, [deferredProjectSearch, projectQueueState, projectStatus?.decisions]);

  const projectQueueChoices = useMemo(() => {
    return Array.from(new Set((projectStatus?.decisions || []).map((decision) => decision.queue_state))).sort(
      (a, b) => (PROJECT_STATUS_QUEUE_ORDER[a] ?? 99) - (PROJECT_STATUS_QUEUE_ORDER[b] ?? 99),
    );
  }, [projectStatus?.decisions]);

  const projectTimelineRepoChoices = useMemo(() => {
    return Array.from(new Set((projectStatus?.timeline || []).map((entry) => entry.repo))).sort();
  }, [projectStatus?.timeline]);

  const projectTimelineWorkEffortChoices = useMemo(() => {
    return Array.from(new Set((projectStatus?.timeline || []).map((entry) => entry.work_effort).filter(Boolean))).sort();
  }, [projectStatus?.timeline]);

  const projectTimelineEntries = useMemo(() => {
    const search = deferredProjectTimelineSearch.trim().toLowerCase();
    return (projectStatus?.timeline || []).filter((entry) => {
      if (projectTimelineRepo && entry.repo !== projectTimelineRepo) return false;
      if (projectTimelineWorkEffort && entry.work_effort !== projectTimelineWorkEffort) return false;
      if (projectTimelineSource && entry.source !== projectTimelineSource) return false;
      if (!search) return true;
      return [
        entry.repo,
        entry.commit_hash,
        entry.commit_message,
        entry.work_effort,
        entry.body,
        formatTimelineSource(entry.source),
        entry.source_filename,
      ].some((value) => value.toLowerCase().includes(search));
    });
  }, [
    deferredProjectTimelineSearch,
    projectStatus?.timeline,
    projectTimelineRepo,
    projectTimelineSource,
    projectTimelineWorkEffort,
  ]);

  const projectTimelineSourceChoices = useMemo(() => {
    return Array.from(new Set((projectStatus?.timeline || []).map((entry) => entry.source))).sort();
  }, [projectStatus?.timeline]);

  const overviewTiles = useMemo(() => {
    if (!summary) return [];
    const tiles = [...summary.tiles];
    const postgresStatus = postgresDetail?.status || "unavailable";
    const active = postgresDetail?.data?.connection_breakdown?.active;
    const dbSize = postgresDetail?.data?.db_size_bytes;
    const cacheHit = postgresDetail?.data?.cache_hit_ratio;
    const detail =
      active !== undefined || dbSize !== undefined
        ? `${active ?? "—"} active • ${formatBytes(dbSize)}`
        : "Waiting for async database snapshot";
    const hint = postgresDetail?.collected_at
      ? `Cache hit ${formatPercent(cacheHit)} • Collected ${new Date(postgresDetail.collected_at).toLocaleString()}`
      : "Postgres detail is populated by the async polling worker.";

    tiles.push({
      title: "Database",
      status: postgresStatus,
      detail,
      hint,
    });

    const surfaceStatus = applicationSurfaces?.status || "unavailable";
    const surfaceDetail = applicationSurfaceEntries.length
      ? `${applicationSurfaceSummary.healthy}/${applicationSurfaceSummary.total} healthy • ${applicationSurfaceEntries.map(([, surface]) => `${surface.label}: ${surface.status}`).join(" • ")}`
      : "No application surfaces configured";
    const surfaceHint = applicationSurfaces?.collected_at
      ? `Collected ${new Date(applicationSurfaces.collected_at).toLocaleString()}`
      : "Local application surfaces are probed live during snapshot generation.";

    tiles.push({
      title: "Application Surfaces",
      status: surfaceStatus,
      detail: surfaceDetail,
      hint: surfaceHint,
    });

    const livewireStatus = livewireDetail?.status || ((services.livewire as ServiceState | undefined)?.status || "unavailable");
    const livewireDetailLine = livewireDetail?.data?.summary?.headline
      ? `${livewireDetail.data.summary.headline} • ${livewireDetail.data.runtime?.port ?? "—"}`
      : "Socket.IO handshake monitor pending";
    const livewireHint = livewireDetail?.collected_at
      ? `Collected ${new Date(livewireDetail.collected_at).toLocaleString()}`
      : "Livewire probe is evaluated during snapshot generation.";

    tiles.push({
      title: "Livewire",
      status: livewireStatus,
      detail: livewireDetailLine,
      hint: livewireHint,
    });
    return tiles;
  }, [applicationSurfaceEntries, applicationSurfaceSummary, applicationSurfaces, livewireDetail, postgresDetail, services.livewire, summary]);

  const quickListItems = useMemo(() => {
    const items: QuickListItem[] = [];
    const pushItem = (item: QuickListItem | null) => {
      if (item) items.push(item);
    };

    const sectionStatus = (sectionValue: unknown) =>
      ((sectionValue as { status?: string } | undefined)?.status || "unknown");

    pushItem({
      key: "system",
      label: "System",
      status: sectionStatus(snapshot?.system),
      detail: `${systemData.cpu_cores || "—"} cores • load ${(systemData.load_average as { ["1m"]?: number } | undefined)?.["1m"]?.toFixed?.(1) ?? "—"}`,
      hint: `Swap used ${formatBytes((systemData.swap_bytes as { used?: number } | undefined)?.used)}`,
    });

    pushItem({
      key: "disk",
      label: "Disk",
      status: sectionStatus(snapshot?.disk),
      detail: `${((diskData.root as { free_percent?: number } | undefined)?.free_percent ?? 0).toFixed(1)}% free`,
      hint: `${formatBytes((diskData.root as { free?: number } | undefined)?.free)} available on root`,
    });

    pushItem({
      key: "application",
      label: "Application",
      status: sectionStatus(applicationSection),
      detail: `RabbitMQ ${applicationData.rabbitmq_connection_count ?? "—"} • Celery depth ${applicationData.celery_queue_depth ?? "—"}`,
      hint: typeof applicationSnapshotMeta?.collected_at === "string"
        ? `Collected ${new Date(applicationSnapshotMeta.collected_at).toLocaleString()}`
        : "Async application snapshot pending",
    });

    pushItem({
      key: "postgres",
      label: "PostgreSQL",
      status: postgresDetail?.status || ((services.postgres as ServiceState | undefined)?.status || "unavailable"),
      detail: `${postgresDetail?.data?.connection_breakdown?.active ?? applicationData.postgres_active_connections ?? "—"} active • ${formatBytes(postgresDetail?.data?.db_size_bytes)}`,
      hint: `Cache hit ${formatPercent(postgresDetail?.data?.cache_hit_ratio)} • ${postgresDetail?.data?.replication?.length ? `${postgresDetail.data.replication.length} replica(s)` : "no replication"}`,
    });

    pushItem({
      key: "application-surfaces",
      label: "Application Surfaces",
      status: applicationSurfaces?.status || "unavailable",
      detail: applicationSurfaceEntries.length
        ? `${applicationSurfaceSummary.healthy}/${applicationSurfaceSummary.total} healthy`
        : "No surfaces configured",
      hint: applicationSurfaces?.collected_at
        ? `Collected ${new Date(applicationSurfaces.collected_at).toLocaleString()}`
        : "Live local probes pending",
    });

    pushItem({
      key: "livewire",
      label: "Livewire",
      status: livewireDetail?.status || ((services.livewire as ServiceState | undefined)?.status || "unavailable"),
      detail: livewireDetail?.data?.summary?.detail || "Socket.IO handshake monitor pending",
      hint: livewireDetail?.data?.probe?.url
        ? `Probe ${livewireDetail.data.probe.url}`
        : "No Livewire probe URL configured",
    });

    Object.entries(services).forEach(([key, value]) => {
      if (key === "postgres") return;
      if (key === "livewire") return;

      if ((value as ServiceUnits).units) {
        const unitMap = (value as ServiceUnits).units || {};
        const unitStates = Object.values(unitMap);
        const healthyUnits = unitStates.filter((unit) => {
          const status = unit?.status || unit?.active_state;
          return status === "healthy" || status === "active";
        }).length;
        const overallStatus =
          key === "backups"
            ? backupsDetail?.status || backupsSummary?.status || "unknown"
            : unitStates.some((unit) => (unit?.status || unit?.active_state) === "critical")
              ? "critical"
              : unitStates.some((unit) => {
                  const status = unit?.status || unit?.active_state;
                  return status === "degraded" || status === "inactive" || status === "failed";
                })
                ? "degraded"
                : "healthy";
        pushItem({
          key,
          label: key === "seaweedfs" ? "SeaweedFS" : key.charAt(0).toUpperCase() + key.slice(1),
          status: overallStatus,
          detail:
            key === "backups"
              ? backupMonitorEntries.length
                ? backupMonitorEntries
                  .map(([, monitor]) => `${monitor.label || "Backup"}: ${formatAge(monitor.last_success_age_seconds)}`)
                  .join(" • ")
                : `${backupsSummary?.issues?.length || 0} backup issue(s)`
              : `${healthyUnits}/${unitStates.length} units healthy`,
          hint:
            key === "backups"
              ? backupMonitorEntries.find(([, monitor]) => monitor.success_source === "local_archive_fallback")
                ? "At least one backup monitor is inferring success from archive timestamps because the success stamp is missing."
                : backupsSummary?.issues?.[0] || "Timers and backup services look healthy."
              : `${unitStates.length} systemd units tracked`,
        });
        return;
      }

      const serviceState = value as ServiceState;
      pushItem({
        key,
        label: key === "inkwell" ? "Inkwell" : key.charAt(0).toUpperCase() + key.slice(1),
        status: serviceState.status || serviceState.active_state || "unknown",
        detail: `${serviceState.active_state || "unknown"} / ${serviceState.sub_state || "unknown"}`,
        hint:
          serviceState.pressure && serviceState.pressure !== "expected"
            ? `Pressure: ${serviceState.pressure}`
            : serviceState.uptime_seconds
              ? `Uptime ${formatUptime(serviceState.uptime_seconds)}`
              : undefined,
      });
    });

    return items;
  }, [
    applicationData,
    applicationSection,
    applicationSnapshotMeta,
    applicationSurfaceEntries,
    applicationSurfaceSummary,
    applicationSurfaces,
    backupMonitorEntries,
    backupsDetail?.status,
    backupsSummary,
    diskData,
    livewireDetail?.data?.probe?.url,
    livewireDetail?.data?.summary?.detail,
    livewireDetail?.status,
    postgresDetail,
    services,
    snapshot,
    systemData,
  ]);

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
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", xl: "minmax(0, 3fr) minmax(280px, 1fr)" }}
          gap={6}
          alignItems="start"
        >
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
                  {overviewTiles.map((tile) => (
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

          <QuickListPanel items={quickListItems} />
        </Box>
      </WorkAreaWrapper>
    );
  }

  // =========================================================================
  // MISSION CRITICAL SERVICES
  // =========================================================================
  if (section === "svc-postgres") {
    const postgres = services.postgres as ServiceState;
    const activeConns = applicationData.postgres_active_connections as number | undefined;
    const connectionBreakdown = postgresDetail?.data?.connection_breakdown;
    const cacheHitRatio = postgresDetail?.data?.cache_hit_ratio;
    const dbSizeBytes = postgresDetail?.data?.db_size_bytes;
    const longRunningCount = postgresDetail?.data?.long_running_queries?.length ?? 0;
    const postgresCollectedAt = postgresDetail?.collected_at
      ? new Date(postgresDetail.collected_at).toLocaleString()
      : null;
    const postgresStatus = postgresDetail?.status || "unavailable";
    const postgresErrors = postgresDetail?.errors || [];

    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Database (PostgreSQL)</Text>
            <StatusBadge status={postgres?.status} />
          </HStack>
          <ServiceCard name="postgresql" state={postgres} showOwnership />
          <Card.Root borderLeftWidth="4px" borderLeftColor={`${getStatusColor(postgresStatus)}.500`}>
            <Card.Header>
              <HStack justify="space-between">
                <Text fontWeight="semibold">Database Monitor</Text>
                <StatusBadge status={postgresStatus} />
              </HStack>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between" align="start" wrap="wrap">
                  <VStack align="start" gap={1}>
                    <Text fontSize="sm" color="gray.500">
                      {postgresCollectedAt ? `Collected ${postgresCollectedAt}` : "No snapshot collected yet"}
                    </Text>
                    {postgresDetail?.source && (
                      <Text fontSize="xs" color="gray.500">
                        Source: {postgresDetail.source}
                      </Text>
                    )}
                  </VStack>
                  <Button size="sm" variant="outline" onClick={handleRefresh} loading={isFetching}>
                    Refresh
                  </Button>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Active Connections</Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {connectionBreakdown?.active ?? activeConns ?? "—"}
                    </Text>
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Cache Hit Ratio</Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {formatPercent(cacheHitRatio)}
                    </Text>
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Database Size</Text>
                    <Text fontSize="2xl" fontWeight="bold">
                      {formatBytes(dbSizeBytes)}
                    </Text>
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Long-Running Queries</Text>
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      color={longRunningCount > 0 ? "orange.500" : undefined}
                    >
                      {longRunningCount}
                    </Text>
                  </VStack>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Idle</Text>
                    <Text fontWeight="bold">{connectionBreakdown?.idle ?? "—"}</Text>
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Idle in Transaction</Text>
                    <Text
                      fontWeight="bold"
                      color={(connectionBreakdown?.idle_in_transaction ?? 0) > 0 ? "orange.500" : undefined}
                    >
                      {connectionBreakdown?.idle_in_transaction ?? "—"}
                    </Text>
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Waiting</Text>
                    <Text
                      fontWeight="bold"
                      color={(connectionBreakdown?.waiting ?? 0) > 0 ? "orange.500" : undefined}
                    >
                      {connectionBreakdown?.waiting ?? "—"}
                    </Text>
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Replication</Text>
                    <Text fontWeight="bold">
                      {postgresDetail?.data?.replication?.length
                        ? `${postgresDetail.data.replication.length} replica${postgresDetail.data.replication.length === 1 ? "" : "s"}`
                        : "none"}
                    </Text>
                  </VStack>
                </SimpleGrid>

                {postgresStatus === "stale" && (
                  <Text fontSize="sm" color="orange.500">
                    Postgres snapshot is stale. The dashboard is showing the latest stored result, not a fresh collection.
                  </Text>
                )}
                {postgresStatus === "unavailable" && (
                  <Text fontSize="sm" color="gray.500">
                    No stored Postgres snapshot is available yet.
                  </Text>
                )}
                {postgresErrors.length > 0 && (
                  <Box pt={2} borderTopWidth="1px">
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Snapshot notes
                    </Text>
                    {postgresErrors.map((errorText) => (
                      <Text key={errorText} fontSize="xs" color="gray.500">
                        • {errorText}
                      </Text>
                    ))}
                  </Box>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "svc-application-surfaces") {
    const surfacesStatus = applicationSurfaces?.status || "unavailable";
    const surfaceErrors = applicationSurfaces?.errors || [];
    const collectedAt = applicationSurfaces?.collected_at
      ? new Date(applicationSurfaces.collected_at).toLocaleString()
      : null;

    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Application Surfaces</Text>
            <StatusBadge status={surfacesStatus} />
          </HStack>

          <Card.Root borderLeftWidth="4px" borderLeftColor={`${getStatusColor(surfacesStatus)}.500`}>
            <Card.Header>
              <HStack justify="space-between">
                <Text fontWeight="semibold">Surface Monitor</Text>
                <StatusBadge status={surfacesStatus} />
              </HStack>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between" align="start" wrap="wrap">
                  <VStack align="start" gap={1}>
                    <Text fontSize="sm" color="gray.500">
                      {collectedAt ? `Collected ${collectedAt}` : "No application surface snapshot collected yet"}
                    </Text>
                    {applicationSurfaces?.source && (
                      <Text fontSize="xs" color="gray.500">
                        Source: {applicationSurfaces.source}
                      </Text>
                    )}
                  </VStack>
                  <Button size="sm" variant="outline" onClick={handleRefresh} loading={isFetching}>
                    Refresh
                  </Button>
                </HStack>

                <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Total Surfaces</Text>
                    <Text fontSize="2xl" fontWeight="bold">{applicationSurfaceSummary.total}</Text>
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Healthy</Text>
                    <Text fontSize="2xl" fontWeight="bold" color={applicationSurfaceSummary.healthy > 0 ? "green.500" : undefined}>
                      {applicationSurfaceSummary.healthy}
                    </Text>
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Degraded</Text>
                    <Text fontSize="2xl" fontWeight="bold" color={applicationSurfaceSummary.degraded > 0 ? "orange.500" : undefined}>
                      {applicationSurfaceSummary.degraded}
                    </Text>
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Critical</Text>
                    <Text fontSize="2xl" fontWeight="bold" color={applicationSurfaceSummary.critical > 0 ? "red.500" : undefined}>
                      {applicationSurfaceSummary.critical}
                    </Text>
                  </VStack>
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
                  {applicationSurfaceEntries.map(([surfaceKey, surface]) => (
                    <Card.Root
                      key={surfaceKey}
                      variant="outline"
                      borderLeftWidth="4px"
                      borderLeftColor={`${getStatusColor(surface.status)}.500`}
                    >
                      <Card.Header>
                        <HStack justify="space-between" align="start">
                          <VStack align="start" gap={0}>
                            <Text fontWeight="semibold">{surface.label}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {surface.provider} • {surface.environment} • {surface.surface_type}
                            </Text>
                          </VStack>
                          <StatusBadge status={surface.status} />
                        </HStack>
                      </Card.Header>
                      <Card.Body>
                        <VStack align="stretch" gap={3}>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.500">Endpoint</Text>
                            <Text fontSize="sm" fontWeight="bold">{surface.endpoint || "—"}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.500">Summary</Text>
                            <Text fontSize="sm" fontWeight="bold">{surface.summary?.headline || surface.status}</Text>
                          </HStack>
                          <Text fontSize="sm">{surface.summary?.detail || "No summary available."}</Text>

                          <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
                            <VStack align="stretch" gap={1}>
                              <Text fontSize="xs" color="gray.500">Port</Text>
                              <Text fontWeight="bold">{surface.runtime?.port ?? "—"}</Text>
                            </VStack>
                            <VStack align="stretch" gap={1}>
                              <Text fontSize="xs" color="gray.500">Process</Text>
                              <Text fontWeight="bold">
                                {surface.runtime?.process_detected === undefined
                                  ? "—"
                                  : surface.runtime.process_detected
                                    ? "detected"
                                    : "not detected"}
                              </Text>
                            </VStack>
                            <VStack align="stretch" gap={1}>
                              <Text fontSize="xs" color="gray.500">Deploy Age</Text>
                              <Text fontWeight="bold">{formatAge(surface.deploy?.age_seconds)}</Text>
                            </VStack>
                            <VStack align="stretch" gap={1}>
                              <Text fontSize="xs" color="gray.500">Runtime Errors</Text>
                              <Text fontWeight="bold">{surface.usage?.runtime_errors ?? "—"}</Text>
                            </VStack>
                          </SimpleGrid>

                          {surface.probes && surface.probes.length > 0 && (
                            <Table.Root size="sm">
                              <Table.Header>
                                <Table.Row>
                                  <Table.ColumnHeader>Probe</Table.ColumnHeader>
                                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                                  <Table.ColumnHeader textAlign="right">HTTP</Table.ColumnHeader>
                                  <Table.ColumnHeader textAlign="right">Latency</Table.ColumnHeader>
                                </Table.Row>
                              </Table.Header>
                              <Table.Body>
                                {surface.probes.map((probe) => (
                                  <Table.Row key={`${surfaceKey}-${probe.name}`}>
                                    <Table.Cell>
                                      <VStack align="start" gap={0}>
                                        <Text>{probe.name}</Text>
                                        {probe.url && (
                                          <Text fontSize="xs" color="gray.500">
                                            {probe.url}
                                          </Text>
                                        )}
                                      </VStack>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <StatusBadge status={probe.status} />
                                    </Table.Cell>
                                    <Table.Cell textAlign="right">{probe.http_status ?? "—"}</Table.Cell>
                                    <Table.Cell textAlign="right">
                                      {probe.latency_ms !== undefined && probe.latency_ms !== null
                                        ? `${probe.latency_ms}ms`
                                        : "—"}
                                    </Table.Cell>
                                  </Table.Row>
                                ))}
                              </Table.Body>
                            </Table.Root>
                          )}

                          {surface.probes?.some((probe) => probe.detail) && (
                            <Box pt={2} borderTopWidth="1px">
                              <Text fontSize="xs" color="gray.500" mb={1}>
                                Probe notes
                              </Text>
                              {surface.probes
                                .filter((probe) => probe.detail)
                                .map((probe) => (
                                  <Text key={`${surfaceKey}-${probe.name}-detail`} fontSize="xs" color="gray.500">
                                    • {probe.name}: {probe.detail}
                                  </Text>
                                ))}
                            </Box>
                          )}

                          {surface.errors && surface.errors.length > 0 && (
                            <Box pt={2} borderTopWidth="1px">
                              <Text fontSize="xs" color="gray.500" mb={1}>
                                Surface notes
                              </Text>
                              {surface.errors.map((errorText) => (
                                <Text key={errorText} fontSize="xs" color="gray.500">
                                  • {errorText}
                                </Text>
                              ))}
                            </Box>
                          )}
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  ))}
                </SimpleGrid>

                {applicationSurfaceEntries.length === 0 && (
                  <Text fontSize="sm" color="gray.500">
                    No application surfaces are configured yet.
                  </Text>
                )}
                {surfaceErrors.length > 0 && (
                  <Box pt={2} borderTopWidth="1px">
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Section notes
                    </Text>
                    {surfaceErrors.map((errorText) => (
                      <Text key={errorText} fontSize="xs" color="gray.500">
                        • {errorText}
                      </Text>
                    ))}
                  </Box>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
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
    const backupUnits = Object.entries(backups?.units || {});
    const backupsCollectedAt = backupsDetail?.collected_at
      ? new Date(backupsDetail.collected_at).toLocaleString()
      : null;
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Backups</Text>
            <StatusBadge status={backupsDetail?.status || backupsSummary?.status} />
          </HStack>

          <Card.Root borderLeftWidth="4px" borderLeftColor={`${getStatusColor(backupsDetail?.status || backupsSummary?.status)}.500`}>
            <Card.Header>
              <HStack justify="space-between">
                <Text fontWeight="semibold">Backup Monitor</Text>
                <StatusBadge status={backupsDetail?.status || backupsSummary?.status} />
              </HStack>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={2}>
                <Text fontSize="sm" color="gray.500">
                  {backupsCollectedAt ? `Collected ${backupsCollectedAt}` : "No backup detail collected yet"}
                </Text>
                {backupsDetail?.source && (
                  <Text fontSize="xs" color="gray.500">Source: {backupsDetail.source}</Text>
                )}
                <Text fontSize="sm">
                  This monitor combines systemd timer/unit state with success stamp files and the configured 72-hour backup window.
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Text fontWeight="semibold">Backup Policy</Text>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={2}>
                <Text fontSize="sm">
                  Backup timers wake daily. The backup scripts themselves may skip until 72 hours have passed
                  since the last successful archive.
                </Text>
                <Text fontSize="sm" color="gray.600">
                  A red or orange state here usually means a timer is inactive, a trigger is stale, or a oneshot
                  backup/upload unit failed.
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          {backupMonitorEntries.length > 0 && (
            <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
              {backupMonitorEntries.map(([monitorKey, monitor]) => (
                <Card.Root
                  key={monitorKey}
                  variant="outline"
                  borderLeftWidth="4px"
                  borderLeftColor={`${getStatusColor(monitor.status)}.500`}
                >
                  <Card.Header>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">{monitor.label || monitorKey}</Text>
                      <StatusBadge status={monitor.status} />
                    </HStack>
                  </Card.Header>
                  <Card.Body>
                    <VStack align="stretch" gap={2}>
                      <Text fontWeight="bold">{monitor.summary?.headline || "—"}</Text>
                      {monitor.summary?.detail && (
                        <Text fontSize="sm" color="gray.600">{monitor.summary.detail}</Text>
                      )}
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">Evidence source</Text>
                        <Text fontSize="sm">{monitor.success_source || "unknown"}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">Last success</Text>
                        <Text fontSize="sm">
                          {monitor.last_success_at
                            ? `${formatDateTime(monitor.last_success_at)}`
                            : "—"}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">Age</Text>
                        <Text fontSize="sm">
                          {monitor.last_success_age_seconds !== undefined && monitor.last_success_age_seconds !== null
                            ? formatUptime(monitor.last_success_age_seconds)
                            : "—"}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">Next expected</Text>
                        <Text fontSize="sm">
                          {monitor.next_expected_at
                            ? formatDateTime(monitor.next_expected_at)
                            : "—"}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">72h window</Text>
                        <Text fontSize="sm">
                          {monitor.window_elapsed === undefined || monitor.window_elapsed === null
                            ? "unknown"
                            : monitor.window_elapsed
                              ? "elapsed"
                              : "within window"}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.500">Off-host</Text>
                        <StatusBadge status={monitor.off_host_status || "unknown"} />
                      </HStack>
                      {monitor.stamp_file && (
                        <VStack align="stretch" gap={1}>
                          <Text fontSize="sm" color="gray.500">Stamp file</Text>
                          <Code fontSize="xs" whiteSpace="normal">{monitor.stamp_file}</Code>
                        </VStack>
                      )}
                      {monitor.archive_inventory && (
                        <Box pt={2} borderTopWidth="1px">
                          <VStack align="stretch" gap={2}>
                            <HStack justify="space-between">
                              <Text fontSize="sm" color="gray.500">Archive path</Text>
                              <Code fontSize="xs" whiteSpace="normal">{monitor.archive_inventory.path || "—"}</Code>
                            </HStack>
                            <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
                              <VStack align="stretch" gap={1}>
                                <Text fontSize="sm" color="gray.500">File count</Text>
                                <Text fontWeight="bold">{monitor.archive_inventory.file_count ?? "—"}</Text>
                              </VStack>
                              <VStack align="stretch" gap={1}>
                                <Text fontSize="sm" color="gray.500">Total size</Text>
                                <Text fontWeight="bold">{formatBytes(monitor.archive_inventory.total_bytes)}</Text>
                              </VStack>
                              <VStack align="stretch" gap={1}>
                                <Text fontSize="sm" color="gray.500">Newest file age</Text>
                                <Text fontWeight="bold">{formatAge(monitor.archive_inventory.newest_age_seconds)}</Text>
                              </VStack>
                              <VStack align="stretch" gap={1}>
                                <Text fontSize="sm" color="gray.500">Newest file</Text>
                                <Text fontWeight="bold" fontSize="sm">
                                  {monitor.archive_inventory.newest_file || "—"}
                                </Text>
                              </VStack>
                            </SimpleGrid>

                            {(monitor.archive_inventory.expected_archives || []).length > 0 && (
                              <Table.Root size="sm" variant="line">
                                <Table.Header>
                                  <Table.Row>
                                    <Table.ColumnHeader>Target</Table.ColumnHeader>
                                    <Table.ColumnHeader>Present</Table.ColumnHeader>
                                    <Table.ColumnHeader>Latest File</Table.ColumnHeader>
                                    <Table.ColumnHeader>Age</Table.ColumnHeader>
                                    <Table.ColumnHeader>Size</Table.ColumnHeader>
                                  </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                  {(monitor.archive_inventory.expected_archives || []).map((archive) => (
                                    <Table.Row key={archive.label || archive.prefix || "archive"}>
                                      <Table.Cell>{archive.label || "archive"}</Table.Cell>
                                      <Table.Cell>
                                        <StatusBadge status={archive.present ? "healthy" : "critical"} />
                                      </Table.Cell>
                                      <Table.Cell>{archive.latest_file || "—"}</Table.Cell>
                                      <Table.Cell>{formatAge(archive.latest_age_seconds)}</Table.Cell>
                                      <Table.Cell>{formatBytes(archive.size_bytes)}</Table.Cell>
                                    </Table.Row>
                                  ))}
                                </Table.Body>
                              </Table.Root>
                            )}
                          </VStack>
                        </Box>
                      )}
                      {(monitor.errors || []).length > 0 && (
                        <Box pt={2} borderTopWidth="1px">
                          {(monitor.errors || []).map((error) => (
                            <Text key={error} fontSize="xs" color="red.500">• {error}</Text>
                          ))}
                        </Box>
                      )}
                    </VStack>
                  </Card.Body>
                </Card.Root>
              ))}
            </SimpleGrid>
          )}

          <MultiUnitServiceCard name="Backup Units" data={backups} backupsSummary={backupsSummary} />

          {backupUnits.length > 0 && (
            <Card.Root variant="outline">
              <Card.Header>
                <Text fontWeight="semibold">Unit Detail</Text>
              </Card.Header>
              <Card.Body>
                <Table.Root size="sm" variant="line">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Unit</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>Last Trigger</Table.ColumnHeader>
                      <Table.ColumnHeader>Result</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {backupUnits.map(([unitName, unitState]) => (
                      <Table.Row key={unitName}>
                        <Table.Cell>
                          <VStack align="start" gap={0}>
                            <Text>{unitName.replace(/^crossroads-/, "")}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {unitState?.active_state || "unknown"} / {unitState?.sub_state || "—"}
                            </Text>
                          </VStack>
                        </Table.Cell>
                        <Table.Cell>
                          <StatusBadge status={unitState?.status || unitState?.active_state} />
                        </Table.Cell>
                        <Table.Cell>
                          {unitState?.last_trigger_age_seconds !== undefined && unitState?.last_trigger_age_seconds !== null
                            ? `${formatUptime(unitState.last_trigger_age_seconds)} ago`
                            : unitState?.last_trigger_timestamp || "—"}
                        </Table.Cell>
                        <Table.Cell>{unitState?.result || "—"}</Table.Cell>
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
    const livewireStatus = livewireDetail?.status || livewire?.status || "unavailable";
    const livewireCollectedAt = livewireDetail?.collected_at
      ? new Date(livewireDetail.collected_at).toLocaleString()
      : null;

    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <Text fontSize="xl" fontWeight="bold">Livewire (Realtime)</Text>
            <StatusBadge status={livewireStatus} />
          </HStack>

          <Card.Root borderLeftWidth="4px" borderLeftColor={`${getStatusColor(livewireStatus)}.500`}>
            <Card.Header>
              <HStack justify="space-between">
                <Text fontWeight="semibold">Socket.IO Handshake Monitor</Text>
                <StatusBadge status={livewireStatus} />
              </HStack>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between" align="start" wrap="wrap">
                  <VStack align="start" gap={1}>
                    <Text fontSize="sm" color="gray.500">
                      {livewireCollectedAt ? `Collected ${livewireCollectedAt}` : "No Livewire probe collected yet"}
                    </Text>
                    {livewireDetail?.source && (
                      <Text fontSize="xs" color="gray.500">
                        Source: {livewireDetail.source}
                      </Text>
                    )}
                  </VStack>
                  <Button size="sm" variant="outline" onClick={handleRefresh} loading={isFetching}>
                    Refresh
                  </Button>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Endpoint</Text>
                    <Code whiteSpace="normal">{livewireDetail?.data?.endpoint || "—"}</Code>
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Provider</Text>
                    <Text>{livewireDetail?.data?.provider || "—"} • {livewireDetail?.data?.environment || "—"}</Text>
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Summary</Text>
                    <Text fontWeight="bold">{livewireDetail?.data?.summary?.headline || "Probe pending"}</Text>
                    {livewireDetail?.data?.summary?.detail && (
                      <Text fontSize="sm" color="gray.600">{livewireDetail.data.summary.detail}</Text>
                    )}
                  </VStack>
                  <VStack align="stretch" gap={1}>
                    <Text fontSize="sm" color="gray.500">Runtime</Text>
                    <Text>
                      Port {livewireDetail?.data?.runtime?.port ?? "—"} • {livewireDetail?.data?.runtime?.process_detected ? "reachable" : "unreachable"}
                    </Text>
                  </VStack>
                </SimpleGrid>

                <Card.Root variant="outline">
                  <Card.Header>
                    <Text fontWeight="semibold">Probe</Text>
                  </Card.Header>
                  <Card.Body>
                    <Table.Root size="sm" variant="line">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>Name</Table.ColumnHeader>
                          <Table.ColumnHeader>Status</Table.ColumnHeader>
                          <Table.ColumnHeader>HTTP</Table.ColumnHeader>
                          <Table.ColumnHeader>Latency</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        <Table.Row>
                          <Table.Cell>
                            <VStack align="start" gap={0}>
                              <Text>{livewireDetail?.data?.probe?.name || "socketio_handshake"}</Text>
                              {livewireDetail?.data?.probe?.url && (
                                <Code fontSize="xs" whiteSpace="normal">{livewireDetail.data.probe.url}</Code>
                              )}
                            </VStack>
                          </Table.Cell>
                          <Table.Cell>
                            <StatusBadge status={livewireDetail?.data?.probe?.status || livewireStatus} />
                          </Table.Cell>
                          <Table.Cell>{livewireDetail?.data?.probe?.http_status ?? "—"}</Table.Cell>
                          <Table.Cell>{livewireDetail?.data?.probe?.latency_ms ? `${livewireDetail.data.probe.latency_ms} ms` : "—"}</Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table.Root>
                    {livewireDetail?.data?.probe?.detail && (
                      <Text fontSize="sm" color="red.500" mt={3}>
                        Probe detail: {livewireDetail.data.probe.detail}
                      </Text>
                    )}
                  </Card.Body>
                </Card.Root>

                {(livewireDetail?.data?.notes?.length || livewireDetail?.errors?.length) && (
                  <Card.Root variant="outline">
                    <Card.Header>
                      <Text fontWeight="semibold">Notes</Text>
                    </Card.Header>
                    <Card.Body>
                      <VStack align="stretch" gap={2}>
                        {(livewireDetail?.data?.notes || []).map((note) => (
                          <Text key={note} fontSize="sm">{note}</Text>
                        ))}
                        {(livewireDetail?.errors || []).map((error) => (
                          <Text key={error} fontSize="sm" color="red.500">{error}</Text>
                        ))}
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>

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

  if (section === "puddlejump-status") {
    return (
      <WorkAreaWrapper>
        <VStack className="swa-project-status-root" align="stretch" gap={6}>
          <HStack justify="space-between" align={{ base: "stretch", md: "center" }} flexDirection={{ base: "column", md: "row" }}>
            <VStack align="stretch" gap={1}>
              <Text fontSize="2xl" fontWeight="bold">Project Status</Text>
              <Text fontSize="sm" color="gray.500">
                Local Puddlejump decision records, build plans, checkpoint state, and canonical build-log timeline.
              </Text>
            </VStack>
            <Button size="sm" onClick={handleRefreshProjectStatus} loading={projectStatusFetching}>
              Refresh
            </Button>
          </HStack>

          {projectStatusError && <Text color="red.500">Unable to load project status.</Text>}
          {projectStatusLoading && <Text>Loading project status...</Text>}

          {!projectStatusLoading && !projectStatusError && projectStatus && !projectStatus.available && (
            <Card.Root>
              <Card.Body>
                <VStack align="stretch" gap={2}>
                  <Text fontWeight="semibold">Puddlejump path is not configured.</Text>
                  <Text fontSize="sm" color="gray.600">
                    {projectStatus.reason || "Set PUDDLEJUMP_PATH in local Django settings to enable this view."}
                  </Text>
                </VStack>
              </Card.Body>
            </Card.Root>
          )}

          {!projectStatusLoading && !projectStatusError && projectStatus?.available && (
            <Tabs.Root className="swa-project-status-tabs" defaultValue="checkpoints">
              <Tabs.List mb={4}>
                <Tabs.Trigger value="checkpoints">Checkpoint Dashboard</Tabs.Trigger>
                <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
                <Tabs.Indicator />
              </Tabs.List>

              <Tabs.Content className="swa-project-status-checkpoints" value="checkpoints">
                <VStack align="stretch" gap={4}>
                  <Card.Root>
                    <Card.Body>
                      <Grid className="swa-project-status-filters" templateColumns={{ base: "1fr", md: "minmax(0, 2fr) 220px" }} gap={4}>
                        <Field.Root>
                          <Field.Label>Search</Field.Label>
                          <Input
                            placeholder="Name, path, class, status, or library"
                            value={projectSearch}
                            onChange={(event) => setProjectSearch(event.target.value)}
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Queue State</Field.Label>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={projectQueueState}
                              onChange={(event) => setProjectQueueState(event.target.value)}
                            >
                              <option value="">All states</option>
                              {projectQueueChoices.map((state) => (
                                <option key={state} value={state}>
                                  {formatQueueState(state)}
                                </option>
                              ))}
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                        </Field.Root>
                      </Grid>
                    </Card.Body>
                  </Card.Root>

                  <HStack justify="space-between" align={{ base: "stretch", md: "center" }} flexDirection={{ base: "column", md: "row" }}>
                    <Text fontSize="sm" color="gray.500">
                      Showing {projectDecisions.length} of {projectStatus.decisions.length} decision records and build plans.
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Generated at: {formatDateTime(projectStatus.generated_at)}
                    </Text>
                  </HStack>

                  <Card.Root>
                    <Card.Body overflowX="auto">
                      <Table.Root size="sm">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>Name</Table.ColumnHeader>
                            <Table.ColumnHeader>Class</Table.ColumnHeader>
                            <Table.ColumnHeader>Status</Table.ColumnHeader>
                            <Table.ColumnHeader>Queue</Table.ColumnHeader>
                            <Table.ColumnHeader>Checkpoints</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {projectDecisions.map((decision) => {
                            const percent = getCheckpointPercent(decision);
                            const checkpointLabel = decision.checkpoint_counts.total
                              ? `${decision.checkpoint_counts.done}/${decision.checkpoint_counts.total}`
                              : "none";
                            return (
                              <Table.Row key={decision.path}>
                                <Table.Cell minW="260px">
                                  <VStack align="stretch" gap={1}>
                                    <Text fontWeight="semibold">{decision.name}</Text>
                                    <Text fontSize="xs" color="gray.500">{decision.path}</Text>
                                  </VStack>
                                </Table.Cell>
                                <Table.Cell>
                                  <Badge colorPalette="blue" variant="subtle">
                                    {decision.class || "unknown"}
                                  </Badge>
                                </Table.Cell>
                                <Table.Cell maxW="280px">
                                  <Text fontSize="sm">{decision.status || "—"}</Text>
                                </Table.Cell>
                                <Table.Cell>
                                  <Badge colorPalette={getQueueStateColor(decision.queue_state)} variant="subtle">
                                    {formatQueueState(decision.queue_state)}
                                  </Badge>
                                </Table.Cell>
                                <Table.Cell minW="190px">
                                  <VStack align="stretch" gap={1}>
                                    <HStack justify="space-between">
                                      <Text fontSize="xs" color="gray.500">{checkpointLabel}</Text>
                                      {decision.checkpoint_counts.in_progress > 0 && (
                                        <Text fontSize="xs" color="orange.500">
                                          {decision.checkpoint_counts.in_progress} active
                                        </Text>
                                      )}
                                    </HStack>
                                    <Progress.Root value={percent} size="sm">
                                      <Progress.Track>
                                        <Progress.Range />
                                      </Progress.Track>
                                    </Progress.Root>
                                  </VStack>
                                </Table.Cell>
                              </Table.Row>
                            );
                          })}
                        </Table.Body>
                      </Table.Root>
                    </Card.Body>
                  </Card.Root>
                </VStack>
              </Tabs.Content>

              <Tabs.Content className="swa-project-status-timeline" value="timeline">
                <VStack align="stretch" gap={4}>
                  <Card.Root>
                    <Card.Body>
                      <Grid className="swa-project-timeline-filters" templateColumns={{ base: "1fr", md: "minmax(0, 2fr) 1fr 1fr 180px" }} gap={4}>
                        <Field.Root>
                          <Field.Label>Search</Field.Label>
                          <Input
                            placeholder="Commit, repo, work effort, source, or summary"
                            value={projectTimelineSearch}
                            onChange={(event) => setProjectTimelineSearch(event.target.value)}
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Repo</Field.Label>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={projectTimelineRepo}
                              onChange={(event) => setProjectTimelineRepo(event.target.value)}
                            >
                              <option value="">All repos</option>
                              {projectTimelineRepoChoices.map((repo) => (
                                <option key={repo} value={repo}>
                                  {repo}
                                </option>
                              ))}
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Work Effort</Field.Label>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={projectTimelineWorkEffort}
                              onChange={(event) => setProjectTimelineWorkEffort(event.target.value)}
                            >
                              <option value="">All work efforts</option>
                              {projectTimelineWorkEffortChoices.map((workEffort) => (
                                <option key={workEffort} value={workEffort}>
                                  {workEffort}
                                </option>
                              ))}
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Source</Field.Label>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={projectTimelineSource}
                              onChange={(event) => setProjectTimelineSource(event.target.value)}
                            >
                              <option value="">All sources</option>
                              {projectTimelineSourceChoices.map((source) => (
                                <option key={source} value={source}>
                                  {formatTimelineSource(source)}
                                </option>
                              ))}
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                        </Field.Root>
                      </Grid>
                    </Card.Body>
                  </Card.Root>

                  <HStack justify="space-between" align={{ base: "stretch", md: "center" }} flexDirection={{ base: "column", md: "row" }}>
                    <Text fontSize="sm" color="gray.500">
                      Showing {projectTimelineEntries.length} of {projectStatus.timeline.length} canonical and unswept build-log entries.
                    </Text>
                    <Badge colorPalette={projectStatus.unprocessed_inbox_count > 0 ? "orange" : "gray"} variant="subtle" alignSelf={{ base: "flex-start", md: "center" }}>
                      {projectStatus.unprocessed_inbox_count} unprocessed inbox entries
                    </Badge>
                  </HStack>

                  <VStack align="stretch" gap={4}>
                    {projectTimelineEntries.map((entry) => (
                      <ProjectTimelineEntryCard key={`${entry.repo}-${entry.commit_hash}-${entry.source}`} entry={entry} />
                    ))}
                    {projectTimelineEntries.length === 0 && (
                      <Text color="gray.500">No timeline entries match the current filters.</Text>
                    )}
                  </VStack>
                </VStack>
              </Tabs.Content>
            </Tabs.Root>
          )}
        </VStack>
      </WorkAreaWrapper>
    );
  }

  if (section === "diag-build-log") {
    return (
      <WorkAreaWrapper>
        <VStack align="stretch" gap={6}>
          <HStack justify="space-between" align={{ base: "stretch", md: "center" }} flexDirection={{ base: "column", md: "row" }}>
            <VStack align="stretch" gap={1}>
              <Text fontSize="2xl" fontWeight="bold">Build Log</Text>
              <Text fontSize="sm" color="gray.500">
                Review build-session handoffs across repos without leaving the sysadmin dashboard.
              </Text>
            </VStack>
            <Button size="sm" onClick={handleRefreshBuildLog} loading={buildLogFetching}>
              Refresh
            </Button>
          </HStack>

          <Card.Root>
            <Card.Body>
              <Grid templateColumns={{ base: "1fr", md: "minmax(0, 2fr) 220px" }} gap={4}>
                <Field.Root>
                  <Field.Label>Search</Field.Label>
                  <Input
                    placeholder="Commit hash, message, work effort, or body"
                    value={buildLogSearch}
                    onChange={(event) => setBuildLogSearch(event.target.value)}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Repo</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={buildLogRepo}
                      onChange={(event) => setBuildLogRepo(event.target.value)}
                    >
                      <option value="">All repos</option>
                      {buildLogRepoChoices.map((repo) => (
                        <option key={repo} value={repo}>
                          {repo}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Field.Root>
              </Grid>
            </Card.Body>
          </Card.Root>

          <HStack justify="space-between" align={{ base: "stretch", md: "center" }} flexDirection={{ base: "column", md: "row" }}>
            <Text fontSize="sm" color="gray.500">
              {buildLogCount === 0
                ? "No build log entries found."
                : `Showing ${buildLogPageStart}–${buildLogPageEnd} of ${buildLogCount} entries`}
            </Text>
            <HStack gap={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBuildLogOffset((current) => Math.max(0, current - BUILD_LOG_PAGE_SIZE))}
                disabled={buildLogOffset === 0}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBuildLogOffset((current) => current + BUILD_LOG_PAGE_SIZE)}
                disabled={buildLogOffset + BUILD_LOG_PAGE_SIZE >= buildLogCount}
              >
                Next
              </Button>
            </HStack>
          </HStack>

          {buildLogLoading && <Text>Loading build log entries...</Text>}
          {buildLogError && <Text color="red.500">Unable to load build log entries.</Text>}

          {!buildLogLoading && !buildLogError && (
            <VStack align="stretch" gap={4}>
              {buildLogEntries.map((entry) => {
                const isExpanded = expandedEntryId === entry.id;
                return (
                  <BuildLogEntryCard
                    key={entry.id}
                    entry={entry}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                  />
                );
              })}
            </VStack>
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

function ProjectTimelineEntryCard({ entry }: { entry: ProjectStatusTimelineEntry }) {
  return (
    <Card.Root borderLeftWidth="4px" borderLeftColor="teal.500">
      <Card.Header>
        <Flex justify="space-between" gap={3} align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }}>
          <VStack align="stretch" gap={1} flex="1">
            <HStack gap={2} flexWrap="wrap">
              <Badge colorPalette="teal">{entry.repo}</Badge>
              <Badge colorPalette={getTimelineSourceColor(entry.source)} variant="subtle">
                {formatTimelineSource(entry.source)}
              </Badge>
              <Text fontSize="sm" color="gray.500">{formatDate(entry.date)}</Text>
              <Text fontSize="sm" fontFamily="mono">{entry.commit_hash}</Text>
            </HStack>
            <Text fontWeight="semibold">{entry.commit_message || "No commit message recorded."}</Text>
          </VStack>
          {entry.work_effort && (
            <Badge colorPalette="gray" variant="outline">
              {entry.work_effort}
            </Badge>
          )}
        </Flex>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={3}>
          <Text whiteSpace="pre-wrap">{entry.body || "No build summary recorded."}</Text>
          <Separator />
          <Text fontSize="xs" color="gray.500">
            Source file: {entry.source_filename || "—"}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

function BuildLogEntryCard({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: BuildLogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const bodyPreview = entry.body.length > 220 ? `${entry.body.slice(0, 220)}...` : entry.body;

  return (
    <Card.Root borderLeftWidth="4px" borderLeftColor="blue.500">
      <Card.Header>
        <VStack align="stretch" gap={3}>
          <Flex justify="space-between" gap={3} align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }}>
            <VStack align="stretch" gap={1} flex="1">
              <HStack gap={2} flexWrap="wrap">
                <Badge colorScheme="blue">{entry.repo}</Badge>
                <Text fontSize="sm" color="gray.500">{formatDate(entry.date)}</Text>
                <Text fontSize="sm" fontFamily="mono">{entry.commit_hash}</Text>
              </HStack>
              <Text fontWeight="semibold">{entry.commit_message || "No commit message recorded."}</Text>
            </VStack>
            <Button size="sm" variant="outline" onClick={onToggle}>
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </Flex>
          {entry.work_effort && (
            <Text fontSize="sm" color="gray.600">
              Work effort: {entry.work_effort}
            </Text>
          )}
        </VStack>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={3}>
          <Text whiteSpace="pre-wrap">{isExpanded ? entry.body : bodyPreview || "No build summary recorded."}</Text>
          <Separator />
          <HStack justify="space-between" align={{ base: "stretch", md: "center" }} flexDirection={{ base: "column", md: "row" }}>
            <Text fontSize="xs" color="gray.500">
              Source file: {entry.source_filename || "—"}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Ingested: {formatDateTime(entry.ingested_at)}
            </Text>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
