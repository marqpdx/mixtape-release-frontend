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
  type FolioNote,
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
