// packages/api/src/hooks/ops/useOps.ts

import { useQuery } from "@tanstack/react-query";
import { fetchOpsSummary, fetchOpsTiles, fetchOpsSnapshot } from "../../clients/ops/opsApi";
import type {
  OpsSummaryResponse,
  OpsTilesResponse,
  OpsHealthSnapshotResponse,
} from "../../clients/ops/opsApi";

export const opsQueryKeys = {
  all: ["ops"] as const,
  summary: () => [opsQueryKeys.all, "summary"] as const,
  tiles: () => [opsQueryKeys.all, "tiles"] as const,
  snapshot: () => [opsQueryKeys.all, "snapshot"] as const,
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
