// Shared backoff poller for the transcription-style "keep checking until
// ready" pattern used by voice-Seed processing, intro-voice transcription,
// and initiatives voice-command transcription.
export const TRANSCRIPTION_POLL_SCHEDULE_MS = [3000, 6000, 10000, 16000, 24000];

export interface PollCheckResult<T> {
  done: boolean;
  value?: T;
}

export interface PollWithBackoffOptions {
  schedule?: number[];
  timeoutMs?: number;
  isCancelled?: () => boolean;
}

export async function pollWithBackoff<T>(
  check: () => Promise<PollCheckResult<T>>,
  options: PollWithBackoffOptions = {}
): Promise<T | undefined> {
  const schedule = options.schedule ?? TRANSCRIPTION_POLL_SCHEDULE_MS;
  const timeoutMs = options.timeoutMs ?? 60000;
  const startedAt = Date.now();

  for (let attempt = 0; ; attempt += 1) {
    if (options.isCancelled?.()) return undefined;

    const result = await check();
    if (result.done) return result.value;
    if (Date.now() - startedAt >= timeoutMs) return undefined;

    const delay = schedule[Math.min(attempt, schedule.length - 1)];
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }
}
