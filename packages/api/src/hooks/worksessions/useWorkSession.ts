// hooks/worksessions/useWorkSession.ts
//
// React Query hooks for Work Session API.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../../clients/worksessions/workSessionApi";
import type {
  WorkSession,
  WorkSessionCreatePayload,
  WorkSessionItemCreatePayload,
  SurfaceDocumentSavePayload,
} from "../../clients/worksessions/workSessionApi";

// ── Query Keys ──

export const workSessionKeys = {
  all: ["workSessions"] as const,
  lists: () => [...workSessionKeys.all, "list"] as const,
  detail: (id: string) => [...workSessionKeys.all, "detail", id] as const,
  items: (id: string) => [...workSessionKeys.all, "items", id] as const,
  surface: (id: string) => [...workSessionKeys.all, "surface", id] as const,
};

// ── Query Hooks ──

export function useWorkSessions() {
  return useQuery({
    queryKey: workSessionKeys.lists(),
    queryFn: api.fetchWorkSessions,
    staleTime: 2 * 60 * 1000,
  });
}

export function useWorkSession(id: string | null) {
  return useQuery({
    queryKey: workSessionKeys.detail(id ?? ""),
    queryFn: () => api.fetchWorkSession(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useSurfaceDocument(sessionId: string | null) {
  return useQuery({
    queryKey: workSessionKeys.surface(sessionId ?? ""),
    queryFn: () => api.fetchSurfaceDocument(sessionId!),
    enabled: !!sessionId,
    staleTime: 10 * 1000,
  });
}

// ── Mutation Hooks ──

export function useCreateWorkSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WorkSessionCreatePayload) =>
      api.createWorkSession(payload),
    onSuccess: (session: WorkSession) => {
      queryClient.invalidateQueries({ queryKey: workSessionKeys.lists() });
      queryClient.setQueryData(workSessionKeys.detail(session.id), session);
    },
  });
}

export function useEndWorkSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.endWorkSession(id),
    onSuccess: (session: WorkSession) => {
      queryClient.setQueryData(workSessionKeys.detail(session.id), session);
      queryClient.invalidateQueries({ queryKey: workSessionKeys.lists() });
    },
  });
}

export function useDeleteWorkSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteWorkSession(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: workSessionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: workSessionKeys.lists() });
    },
  });
}

export function useAddSessionItem(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WorkSessionItemCreatePayload) =>
      api.addSessionItem(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workSessionKeys.items(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: workSessionKeys.detail(sessionId),
      });
    },
  });
}

export function useRemoveSessionItem(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.removeSessionItem(sessionId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workSessionKeys.items(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: workSessionKeys.detail(sessionId),
      });
    },
  });
}

export function useSaveSurfaceDocument(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SurfaceDocumentSavePayload) =>
      api.saveSurfaceDocument(sessionId, payload),
    onSuccess: (doc) => {
      queryClient.setQueryData(workSessionKeys.surface(sessionId), doc);
    },
  });
}

export function useCheckpoint(sessionId: string) {
  return useMutation({
    mutationFn: () => api.triggerCheckpoint(sessionId),
  });
}
