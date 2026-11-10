// Frontend view model, pending Blue's core wire contract (ADR-0064).
// Translate core responses at the adapter boundary; these are not API schemas.
export interface ArgusCaps {
  tokens: number;
  turns: number;
  wall_seconds: number;
}

export interface ArgusStartRequest {
  block_ids: string[];
  mode: "single" | "bounded" | "open_ended";
  cadence_minutes?: number;
  ends_at?: string;
  run_count?: number;
  caps: ArgusCaps;
}

export interface ArgusBlock {
  id: string;
  name: string;
  domain: string;
  state: string;
  cadence_minutes: number | null;
  last_run_at: string | null;
  findings: Record<string, number> | null;
  block_url?: string;
  last_run_url?: string;
}

export interface ArgusRun {
  id: string;
  block_id: string;
  status: string;
  started_at: string | null;
  findings: Record<string, number> | null;
  dialogue_url?: string;
}

export interface ArgusSeries {
  id: string;
  block_ids: string[];
  mode: "bounded" | "open_ended";
  status: string;
  started_by: string;
  starts_at: string;
  ends_at: string | null;
  run_count: number | null;
  completed_runs: number;
  fruitful_runs: number | null;
  cadence_minutes: number;
  caps: ArgusCaps;
  next_due_at: string | null;
  awaiting_approval: boolean;
  can_stop: boolean;
  can_approve: boolean;
}

export interface ArgusSnapshot {
  available: boolean;
  unavailable_reason: string | null;
  manual_ready: boolean;
  manual_reason: string | null;
  scheduling_ready: boolean;
  scheduling_reason: string | null;
  blocks: ArgusBlock[];
  runs: ArgusRun[];
  series: ArgusSeries[];
  coverage: { covered: number; uncovered: { name: string; reason: string }[] } | null;
  daily_tokens: { used: number; limit: number } | null;
}

export interface ArgusClient {
  snapshot(signal?: AbortSignal): Promise<ArgusSnapshot>;
  start(request: ArgusStartRequest): Promise<void>;
  stop(seriesId: string): Promise<void>;
  approveNext(seriesId: string): Promise<void>;
}
