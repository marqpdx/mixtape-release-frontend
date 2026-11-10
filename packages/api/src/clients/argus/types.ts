// Provisional wire contract: Puddlejump zz/api-sketch-argus-surface.md.
export interface ArgusPerTurnCaps {
  max_tokens: number;
  max_turns: number;
  max_wall_clock_seconds: number;
}
export interface ArgusSpan { kind: "days" | "runs"; value: number }
export interface ArgusSeriesCreate {
  block_slug: string;
  cadence_hours: number;
  span: ArgusSpan;
  per_turn_caps: ArgusPerTurnCaps;
}
export interface ArgusBlockRecord {
  slug: string;
  domain: string;
  block_state: "scoped" | "ready" | "closed" | "retired";
  last_run_at: string | null;
  findings_by_type: Record<string, number> | null;
  active_series_id: string | null;
}
export interface ArgusBlockList {
  available: boolean;
  reason?: string;
  blocks: ArgusBlockRecord[];
}
// Contour argus.findings 0.1.0, returned directly by core's run serializer.
export interface ArgusFinding {
  finding_id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  confidence: "high" | "medium" | "low";
  title: string;
  location: { ref: string; revision?: string; line?: number; section?: string }[];
  issue: string;
  recommendation: string;
}
export interface ArgusBlockDetail {
  slug: string;
  domain: string;
  block_state: ArgusBlockRecord["block_state"];
  runs: { run_id: string; started_at: string | null; status: string; findings: ArgusFinding[] }[];
}
export interface ArgusSeriesRecord extends Omit<ArgusSeriesCreate, "per_turn_caps"> {
  per_turn_caps: Partial<ArgusPerTurnCaps>;
  series_id: string;
  status: "active" | "stopped" | "completed";
  started_by: string | null;
  runs_done: number;
  runs_total: number | null;
  day_of_span: number | null;
  findings_count?: number;
}
export type ArgusRunResult = { status: "not_reachable"; detail: string } | { status: "started"; run_id: string };
export interface ArgusStopResult { series_id: string; status: "stopped" }
export interface ArgusApi {
  listBlocks(signal?: AbortSignal): Promise<ArgusBlockList>;
  getBlock(slug: string, signal?: AbortSignal): Promise<ArgusBlockDetail>;
  startRun(slug: string): Promise<ArgusRunResult>;
  createSeries(request: ArgusSeriesCreate): Promise<ArgusSeriesRecord>;
  getSeries(id: string, signal?: AbortSignal): Promise<ArgusSeriesRecord>;
  stopSeries(id: string): Promise<ArgusStopResult>;
}
