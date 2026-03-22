// packages/api/src/hooks/initiatives/useGroupInitiatives.ts

import { useState, useCallback, useEffect } from 'react';
import * as initiativesApi from '../../clients/initiatives/initiativesApi';
import type { InitiativeResponse, InitiativeCreatePayload, RollingSummary } from '../../clients/initiatives/initiativesApi';

interface UseGroupInitiativesReturn {
  initiatives: InitiativeResponse[];
  isLoading: boolean;
  error: string | null;

  loadInitiatives: () => Promise<void>;
  createInitiative: (payload: InitiativeCreatePayload) => Promise<InitiativeResponse>;
  updateInitiative: (id: string, payload: Partial<InitiativeCreatePayload>) => Promise<InitiativeResponse>;
  deleteInitiative: (id: string) => Promise<void>;
  updateRollingSummary: (id: string, payload: Partial<RollingSummary>) => Promise<InitiativeResponse>;

  clearError: () => void;
}

export function useGroupInitiatives(groupSlug: string): UseGroupInitiativesReturn {
  const [initiatives, setInitiatives] = useState<InitiativeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await initiativesApi.fetchGroupInitiatives(groupSlug);
        if (!cancelled) setInitiatives(data);
      } catch (err: any) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load initiatives');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [groupSlug]);

  const loadInitiatives = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await initiativesApi.fetchGroupInitiatives(groupSlug);
      setInitiatives(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load initiatives');
    } finally {
      setIsLoading(false);
    }
  }, [groupSlug]);

  const createInitiative = useCallback(async (payload: InitiativeCreatePayload): Promise<InitiativeResponse> => {
    setError(null);
    try {
      const created = await initiativesApi.createInitiative(groupSlug, payload);
      setInitiatives(prev => [created, ...prev]);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create initiative';
      setError(msg);
      throw err;
    }
  }, [groupSlug]);

  const updateInitiative = useCallback(async (id: string, payload: Partial<InitiativeCreatePayload>): Promise<InitiativeResponse> => {
    setError(null);
    try {
      const updated = await initiativesApi.updateInitiative(groupSlug, id, payload);
      setInitiatives(prev => prev.map(i => i.id === id ? updated : i));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update initiative';
      setError(msg);
      throw err;
    }
  }, [groupSlug]);

  const deleteInitiative = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await initiativesApi.deleteInitiative(groupSlug, id);
      setInitiatives(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete initiative';
      setError(msg);
      throw err;
    }
  }, [groupSlug]);

  const updateRollingSummary = useCallback(async (id: string, payload: Partial<RollingSummary>): Promise<InitiativeResponse> => {
    setError(null);
    try {
      const updated = await initiativesApi.updateRollingSummary(groupSlug, id, payload);
      setInitiatives(prev => prev.map(i => i.id === id ? updated : i));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update rolling summary';
      setError(msg);
      throw err;
    }
  }, [groupSlug]);

  const clearError = useCallback(() => setError(null), []);

  return {
    initiatives,
    isLoading,
    error,
    loadInitiatives,
    createInitiative,
    updateInitiative,
    deleteInitiative,
    updateRollingSummary,
    clearError,
  };
}
