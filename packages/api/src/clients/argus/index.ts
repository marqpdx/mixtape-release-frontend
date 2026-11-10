import type { ArgusClient, ArgusSnapshot } from "./types";

// Deliberately makes no HTTP requests until Blue supplies the core contract.
// Replace this adapter with authenticated axiosInstance calls, not the view.
const reason = "Argus is waiting for its core connection. Runs cannot start yet.";

export const unavailableArgusSnapshot: ArgusSnapshot = {
  available: false,
  unavailable_reason: reason,
  manual_ready: false,
  manual_reason: reason,
  scheduling_ready: false,
  scheduling_reason: "Series will be available after the first manual run and scheduling review.",
  blocks: [],
  runs: [],
  series: [],
  coverage: null,
  daily_tokens: null,
};

const unavailable = async (): Promise<never> => { throw new Error(reason); };

export const argusClient: ArgusClient = {
  snapshot: async () => unavailableArgusSnapshot,
  start: unavailable,
  stop: unavailable,
  approveNext: unavailable,
};
