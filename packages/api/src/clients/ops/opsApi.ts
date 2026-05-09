// packages/api/src/clients/ops/opsApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface OpsSummaryTile {
  title: string;
  status: "healthy" | "degraded" | "critical" | string;
  detail: string;
  hint?: string;
}

export interface OpsSummaryResponse {
  timestamp: string;
  overall_status: "healthy" | "degraded" | "critical" | string;
  headline: string;
  highlights: string[];
  tiles: OpsSummaryTile[];
}

export interface OpsTilesResponse {
  timestamp: string;
  tiles: OpsSummaryTile[];
}

export interface OpsPostgresDetailSection {
  status?: "healthy" | "degraded" | "critical" | "stale" | "unavailable" | string;
  latency_ms?: number;
  collected_at?: string | null;
  expires_at?: string | null;
  source?: string | null;
  errors?: string[];
  data?: {
    connection_breakdown?: {
      active?: number;
      idle?: number;
      idle_in_transaction?: number;
      waiting?: number;
    };
    long_running_queries?: Array<{
      pid: number;
      duration_seconds: number;
      query: string;
      state: string;
    }>;
    db_size_bytes?: number | null;
    top_tables?: Array<{
      table_name: string;
      total_bytes: number;
      table_bytes: number;
    }>;
    cache_hit_ratio?: number | null;
    dead_tuple_tables?: Array<{
      table_name: string;
      dead_tuples: number;
      live_tuples: number;
    }>;
    replication?: Array<{
      client_addr: string;
      lag_seconds: number;
    }>;
  };
}

export interface OpsHealthSnapshotResponse {
  schema_version: string;
  generated_at: string;
  system: Record<string, unknown>;
  processes: Record<string, unknown>;
  disk: Record<string, unknown>;
  network: Record<string, unknown>;
  services: Record<string, unknown>;
  application: Record<string, unknown>;
  postgres_detail?: OpsPostgresDetailSection;
}

// Cache-busting parameter to bypass nginx/proxy caching
function cacheBust(url: string): string {
  return `${url}?_t=${Date.now()}`;
}

export async function fetchOpsSummary(): Promise<OpsSummaryResponse> {
  const res = await axiosInstance.get(cacheBust("/api/ops/summary"));
  return res.data as OpsSummaryResponse;
}

export async function fetchOpsTiles(): Promise<OpsTilesResponse> {
  const res = await axiosInstance.get(cacheBust("/api/ops/tiles"));
  return res.data as OpsTilesResponse;
}

export async function fetchOpsSnapshot(): Promise<OpsHealthSnapshotResponse> {
  const res = await axiosInstance.get(cacheBust("/api/ops/health-snapshot"));
  return res.data as OpsHealthSnapshotResponse;
}
