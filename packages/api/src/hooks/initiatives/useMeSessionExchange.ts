// packages/api/src/hooks/initiatives/useMeSessionExchange.ts
//
// SSE streaming exchange hook for /api/initiatives/me/sessions/<id>/exchange.
// Mirrors the shape of useSessionExchange but uses the me-scoped endpoint.

import { useCallback, useRef, useState } from 'react';
import { getAccessToken } from '@mixtape/auth/tokenStorage';

const getApiBaseUrl = () =>
  (typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_ROOT_API_URL
    : process.env.NEXT_PUBLIC_ROOT_API_URL) || 'http://127.0.0.1:8010';

export interface MeStreamingTurn {
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

interface UseMeSessionExchangeReturn {
  localTurns: MeStreamingTurn[];
  isStreaming: boolean;
  error: string | null;
  sendText: (text: string) => Promise<void>;
  clearError: () => void;
}

export function useMeSessionExchange(sessionId: string): UseMeSessionExchangeReturn {
  const [localTurns, setLocalTurns] = useState<MeStreamingTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    setIsStreaming(true);

    setLocalTurns(prev => [...prev, { role: 'user', text: trimmed }]);
    setLocalTurns(prev => [...prev, { role: 'assistant', text: '', streaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = getAccessToken();
      const url = `${getApiBaseUrl()}/api/initiatives/me/sessions/${sessionId}/exchange`;

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
        credentials: 'include',
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error((errData as { detail?: string }).detail || `HTTP ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const payload = JSON.parse(raw) as { type: string; text?: string; detail?: string };
            if (payload.type === 'delta') {
              setLocalTurns(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, text: last.text + (payload.text ?? '') };
                }
                return next;
              });
            } else if (payload.type === 'done') {
              setLocalTurns(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, streaming: false };
                }
                return next;
              });
            } else if (payload.type === 'error') {
              setError(payload.detail || 'Stream error');
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Exchange failed';
      setError(msg);
      setLocalTurns(prev => prev.filter(t => !(t.role === 'assistant' && t.streaming)));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [sessionId, isStreaming]);

  const clearError = useCallback(() => setError(null), []);

  return { localTurns, isStreaming, error, sendText, clearError };
}
