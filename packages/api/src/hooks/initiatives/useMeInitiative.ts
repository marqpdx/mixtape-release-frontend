// packages/api/src/hooks/initiatives/useMeInitiative.ts
// React Query hooks for the personal initiative (/api/initiatives/me/*).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMeNote,
  createMeSession,
  fetchMeSessionArtifacts,
  fetchMeSessions,
  fetchPersonalInitiative,
  patchMeSession,
  type NoteCreatePayload,
  type SessionCreatePayload,
} from '../../clients/initiatives/initiativesApi';

export function usePersonalInitiative() {
  return useQuery({
    queryKey: ['initiative-me'],
    queryFn: fetchPersonalInitiative,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMeSessions() {
  return useQuery({
    queryKey: ['initiative-me-sessions'],
    queryFn: fetchMeSessions,
    staleTime: 30 * 1000,
  });
}

export function useCreateMeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SessionCreatePayload = {}) => createMeSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative-me-sessions'] });
    },
  });
}

export function useCloseMeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => patchMeSession(sessionId, { end: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative-me-sessions'] });
    },
  });
}

export function useCreateMeNote() {
  return useMutation({
    mutationFn: (payload: NoteCreatePayload) => createMeNote(payload),
  });
}

export function useMeSessionArtifacts(sessionId: string | null) {
  return useQuery({
    queryKey: ['initiative-me-session-artifacts', sessionId],
    queryFn: () => fetchMeSessionArtifacts(sessionId!),
    enabled: !!sessionId,
    staleTime: 30 * 1000,
  });
}
