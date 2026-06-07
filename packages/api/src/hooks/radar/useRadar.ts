// packages/api/src/hooks/radar/useRadar.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRadarInitiatives,
  createRadarInitiative,
  fetchRadarInitiative,
  updateRadarInitiative,
  archiveRadarInitiative,
  restoreRadarInitiative,
  reorderRadarInitiatives,
  fetchRadarArtifacts,
  createRadarDocLink,
  importRadarConversation,
  reorderRadarArtifacts,
  updateRadarArtifact,
  deleteRadarArtifact,
  type RadarInitiative,
  type RadarInitiativeArtifact,
  type RadarCreatePayload,
  type RadarUpdatePayload,
  type RadarDocLinkPayload,
  type RadarArtifactUpdatePayload,
} from "../../clients/radar/radarApi";

// ============================================================================
// Query keys
// ============================================================================

export const radarQueryKeys = {
  all: ["radar"] as const,
  list: () => [...radarQueryKeys.all, "list"] as const,
  archived: () => [...radarQueryKeys.all, "archived"] as const,
  detail: (id: string) => [...radarQueryKeys.all, "detail", id] as const,
  artifacts: (id: string) => [...radarQueryKeys.all, "artifacts", id] as const,
};

// ============================================================================
// Initiatives
// ============================================================================

export function useRadarInitiatives() {
  return useQuery<RadarInitiative[]>({
    queryKey: radarQueryKeys.list(),
    queryFn: () => fetchRadarInitiatives(),
    staleTime: 30_000,
  });
}

export function useArchivedRadarInitiatives() {
  return useQuery<RadarInitiative[]>({
    queryKey: radarQueryKeys.archived(),
    queryFn: () => fetchRadarInitiatives("archived"),
    staleTime: 60_000,
  });
}

export function useRadarInitiative(initiativeId: string) {
  return useQuery<RadarInitiative>({
    queryKey: radarQueryKeys.detail(initiativeId),
    queryFn: () => fetchRadarInitiative(initiativeId),
    staleTime: 30_000,
    enabled: Boolean(initiativeId),
  });
}

export function useCreateRadarInitiative() {
  const queryClient = useQueryClient();
  return useMutation<RadarInitiative, Error, RadarCreatePayload>({
    mutationFn: createRadarInitiative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarQueryKeys.list() });
    },
  });
}

export function useUpdateRadarInitiative(initiativeId: string) {
  const queryClient = useQueryClient();
  return useMutation<RadarInitiative, Error, RadarUpdatePayload>({
    mutationFn: (payload) => updateRadarInitiative(initiativeId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(radarQueryKeys.detail(initiativeId), updated);
      queryClient.invalidateQueries({ queryKey: radarQueryKeys.list() });
    },
  });
}

export function useArchiveRadarInitiative() {
  const queryClient = useQueryClient();
  return useMutation<RadarInitiative, Error, string>({
    mutationFn: archiveRadarInitiative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarQueryKeys.list() });
    },
  });
}

export function useRestoreRadarInitiative() {
  const queryClient = useQueryClient();
  return useMutation<RadarInitiative, Error, string>({
    mutationFn: restoreRadarInitiative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarQueryKeys.archived() });
      queryClient.invalidateQueries({ queryKey: radarQueryKeys.list() });
    },
  });
}

export function useReorderRadarInitiatives() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string[]>({
    mutationFn: reorderRadarInitiatives,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarQueryKeys.list() });
    },
  });
}

// ============================================================================
// Artifacts
// ============================================================================

export function useRadarArtifacts(initiativeId: string) {
  return useQuery<RadarInitiativeArtifact[]>({
    queryKey: radarQueryKeys.artifacts(initiativeId),
    queryFn: () => fetchRadarArtifacts(initiativeId),
    staleTime: 30_000,
    enabled: Boolean(initiativeId),
  });
}

export function useCreateRadarDocLink(initiativeId: string) {
  const queryClient = useQueryClient();
  return useMutation<RadarInitiativeArtifact, Error, RadarDocLinkPayload>({
    mutationFn: (payload) => createRadarDocLink(initiativeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarQueryKeys.artifacts(initiativeId) });
    },
  });
}

export function useImportRadarConversation(initiativeId: string) {
  const queryClient = useQueryClient();
  return useMutation<RadarInitiativeArtifact, Error, File>({
    mutationFn: (file) => importRadarConversation(initiativeId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarQueryKeys.artifacts(initiativeId) });
    },
  });
}

export function useReorderRadarArtifacts(initiativeId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string[]>({
    mutationFn: (orderedIds) => reorderRadarArtifacts(initiativeId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarQueryKeys.artifacts(initiativeId) });
    },
  });
}

export function useUpdateRadarArtifact(initiativeId: string, artifactId: string) {
  const queryClient = useQueryClient();
  return useMutation<RadarInitiativeArtifact, Error, RadarArtifactUpdatePayload>({
    mutationFn: (payload) => updateRadarArtifact(initiativeId, artifactId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarQueryKeys.artifacts(initiativeId) });
    },
  });
}

export function useDeleteRadarArtifact(initiativeId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (artifactId) => deleteRadarArtifact(initiativeId, artifactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radarQueryKeys.artifacts(initiativeId) });
    },
  });
}
