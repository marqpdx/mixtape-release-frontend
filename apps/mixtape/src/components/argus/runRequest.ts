import type { ArgusSeriesCreate } from "@mixtape/api/clients/argus/types";

export type ArgusSubmission = { mode: "single"; block_slug: string } | { mode: "bounded"; request: ArgusSeriesCreate };
export interface RunDraft {
  blockIds: string[];
  mode: "single" | "bounded" | "open_ended";
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
export function buildRunRequest(draft: RunDraft): ArgusSubmission {
  if (draft.blockIds.length !== 1) throw new Error("Choose one block. Multi-block series are not available yet.");
  if (draft.mode === "open_ended") throw new Error("Open-ended series are not available yet. Each run still needs fresh approval.");
  if (draft.mode === "single") return { mode: "single", block_slug: draft.blockIds[0] };
  for (const [label, value] of [["Token cap", draft.tokens], ["Turn cap", draft.turns], ["Wall-clock cap", draft.wallSeconds]]) {
    if (!positiveInteger(value)) throw new Error(`${label} must be a positive whole number.`);
  }
  if (!positiveInteger(draft.cadenceMinutes)) throw new Error("Cadence must be a positive whole number of minutes.");
  if (Number(draft.cadenceMinutes) % 60 !== 0) throw new Error("Cadence must be a whole number of hours.");
  const request: ArgusSeriesCreate = {
    block_slug: draft.blockIds[0], cadence_hours: Number(draft.cadenceMinutes) / 60,
    span: { kind: "days", value: Number(draft.days) },
    per_turn_caps: { max_tokens: Number(draft.tokens), max_turns: Number(draft.turns), max_wall_clock_seconds: Number(draft.wallSeconds) },
  };
  if (draft.bound === "count") {
    if (!positiveInteger(draft.count)) throw new Error("Run count must be a positive whole number.");
    if (Number(draft.count) * Number(draft.cadenceMinutes) > 7 * 24 * 60) {
      throw new Error("Choose fewer runs or a shorter cadence so the series finishes within seven days.");
    }
    request.span = { kind: "runs", value: Number(draft.count) };
  } else if (draft.bound === "days") {
    if (!positiveInteger(draft.days) || Number(draft.days) > 7) throw new Error("Choose between one and seven days.");
  } else {
    throw new Error("An exact end time is not available yet. Choose days or a number of runs.");
  }
  return { mode: "bounded", request };
}
export function localArgusUrl(url?: string): string | undefined {
  return url?.startsWith("/") && !url.startsWith("//") && !/[\\\s]/.test(url) ? url : undefined;
}
