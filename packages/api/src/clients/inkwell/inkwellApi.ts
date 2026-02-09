// src/lib/inkwellApi.ts

/**
 * Inkwell API - AI editing and summarization
 *
 * HYBRID APPROACH: This file uses both fetch() and axiosInstance:
 * - fetch() for Server-Sent Events (SSE) streaming - axios doesn't support ReadableStream well
 * - axiosInstance for regular non-streaming endpoints (summarize, etc.)
 */

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type EditStyle = "polish" | "tighten" | "expand";
export type EditIntensity = "light" | "medium" | "strong";

export interface EditStartMeta {
  style: EditStyle;
  policy_applied: string | null;
}

export interface EditCompletePayload {
  original: string;
  edited: string;
  edited_raw?: string;
  style: EditStyle | string;
  intensity?: EditIntensity | string;
  policy_applied?: string | null;
  reverted?: boolean;
  debug_info?: {
    stream_error?: string | null;
    edited_clean?: string;
    reverted_by_new_info?: boolean;
    reverted_by_faithfulness?: boolean;
    length_capped?: boolean;
    token_count?: number;
  };
}

export interface StreamEditOptions {
  text: string;
  style: EditStyle;
  intensity?: EditIntensity;
  signal?: AbortSignal;
  onStart?: (meta: EditStartMeta) => void;
  onToken?: (token: string) => void;
  onError?: (message: string, context?: any) => void;
  onComplete?: (payload: EditCompletePayload) => void;
  debug?: boolean; // Enable debug logging
}

/**
 * Enhanced streamEdit with better error handling and debugging
 */
export async function streamEdit(opts: StreamEditOptions): Promise<void> {
  const {
    text,
    style,
    intensity = "medium",
    signal,
    onStart,
    onToken,
    onError,
    onComplete,
    debug = false,
  } = opts;

  if (debug) {
    console.log('[streamEdit] Starting with options:', {
      textLength: text.length,
      style,
      intensity,
      textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
    });
  }

  let res: Response;
  try {
    const requestBody = { style, intensity, text };
    if (debug) console.log('[streamEdit] Request body:', requestBody);

    // Get auth token from axiosInstance defaults
    const authHeader = axiosInstance.defaults.headers.common['Authorization'];
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers['Authorization'] = authHeader as string;
    }

    // Note: Using fetch for streaming SSE as axios doesn't support it well
    res = await fetch(`/api/inkwell/v1/edit`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal,
    });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      if (debug) console.log('[streamEdit] Request aborted');
      return;
    }
    console.error('[streamEdit] Network error:', e);
    onError?.(e?.message || "network error", { type: 'network', error: e });
    return;
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unable to read error');
    const msg = `edit request failed: ${res.status} ${res.statusText}`;
    console.error('[streamEdit] HTTP error:', { status: res.status, statusText: res.statusText, body: errorText });
    onError?.(msg, { type: 'http', status: res.status, body: errorText });
    return;
  }

  if (!res.body) {
    onError?.("No response body", { type: 'no_body' });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buf = "";
  let eventCount = 0;
  let tokenCount = 0;
  let totalTokens = "";

  const SEP = /\r?\n\r?\n/;

  function parseSSEFrame(frame: string) {
    if (!frame || frame.startsWith(":")) return; // ignore keepalive/comments

    eventCount++;
    if (debug) console.log(`[streamEdit] Processing frame ${eventCount}:`, frame);

    let event: string | null = null;
    let dataRaw = "";

    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataRaw += line.slice(5).trim();
    }

    if (!event) {
      if (debug) console.warn('[streamEdit] Frame missing event type:', frame);
      return;
    }

    try {
      const data = dataRaw ? JSON.parse(dataRaw) : undefined;

      if (debug) {
        console.log(`[streamEdit] Event: ${event}`, data);
      }

      if (event === "start") {
        onStart?.(data as EditStartMeta);
      } else if (event === "token") {
        const token = (data as any)?.token ?? "";
        tokenCount++;
        totalTokens += token;
        onToken?.(token);

        if (debug && tokenCount % 10 === 0) {
          console.log(`[streamEdit] Received ${tokenCount} tokens. Current text:`, totalTokens.substring(0, 200));
        }
      } else if (event === "error") {
        const errorMsg = (data as any)?.message ?? "unknown error";
        console.error('[streamEdit] Server error:', errorMsg, data);
        onError?.(errorMsg, { type: 'server', data });
      } else if (event === "complete") {
        if (debug) {
          console.log('[streamEdit] Complete event:', data);
          const payload = data as EditCompletePayload;
          console.log('[streamEdit] Analysis:', {
            originalLength: payload.original?.length || 0,
            editedLength: payload.edited?.length || 0,
            rawLength: payload.edited_raw?.length || 0,
            reverted: payload.reverted,
            policyApplied: payload.policy_applied,
            debugInfo: payload.debug_info,
            totalTokensReceived: totalTokens.length,
          });
        }
        onComplete?.(data as EditCompletePayload);
      } else {
        if (debug) console.warn('[streamEdit] Unknown event type:', event, data);
      }
    } catch (e: any) {
      console.error('[streamEdit] JSON parse error:', e, 'Raw data:', dataRaw);
      onError?.(e?.message || "SSE parse error", { type: 'parse', rawData: dataRaw, error: e });
    }
  }

  function flush(chunk: string) {
    buf += chunk;
    const parts = buf.split(SEP);
    buf = parts.pop() ?? "";
    for (const frame of parts) {
      if (frame.trim()) parseSSEFrame(frame);
    }
  }

  try {
    let chunkCount = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      chunkCount++;
      const decoded = decoder.decode(value, { stream: true });
      if (debug && chunkCount <= 5) {
        console.log(`[streamEdit] Chunk ${chunkCount}:`, decoded.substring(0, 200));
      }

      flush(decoded);
    }

    // Flush any trailing data
    const final = decoder.decode();
    if (final) flush(final);

    if (debug) {
      console.log('[streamEdit] Stream complete:', {
        totalChunks: chunkCount,
        totalEvents: eventCount,
        totalTokens: tokenCount,
        finalBufferLength: buf.length,
      });
    }

  } catch (e: any) {
    if (e?.name === "AbortError") {
      if (debug) console.log('[streamEdit] Stream aborted');
      return;
    }
    console.error('[streamEdit] Stream reading error:', e);
    onError?.(e?.message || "stream error", { type: 'stream', error: e });
  }
}

export async function normalizeTipTapToPlaintext(
  doc: unknown,
  options?: { signal?: AbortSignal }
): Promise<{ plaintext: string; normalized: unknown }> {
  const res = await axiosInstance.post(
    `/api/inkwell/v1/normalize-tiptap`,
    { doc },
    { signal: options?.signal }
  );
  return res.data;
}

// NEW: Dedicated summarize function using the new endpoint
export async function fetchSummary(
  text: string,
  words = 40,
  style: "neutral" | "bullet" | "narrative" | "extractive" = "neutral",
  options?: { signal?: AbortSignal }
): Promise<string> {
  console.log('[fetchSummary] 🚀 Starting request to /v1/summarize');
  console.log('[fetchSummary] 📝 Input text length:', text.length);
  console.log('[fetchSummary] 🔢 Target words:', words);
  console.log('[fetchSummary] 🎨 Style:', style);

  const requestBody = { text, words, style };

  const res = await axiosInstance.post(
    `/api/inkwell/v1/summarize/quick`,
    requestBody,
    { signal: options?.signal }
  );

  console.log('[fetchSummary] 📥 Response status:', res.status);
  console.log('[fetchSummary] 📥 Response data:', res.data);

  const summary = res.data.summary || "";
  console.log('[fetchSummary] ✅ Final summary:', summary);

  return summary;
}

// LEGACY: Keep the old function for backwards compatibility, but use new endpoint
export async function fetchSummaryFromMetadata(
  text: string,
  words = 40
): Promise<string> {
  console.log('[fetchSummaryFromMetadata] 🔄 Redirecting to new summarize endpoint');
  return fetchSummary(text, words, "neutral");
}
