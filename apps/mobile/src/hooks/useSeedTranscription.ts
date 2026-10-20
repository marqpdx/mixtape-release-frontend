import { useEffect } from 'react';
import type { Seed } from '@mixtape/api/clients/writing/seedApi';
import { pollWithBackoff } from '../services/polling/pollWithBackoff';
import { socketService } from '../services/socket/socketService';

interface SeedQuery {
  data?: Seed[];
  refetch: () => Promise<{ data?: Seed[] }>;
}

// Notebook and Shuttle share the same server transcription, push notification,
// and polling fallback. The caller supplies the existing recent-Seeds query.
export function useSeedTranscription(query: SeedQuery) {
  const hasProcessingVoiceSeed = (query.data ?? []).some(
    (seed) => seed.kind === 'voice' && seed.status === 'processing',
  );

  useEffect(() => {
    if (!hasProcessingVoiceSeed) return;
    let cancelled = false;
    void pollWithBackoff(async () => {
      const result = await query.refetch();
      const stillProcessing = (result.data ?? []).some(
        (seed) => seed.kind === 'voice' && seed.status === 'processing',
      );
      return { done: !stillProcessing };
    }, { isCancelled: () => cancelled, timeoutMs: Number.POSITIVE_INFINITY });
    return () => { cancelled = true; };
  }, [hasProcessingVoiceSeed, query]);

  useEffect(() => {
    const socket = socketService.getRawSocket();
    if (!socket) return;
    const handler = () => { void query.refetch(); };
    socket.on('seed:transcribed', handler);
    return () => { socket.off('seed:transcribed', handler); };
  }, [query]);
}
