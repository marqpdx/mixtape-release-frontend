// packages/api/src/clients/ops/opsApi.ts

import { axiosInstance } from "../../lib/axiosInstance";

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

export interface OpsHealthSnapshotResponse {
  schema_version: string;
  generated_at: string;
  system: Record<string, unknown>;
  processes: Record<string, unknown>;
  disk: Record<string, unknown>;
  network: Record<string, unknown>;
  services: Record<string, unknown>;
  application: Record<string, unknown>;
}

export async function fetchOpsSummary(): Promise<OpsSummaryResponse> {
  const res = await axiosInstance.get("/api/ops/summary");
  return res.data as OpsSummaryResponse;
}

export async function fetchOpsTiles(): Promise<OpsTilesResponse> {
  const res = await axiosInstance.get("/api/ops/tiles");
  return res.data as OpsTilesResponse;
}

export async function fetchOpsSnapshot(): Promise<OpsHealthSnapshotResponse> {
  const res = await axiosInstance.get("/api/ops/health-snapshot");
  return res.data as OpsHealthSnapshotResponse;
}
