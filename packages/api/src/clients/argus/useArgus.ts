"use client";

import { useQueries, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { argusApi } from "./argusApi";
import type { ArgusApi, ArgusSeriesCreate, ArgusSeriesRecord } from "./types";

export const argusKeys = {
  all: (identity: string) => ["argus", identity] as const,
  blocks: (identity: string) => ["argus", identity, "blocks"] as const,
  block: (identity: string, slug: string) => ["argus", identity, "block", slug] as const,
  series: (identity: string, id: string) => ["argus", identity, "series", id] as const,
  tracked: (identity: string) => ["argus", identity, "tracked-series"] as const,
};

// Pure data hooks in the owned client folder; no shared API barrel changes.
// identity scopes the cache so assuming/exiting another identity cannot reuse it.
export function useArgus(identity: string, selectedBlock: string | null, api: ArgusApi = argusApi) {
  const cache = useQueryClient();
  const blocks = useQuery({
    queryKey: argusKeys.blocks(identity), queryFn: ({ signal }) => api.listBlocks(signal),
    retry: false, refetchOnWindowFocus: false,
    refetchInterval: (query) => query.state.status === "error" ? false : 15_000,
  });
  const block = useQuery({
    queryKey: argusKeys.block(identity, selectedBlock ?? ""),
    queryFn: ({ signal }) => api.getBlock(selectedBlock!, signal), enabled: !!selectedBlock && blocks.isSuccess,
    retry: false, refetchOnWindowFocus: false,
    refetchInterval: (query) => query.state.status === "error" ? false : 15_000,
  });
  // Remember identifiers only, never local consent or synthetic series records.
  // Keep newly created/stopped series visible while this query cache lives.
  const tracked = useQuery<string[]>({
    queryKey: argusKeys.tracked(identity), queryFn: async () => [], initialData: [],
    enabled: false, staleTime: Infinity,
  });
  const ids = [...new Set([
    ...(blocks.data?.blocks.flatMap((item) => item.active_series_id ? [item.active_series_id] : []) ?? []),
    ...tracked.data,
  ])];
  const series = useQueries({ queries: ids.map((id) => ({
    queryKey: argusKeys.series(identity, id), queryFn: ({ signal }: { signal: AbortSignal }) => api.getSeries(id, signal),
    retry: false, refetchOnWindowFocus: false,
    refetchInterval: (query: { state: { status: string; data?: ArgusSeriesRecord } }) =>
      query.state.status !== "error" && query.state.data?.status === "active" ? 10_000 : false,
  })) });
  const refresh = () => cache.invalidateQueries({ queryKey: argusKeys.all(identity) });
  const startRun = useMutation({
    mutationFn: (slug: string) => api.startRun(slug), retry: false,
    onSettled: refresh,
  });
  const createSeries = useMutation({
    mutationFn: (request: ArgusSeriesCreate) => api.createSeries(request), retry: false,
    onSuccess: async (result) => {
      await cache.cancelQueries({ queryKey: argusKeys.series(identity, result.series_id) });
      cache.setQueryData(argusKeys.series(identity, result.series_id), result);
      cache.setQueryData<string[]>(argusKeys.tracked(identity), (previous = []) => [...new Set([...previous, result.series_id])]);
    },
    onSettled: refresh,
  });
  const stopSeries = useMutation({
    mutationFn: (id: string) => api.stopSeries(id), retry: false,
    onSuccess: async (result) => {
      const key = argusKeys.series(identity, result.series_id);
      await cache.cancelQueries({ queryKey: key });
      cache.setQueryData<ArgusSeriesRecord>(key, (previous) => previous ? { ...previous, status: result.status } : previous);
      cache.setQueryData<string[]>(argusKeys.tracked(identity), (previous = []) => [...new Set([...previous, result.series_id])]);
    },
    onSettled: refresh,
  });
  return { blocks, block, series, seriesIds: ids, refresh, startRun, createSeries, stopSeries };
}
