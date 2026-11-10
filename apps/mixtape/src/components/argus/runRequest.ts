import type { ArgusStartRequest } from "@mixtape/api/clients/argus/types";

export interface RunDraft {
  blockIds: string[];
  mode: ArgusStartRequest["mode"];
  cadenceMinutes: string;
  bound: "count" | "end" | "days";
  days: string;
  count: string;
  end: string;
  tokens: string;
  turns: string;
  wallSeconds: string;
}

export const initialRunDraft: RunDraft = {
  blockIds: [], mode: "single", cadenceMinutes: "120", bound: "days", days: "3",
  count: "3", end: "", tokens: "", turns: "", wallSeconds: "",
};

const positiveInteger = (value: string) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;

/** Usability checks only. Core/runner must independently enforce every limit. */
export function buildRunRequest(draft: RunDraft, now = Date.now()): ArgusStartRequest {
  if (!draft.blockIds.length) throw new Error("Choose at least one block.");
  if (draft.mode === "single" && draft.blockIds.length !== 1) throw new Error("Choose one block for a single run.");
  for (const [label, value] of [["Token cap", draft.tokens], ["Turn cap", draft.turns], ["Wall-clock cap", draft.wallSeconds]]) {
    if (!positiveInteger(value)) throw new Error(`${label} must be a positive whole number.`);
  }
  const request: ArgusStartRequest = {
    block_ids: [...new Set(draft.blockIds)], mode: draft.mode,
    caps: { tokens: Number(draft.tokens), turns: Number(draft.turns), wall_seconds: Number(draft.wallSeconds) },
  };
  if (draft.mode === "single") return request;
  if (!positiveInteger(draft.cadenceMinutes)) throw new Error("Cadence must be a positive whole number of minutes.");
  request.cadence_minutes = Number(draft.cadenceMinutes);
  if (draft.mode === "open_ended") return request;
  const sevenDays = 7 * 24 * 60;
  if (draft.bound === "count") {
    if (!positiveInteger(draft.count)) throw new Error("Run count must be a positive whole number.");
    if ((Number(draft.count) - 1) * request.cadence_minutes >= sevenDays) {
      throw new Error("Choose fewer runs or a shorter cadence so the series finishes within seven days.");
    }
    request.run_count = Number(draft.count);
  } else if (draft.bound === "days") {
    if (!positiveInteger(draft.days) || Number(draft.days) > 7) throw new Error("Choose between one and seven days.");
    request.ends_at = new Date(now + Number(draft.days) * 86_400_000).toISOString();
  } else {
    const end = new Date(draft.end).getTime();
    if (!Number.isFinite(end) || end <= now) throw new Error("Choose an end time in the future.");
    if (end - now > sevenDays * 60_000) throw new Error("A bounded series can last at most seven days.");
    request.ends_at = new Date(end).toISOString();
  }
  return request;
}

export function localArgusUrl(url?: string): string | undefined {
  // Results must not inject external/active links into the builder surface.
  return url?.startsWith("/") && !url.startsWith("//") && !/[\\\s]/.test(url) ? url : undefined;
}
