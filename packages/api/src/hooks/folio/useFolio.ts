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
  type FolioInception,
  type FolioInceptionCreatePayload,
  type FolioAnalyzeResult,
  type Folio,
  type FolioMaterialCandidate,
} from "../../clients/folio/folioApi";

export const folioQueryKeys = {
  all: ["folio"] as const,
  inception: (id: string) => [...folioQueryKeys.all, "inception", id] as const,
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
