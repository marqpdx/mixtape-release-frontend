// packages/api/src/hooks/initiatives/useInitiative.ts

import { useState, useCallback, useEffect } from 'react';
import * as initiativesApi from '../../clients/initiatives/initiativesApi';
import type {
  InitiativeResponse,
  SessionResponse,
  SessionCreatePayload,
  ArtifactResponse,
  ArtifactCreatePayload,
} from '../../clients/initiatives/initiativesApi';

interface UseInitiativeReturn {
  initiative: InitiativeResponse | null;
  sessions: SessionResponse[];
  artifacts: ArtifactResponse[];
  isLoading: boolean;
  error: string | null;

  reload: () => Promise<void>;

  // Sessions
  createSession: (payload: SessionCreatePayload) => Promise<SessionResponse>;
  closeSession: (sessionId: string) => Promise<SessionResponse>;
  proposeDistillation: (sessionId: string) => Promise<SessionResponse>;
  commitDistillation: (
    sessionId: string,
    payload: { decisions?: string; open_questions?: string; actions?: string; notes?: string }
  ) => Promise<SessionResponse>;

  // Artifacts
  createArtifact: (payload: ArtifactCreatePayload) => Promise<ArtifactResponse>;
  updateArtifact: (artifactId: string, payload: Partial<ArtifactCreatePayload>) => Promise<ArtifactResponse>;
  routeArtifactToPuddlejump: (artifactId: string) => Promise<{
    artifact: ArtifactResponse;
    document: string;
    message: string;
  }>;

  clearError: () => void;
}

export function useInitiative(groupSlug: string, initiativeId: string): UseInitiativeReturn {
  const [initiative, setInitiative] = useState<InitiativeResponse | null>(null);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ini, sesh, arts] = await Promise.all([
        initiativesApi.fetchInitiative(groupSlug, initiativeId),
        initiativesApi.fetchSessions(groupSlug, initiativeId),
        initiativesApi.fetchArtifacts(groupSlug, initiativeId),
      ]);
      setInitiative(ini);
      setSessions(sesh);
      setArtifacts(arts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load initiative');
    } finally {
      setIsLoading(false);
    }
  }, [groupSlug, initiativeId]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      initiativesApi.fetchInitiative(groupSlug, initiativeId),
      initiativesApi.fetchSessions(groupSlug, initiativeId),
      initiativesApi.fetchArtifacts(groupSlug, initiativeId),
    ])
      .then(([ini, sesh, arts]) => {
        if (!cancelled) {
          setInitiative(ini);
          setSessions(sesh);
          setArtifacts(arts);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load initiative');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [groupSlug, initiativeId]);

  // Sessions

  const createSession = useCallback(async (payload: SessionCreatePayload): Promise<SessionResponse> => {
    setError(null);
    try {
      const created = await initiativesApi.createSession(groupSlug, initiativeId, payload);
      setSessions(prev => [created, ...prev]);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create session';
      setError(msg);
      throw err;
    }
  }, [groupSlug, initiativeId]);

  const closeSession = useCallback(async (sessionId: string): Promise<SessionResponse> => {
    setError(null);
    try {
      const updated = await initiativesApi.closeSession(groupSlug, initiativeId, sessionId);
      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to close session';
      setError(msg);
      throw err;
    }
  }, [groupSlug, initiativeId]);

  const proposeDistillation = useCallback(async (sessionId: string): Promise<SessionResponse> => {
    setError(null);
    try {
      const updated = await initiativesApi.proposeDistillation(groupSlug, initiativeId, sessionId);
      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to propose distillation';
      setError(msg);
      throw err;
    }
  }, [groupSlug, initiativeId]);

  const commitDistillation = useCallback(async (
    sessionId: string,
    payload: { decisions?: string; open_questions?: string; actions?: string; notes?: string }
  ): Promise<SessionResponse> => {
    setError(null);
    try {
      const updated = await initiativesApi.commitDistillation(groupSlug, initiativeId, sessionId, payload);
      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to commit distillation';
      setError(msg);
      throw err;
    }
  }, [groupSlug, initiativeId]);

  // Artifacts

  const createArtifact = useCallback(async (payload: ArtifactCreatePayload): Promise<ArtifactResponse> => {
    setError(null);
    try {
      const created = await initiativesApi.createArtifact(groupSlug, initiativeId, payload);
      setArtifacts(prev => [created, ...prev]);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create artifact';
      setError(msg);
      throw err;
    }
  }, [groupSlug, initiativeId]);

  const updateArtifact = useCallback(async (artifactId: string, payload: Partial<ArtifactCreatePayload>): Promise<ArtifactResponse> => {
    setError(null);
    try {
      const updated = await initiativesApi.updateArtifact(groupSlug, initiativeId, artifactId, payload);
      setArtifacts(prev => prev.map(a => a.id === artifactId ? updated : a));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update artifact';
      setError(msg);
      throw err;
    }
  }, [groupSlug, initiativeId]);

  const routeArtifactToPuddlejump = useCallback(async (artifactId: string) => {
    setError(null);
    try {
      const result = await initiativesApi.routeArtifactToPuddlejump(groupSlug, initiativeId, artifactId);
      setArtifacts(prev => prev.map(a => a.id === artifactId ? result.artifact : a));
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to route artifact';
      setError(msg);
      throw err;
    }
  }, [groupSlug, initiativeId]);

  const clearError = useCallback(() => setError(null), []);

  return {
    initiative,
    sessions,
    artifacts,
    isLoading,
    error,
    reload,
    createSession,
    closeSession,
    proposeDistillation,
    commitDistillation,
    createArtifact,
    updateArtifact,
    routeArtifactToPuddlejump,
    clearError,
  };
}
