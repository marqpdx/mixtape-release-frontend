// packages/api/src/hooks/initiatives/useSessionExchange.ts
//
// Handles the SSE streaming exchange with the AI session endpoint.
// Manages the input field, streaming state, and transcript display.

import { useState, useCallback, useRef } from 'react';
import { getAccessToken } from '@mixtape/auth/tokenStorage';

const getApiBaseUrl = () =>
  (typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_ROOT_API_URL
    : process.env.NEXT_PUBLIC_ROOT_API_URL) || 'http://127.0.0.1:8010';

export interface StreamingTurn {
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

interface UseSessionExchangeReturn {
  localTurns: StreamingTurn[];
  message: string;
  setMessage: (v: string) => void;
  isStreaming: boolean;
  error: string | null;
  sendMessage: () => Promise<void>;
  clearError: () => void;
}

export function useSessionExchange(
  groupSlug: string,
  initiativeId: string,
  sessionId: string
): UseSessionExchangeReturn {
  const [localTurns, setLocalTurns] = useState<StreamingTurn[]>([]);
  const [message, setMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || isStreaming) return;

    setMessage('');
    setError(null);
    setIsStreaming(true);

    // Optimistically add user turn
    setLocalTurns(prev => [...prev, { role: 'user', text: trimmed }]);

    // Add placeholder assistant turn
    setLocalTurns(prev => [...prev, { role: 'assistant', text: '', streaming: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = getAccessToken();
      const url = `${getApiBaseUrl()}/api/groups/${groupSlug}/initiatives/${initiativeId}/sessions/${sessionId}/exchange`;

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
        throw new Error(errData.detail || `HTTP ${resp.status}`);
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
            const payload = JSON.parse(raw);
            if (payload.type === 'delta') {
              setLocalTurns(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, text: last.text + payload.text };
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
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Exchange failed';
      setError(msg);
      // Remove the incomplete assistant turn
      setLocalTurns(prev => prev.filter(t => !(t.role === 'assistant' && t.streaming)));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [groupSlug, initiativeId, sessionId, message, isStreaming]);

  const clearError = useCallback(() => setError(null), []);

  return { localTurns, message, setMessage, isStreaming, error, sendMessage, clearError };
}
