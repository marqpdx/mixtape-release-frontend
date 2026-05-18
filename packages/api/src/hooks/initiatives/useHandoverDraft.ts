import { useState, useEffect, useCallback } from 'react';
import { fetchHandoverDraft } from '../../clients/initiatives/initiativesApi';
import type { HandoverDraft } from '../../clients/initiatives/initiativesApi';

export function useHandoverDraft(initiativeId: string | null) {
  const [draft, setDraft] = useState<HandoverDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!initiativeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchHandoverDraft(initiativeId);
      setDraft(result);
    } catch {
      setError('Failed to load draft.');
    } finally {
      setIsLoading(false);
    }
  }, [initiativeId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { draft, isLoading, error, refetch: fetch };
}
