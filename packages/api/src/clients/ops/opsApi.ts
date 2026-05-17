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

export interface OpsApplicationSurfaceProbe {
  name: string;
  url?: string;
  status: "healthy" | "degraded" | "critical" | "unavailable" | string;
  http_status?: number | null;
  latency_ms?: number | null;
  detail?: string;
}

export interface OpsApplicationSurface {
  label: string;
  surface_type: "nextjs" | "mobile" | "webapp" | string;
  provider: "local-next" | "vercel" | "expo" | "unknown" | string;
  environment: "local" | "preview" | "production" | string;
  status: "healthy" | "degraded" | "critical" | "stale" | "unavailable" | string;
  endpoint?: string;
  notes?: string[];
  errors?: string[];
  summary?: {
    headline?: string;
    detail?: string;
  };
  probes?: OpsApplicationSurfaceProbe[];
  runtime?: {
    process_detected?: boolean;
    pid?: number | null;
    uptime_seconds?: number | null;
    port?: number | null;
  };
  deploy?: {
    state?: string;
    url?: string;
    age_seconds?: number | null;
  };
  routing?: {
    production_domain?: string;
    alias_count?: number | null;
  };
  checks?: {
    status?: string;
    passing?: number | null;
    failing?: number | null;
  };
  usage?: {
    runtime_errors?: number | null;
  };
}

export interface OpsApplicationSurfacesSection {
  status?: "healthy" | "degraded" | "critical" | "stale" | "unavailable" | string;
  latency_ms?: number;
  collected_at?: string | null;
  expires_at?: string | null;
  source?: string | null;
  errors?: string[];
  data?: {
    surfaces?: Record<string, OpsApplicationSurface>;
  };
}

export interface OpsLivewireDetailSection {
  status?: "healthy" | "degraded" | "critical" | "stale" | "unavailable" | string;
  latency_ms?: number;
  collected_at?: string | null;
  expires_at?: string | null;
  source?: string | null;
  errors?: string[];
  data?: {
    label?: string;
    provider?: string;
    environment?: string;
    endpoint?: string;
    probe?: {
      name?: string;
      url?: string;
      status?: string;
      http_status?: number | null;
      latency_ms?: number | null;
      detail?: string | null;
    };
    runtime?: {
      process_detected?: boolean;
      port?: number | null;
    };
    summary?: {
      headline?: string;
      detail?: string;
    };
    notes?: string[];
  };
}

export interface OpsBackupsDetailSection {
  status?: "healthy" | "degraded" | "critical" | "stale" | "unavailable" | string;
  latency_ms?: number;
  collected_at?: string | null;
  expires_at?: string | null;
  source?: string | null;
  errors?: string[];
  data?: {
    monitors?: Record<string, {
      label?: string;
      status?: string;
      interval_seconds?: number;
      stamp_file?: string | null;
      success_source?: "stamp" | "local_archive_fallback" | "none" | string;
      last_success_at?: string | null;
      last_success_age_seconds?: number | null;
      next_expected_at?: string | null;
      window_elapsed?: boolean | null;
      off_host_status?: string;
      archive_inventory?: {
        path?: string;
        file_count?: number;
        total_bytes?: number;
        newest_file?: string | null;
        newest_modified_at?: string | null;
        newest_age_seconds?: number | null;
        oldest_file?: string | null;
        oldest_modified_at?: string | null;
        expected_archives?: Array<{
          label?: string;
          prefix?: string;
          suffix?: string;
          present?: boolean;
          latest_file?: string | null;
          latest_modified_at?: string | null;
          latest_age_seconds?: number | null;
          size_bytes?: number | null;
        }>;
        recent_files?: Array<{
          name?: string;
          size_bytes?: number;
          modified_at?: string | null;
        }>;
      };
      summary?: {
        headline?: string;
        detail?: string;
      };
      units?: {
        timer?: { name?: string; state?: Record<string, unknown> };
        service?: { name?: string; state?: Record<string, unknown> };
        upload?: { name?: string; state?: Record<string, unknown> } | null;
      };
      errors?: string[];
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
  application_surfaces?: OpsApplicationSurfacesSection;
  livewire_detail?: OpsLivewireDetailSection;
  backups_detail?: OpsBackupsDetailSection;
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
