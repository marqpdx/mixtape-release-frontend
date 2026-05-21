// packages/api/src/hooks/ops/useOps.ts

import { useQuery } from "@tanstack/react-query";
import { fetchBuildLogEntries, fetchOpsSummary, fetchOpsTiles, fetchOpsSnapshot } from "../../clients/ops/opsApi";
import type {
  BuildLogListParams,
  BuildLogListResponse,
  OpsSummaryResponse,
  OpsTilesResponse,
  OpsHealthSnapshotResponse,
} from "../../clients/ops/opsApi";

export const opsQueryKeys = {
  all: ["ops"] as const,
  summary: () => [opsQueryKeys.all, "summary"] as const,
  tiles: () => [opsQueryKeys.all, "tiles"] as const,
  snapshot: () => [opsQueryKeys.all, "snapshot"] as const,
  buildLog: (params: BuildLogListParams) => [opsQueryKeys.all, "build-log", params] as const,
};

interface OpsQueryOptions {
  enabled?: boolean;
}

export const useOpsSummary = (options: OpsQueryOptions = {}) => {
  const { enabled = true } = options;
  return useQuery<OpsSummaryResponse>({
    queryKey: opsQueryKeys.summary(),
    queryFn: fetchOpsSummary,
    enabled,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fetch fresh data on refetch
  });
};

export const useOpsTiles = (options: OpsQueryOptions = {}) => {
  const { enabled = true } = options;
  return useQuery<OpsTilesResponse>({
    queryKey: opsQueryKeys.tiles(),
    queryFn: fetchOpsTiles,
    enabled,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
};

export const useOpsSnapshot = (options: OpsQueryOptions = {}) => {
  const { enabled = true } = options;
  return useQuery<OpsHealthSnapshotResponse>({
    queryKey: opsQueryKeys.snapshot(),
    queryFn: fetchOpsSnapshot,
    enabled,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
};

export const useBuildLogEntries = (
  params: BuildLogListParams,
  options: OpsQueryOptions = {},
) => {
  const { enabled = true } = options;
  return useQuery<BuildLogListResponse>({
    queryKey: opsQueryKeys.buildLog(params),
    queryFn: () => fetchBuildLogEntries(params),
    enabled,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
};
