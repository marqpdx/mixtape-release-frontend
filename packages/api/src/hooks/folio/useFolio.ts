// packages/api/src/hooks/folio/useFolio.ts

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  createFolioInception,
  fetchFolioInception,
  analyzeFolioInception,
  type FolioInception,
  type FolioInceptionCreatePayload,
  type FolioAnalyzeResult,
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
  return useMutation<FolioAnalyzeResult, Error, { debug: boolean }>({
    mutationFn: ({ debug }) => analyzeFolioInception(inceptionId, debug),
  });
}
