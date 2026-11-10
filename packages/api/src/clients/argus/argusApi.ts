import type { AxiosRequestConfig } from "axios";
import { axiosInstance } from "../../lib/axiosInstance";
import type { ArgusApi, ArgusBlockDetail, ArgusBlockList, ArgusRunResult, ArgusSeriesRecord, ArgusStopResult } from "./types";

const base = "/api/argus";
const segment = (value: string) => {
  if (!value || value === "." || value === "..") throw new Error("An Argus block or series identifier is required.");
  return encodeURIComponent(value);
};
// The shared interceptor replays requests after a 401. Without an agreed
// idempotency key, starting/creating/stopping must not be replayed implicitly.
const mutationConfig: AxiosRequestConfig & { _retry: boolean } = { _retry: true };

function readSeries(value: ArgusSeriesRecord, expectedId?: string) {
  if (!value?.series_id || (expectedId && value.series_id !== expectedId)
    || !["active", "stopped", "completed"].includes(value.status)
    || !["days", "runs"].includes(value.span?.kind) || !value.per_turn_caps) {
    throw new Error("Argus returned an unrecognized series record. Refresh status before trying again.");
  }
  return value;
}

export const argusApi: ArgusApi = {
  async listBlocks(signal) {
    const response = await axiosInstance.get<ArgusBlockList>(`${base}/blocks/`, { signal });
    if (typeof response.data?.available !== "boolean" || !Array.isArray(response.data.blocks)) throw new Error("Argus did not return a block registry.");
    return response.data;
  },
  async getBlock(slug, signal) {
    const response = await axiosInstance.get<ArgusBlockDetail>(`${base}/blocks/${segment(slug)}/`, { signal });
    if (response.data?.slug !== slug || !Array.isArray(response.data.runs)) throw new Error("Argus did not return this block's run history.");
    return response.data;
  },
  async startRun(slug) {
    // No request-body fields are specified for Run now in the reviewed sketch.
    const response = await axiosInstance.post<ArgusRunResult>(`${base}/blocks/${segment(slug)}/run/`, undefined, mutationConfig);
    const result = response.data;
    if (result?.status === "not_reachable" && typeof result.detail === "string") return result;
    if (result?.status === "started" && typeof result.run_id === "string" && result.run_id) return result;
    throw new Error("Argus returned an unrecognized run state. Refresh status before trying again.");
  },
  async createSeries(request) {
    const response = await axiosInstance.post<ArgusSeriesRecord>(`${base}/series/`, request, mutationConfig);
    return readSeries(response.data);
  },
  async getSeries(id, signal) {
    const response = await axiosInstance.get<ArgusSeriesRecord>(`${base}/series/${segment(id)}/`, { signal });
    return readSeries(response.data, id);
  },
  async stopSeries(id) {
    const response = await axiosInstance.post<ArgusStopResult>(`${base}/series/${segment(id)}/stop/`, undefined, mutationConfig);
    if (response.data?.status !== "stopped" || response.data.series_id !== id) {
      throw new Error("Stop was not confirmed. Refresh the series status before trying again.");
    }
    return response.data;
  },
};
