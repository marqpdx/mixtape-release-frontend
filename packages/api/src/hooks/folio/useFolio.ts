// packages/api/src/hooks/folio/useFolio.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createFolioInception,
  fetchFolioInception,
  analyzeFolioInception,
  updateFolioTitle,
  updateFolioCandidateDisplayText,
  confirmFolioCandidate,
  rejectFolioCandidate,
  fetchFolios,
  createFolio,
  fetchFolioNotes,
  createFolioTextNote,
  createFolioVoiceNote,
  updateFolioNoteShape,
  searchFolioNotes,
  fetchFolioNoteFacets,
  fetchRelatedFolioNotes,
  fetchWriterEntities,
  confirmFolioNoteMention,
  unlinkFolioNoteMention,
  moveFolioNote,
  type FolioNoteSearchParams,
  type FolioNoteSearchResult,
  type FolioNoteFacets,
  type FolioNoteHit,
  type WriterEntity,
  type FolioNote,
  type FolioNoteShape,
  type FolioInception,
  type FolioInceptionCreatePayload,
  type FolioAnalyzeResult,
  type Folio,
  type FolioMaterialCandidate,
} from "../../clients/folio/folioApi";

export const folioQueryKeys = {
  all: ["folio"] as const,
  inception: (id: string) => [...folioQueryKeys.all, "inception", id] as const,
  folios: () => [...folioQueryKeys.all, "folios"] as const,
  notes: (folioId: string) => [...folioQueryKeys.all, "notes", folioId] as const,
  // Workbench queries nest under notes(folioId), so invalidating a Folio's
  // notes also refreshes its search results, facets and related notes.
  search: (folioId: string, params: FolioNoteSearchParams) =>
    [...folioQueryKeys.notes(folioId), "search", params] as const,
  facets: (folioId: string) => [...folioQueryKeys.notes(folioId), "facets"] as const,
  related: (folioId: string, noteId: string) => [...folioQueryKeys.notes(folioId), "related", noteId] as const,
  entities: () => [...folioQueryKeys.all, "entities"] as const,
};

export function useCreateFolioInception() {
  return useMutation<FolioInception, Error, FolioInceptionCreatePayload>({
    mutationFn: createFolioInception,
  });
}

export function useFolioInception(inceptionId: string) {
  return useQuery<FolioInception>({
    queryKey: folioQueryKeys.inception(inceptionId),
    queryFn: () => fetchFolioInception(inceptionId),
    staleTime: 30_000,
    enabled: Boolean(inceptionId),
  });
}

export function useAnalyzeFolioInception(inceptionId: string) {
  const queryClient = useQueryClient();
  return useMutation<FolioAnalyzeResult, Error, { debug: boolean }>({
    mutationFn: ({ debug }) => analyzeFolioInception(inceptionId, debug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.inception(inceptionId) });
    },
  });
}

export function useUpdateFolioTitle(inceptionId: string) {
  const queryClient = useQueryClient();
  return useMutation<Folio, Error, { folioId: string; title: string }>({
    mutationFn: ({ folioId, title }) => updateFolioTitle(folioId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.inception(inceptionId) });
    },
  });
}

export function useUpdateFolioCandidateDisplayText(inceptionId: string) {
  const queryClient = useQueryClient();
  return useMutation<FolioMaterialCandidate, Error, { candidateId: string; displayText: string }>({
    mutationFn: ({ candidateId, displayText }) => updateFolioCandidateDisplayText(candidateId, displayText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.inception(inceptionId) });
    },
  });
}

export function useConfirmFolioCandidate(inceptionId: string) {
  const queryClient = useQueryClient();
  return useMutation<FolioMaterialCandidate, Error, string>({
    mutationFn: (candidateId) => confirmFolioCandidate(candidateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.inception(inceptionId) });
    },
  });
}

export function useRejectFolioCandidate(inceptionId: string) {
  const queryClient = useQueryClient();
  return useMutation<FolioMaterialCandidate, Error, string>({
    mutationFn: (candidateId) => rejectFolioCandidate(candidateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.inception(inceptionId) });
    },
  });
}

// ============================================================================
// Folio Notes PoC
// ============================================================================

export function useFolios() {
  return useQuery<Folio[]>({
    queryKey: folioQueryKeys.folios(),
    queryFn: fetchFolios,
    staleTime: 30_000,
  });
}

export function useCreateFolio() {
  const queryClient = useQueryClient();
  return useMutation<Folio, Error, string>({
    mutationFn: (title) => createFolio(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.folios() });
    },
  });
}

export function useFolioNotes(folioId: string | null, limit = 50) {
  return useQuery<FolioNote[]>({
    queryKey: [...folioQueryKeys.notes(folioId ?? ""), limit],
    queryFn: () => fetchFolioNotes(folioId as string, limit),
    staleTime: 30_000,
    enabled: Boolean(folioId),
  });
}

export function useCreateFolioTextNote(folioId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<FolioNote, Error, { raw_text: string; source?: string }>({
    mutationFn: (data) => createFolioTextNote(folioId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.notes(folioId ?? "") });
    },
  });
}

export function useCreateFolioVoiceNote(folioId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<FolioNote, Error, { uri: string; fileName?: string; mimeType?: string; source?: string }>({
    mutationFn: (data) => createFolioVoiceNote(folioId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.notes(folioId ?? "") });
    },
  });
}

export function useUpdateFolioNoteShape(folioId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<FolioNote, Error, { noteId: string; confirmedShape: FolioNoteShape | "" }>({
    mutationFn: ({ noteId, confirmedShape }) => updateFolioNoteShape(folioId as string, noteId, confirmedShape),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.notes(folioId ?? "") });
    },
  });
}

// Folio Notes Workbench (desktop, PoC Phase 5)
// ============================================================================

export function useSearchFolioNotes(folioId: string | null, params: FolioNoteSearchParams) {
  return useQuery<FolioNoteSearchResult>({
    queryKey: folioQueryKeys.search(folioId ?? "", params),
    queryFn: () => searchFolioNotes(folioId as string, params),
    staleTime: 15_000,
    enabled: Boolean(folioId),
    retry: false,
  });
}

export function useFolioNoteFacets(folioId: string | null) {
  return useQuery<FolioNoteFacets>({
    queryKey: folioQueryKeys.facets(folioId ?? ""),
    queryFn: () => fetchFolioNoteFacets(folioId as string),
    staleTime: 15_000,
    enabled: Boolean(folioId),
  });
}

export function useRelatedFolioNotes(folioId: string | null, noteId: string | null) {
  return useQuery<FolioNoteHit[]>({
    queryKey: folioQueryKeys.related(folioId ?? "", noteId ?? ""),
    queryFn: () => fetchRelatedFolioNotes(folioId as string, noteId as string),
    staleTime: 60_000,
    enabled: Boolean(folioId && noteId),
    retry: false,
  });
}

export function useWriterEntities() {
  return useQuery<WriterEntity[]>({
    queryKey: folioQueryKeys.entities(),
    queryFn: fetchWriterEntities,
    staleTime: 30_000,
  });
}

export function useConfirmFolioNoteMention(folioId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<
    FolioNote,
    Error,
    { noteId: string; index: number; payload: { entity_id: string } | { name: string; kind?: string } }
  >({
    mutationFn: ({ noteId, index, payload }) => confirmFolioNoteMention(folioId as string, noteId, index, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.notes(folioId ?? "") });
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.entities() });
    },
  });
}

export function useUnlinkFolioNoteMention(folioId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<FolioNote, Error, { noteId: string; index: number }>({
    mutationFn: ({ noteId, index }) => unlinkFolioNoteMention(folioId as string, noteId, index),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.notes(folioId ?? "") });
    },
  });
}

export function useMoveFolioNote(folioId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<FolioNote, Error, { noteId: string; targetFolioId: string }>({
    mutationFn: ({ noteId, targetFolioId }) => moveFolioNote(folioId as string, noteId, targetFolioId),
    onSuccess: (_note, { targetFolioId }) => {
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.notes(folioId ?? "") });
      queryClient.invalidateQueries({ queryKey: folioQueryKeys.notes(targetFolioId) });
    },
  });
}
