// Puddlejump Utilities hooks
// React Query hooks for library analysis and maintenance utilities

import { useQuery, useMutation } from '@tanstack/react-query';
import * as utilitiesApi from '@mixtape/api/clients/puddlejump/puddlejumpUtilitiesApi';
import type {
  LibraryHealthResponse,
  DuplicateDetectionResponse,
  GlossaryResponse,
  CanonicalCandidatesResponse,
  SuggestSummariesResponse,
  RestructureResponse,
} from '@mixtape/api/clients/puddlejump/puddlejumpUtilitiesApi';

// Re-export types for consumers
export type {
  LibraryHealthResponse,
  CoverageMetric,
  MissingSummary,
  OverdueReview,
  IngestionStatus,
  DuplicatePair,
  DuplicateDetectionResponse,
  GlossaryTerm,
  GlossaryTermSource,
  GlossaryResponse,
  CanonicalCandidate,
  CanonicalCandidatesResponse,
  SuggestedSummary,
  SuggestSummariesResponse,
  ClusterDocument,
  DocumentCluster,
  RestructureResponse,
} from '@mixtape/api/clients/puddlejump/puddlejumpUtilitiesApi';

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const puddlejumpUtilityKeys = {
  all: ['puddlejump', 'utilities'] as const,
  health: (libraryId: string) =>
    [...puddlejumpUtilityKeys.all, 'health', libraryId] as const,
  duplicates: (libraryId: string) =>
    [...puddlejumpUtilityKeys.all, 'duplicates', libraryId] as const,
  glossary: (libraryId: string) =>
    [...puddlejumpUtilityKeys.all, 'glossary', libraryId] as const,
  canonical: (libraryId: string) =>
    [...puddlejumpUtilityKeys.all, 'canonical', libraryId] as const,
  summaries: (libraryId: string) =>
    [...puddlejumpUtilityKeys.all, 'summaries', libraryId] as const,
  restructure: (libraryId: string) =>
    [...puddlejumpUtilityKeys.all, 'restructure', libraryId] as const,
};

// ============================================================================
// LIBRARY HEALTH (auto-fetching query for dashboard)
// ============================================================================

/**
 * Hook to fetch library health metrics.
 * Auto-fetches when libraryId is provided.
 *
 * @example
 * ```tsx
 * const { health, isLoading } = useLibraryHealth(libraryId);
 * if (health) {
 *   console.log(health.canon_coverage.percentage);
 * }
 * ```
 */
export const useLibraryHealth = (libraryId: string | null) => {
  const {
    data: health = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: puddlejumpUtilityKeys.health(libraryId || ''),
    queryFn: () => utilitiesApi.getLibraryHealth(libraryId!),
    enabled: !!libraryId,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    health,
    isLoading: isLoading && !!libraryId,
    error: error as Error | null,
    refetch,
  };
};

// ============================================================================
// DUPLICATE DETECTION (user-triggered mutation)
// ============================================================================

/**
 * Hook to run duplicate detection analysis.
 *
 * @example
 * ```tsx
 * const { mutate: runDuplicates, data, isPending } = useCheckDuplicates();
 * runDuplicates({ libraryId, similarityThreshold: 0.85 });
 * ```
 */
export const useCheckDuplicates = () => {
  return useMutation({
    mutationFn: ({
      libraryId,
      similarityThreshold = 0.85,
    }: {
      libraryId: string;
      similarityThreshold?: number;
    }) => utilitiesApi.checkDuplicates(libraryId, similarityThreshold),
  });
};

// ============================================================================
// GLOSSARY EXTRACTION (user-triggered mutation)
// ============================================================================

/**
 * Hook to run glossary extraction.
 *
 * @example
 * ```tsx
 * const { mutate: runGlossary, data, isPending } = useExtractGlossary();
 * runGlossary({ libraryId, minOccurrences: 2 });
 * ```
 */
export const useExtractGlossary = () => {
  return useMutation({
    mutationFn: ({
      libraryId,
      minOccurrences = 1,
    }: {
      libraryId: string;
      minOccurrences?: number;
    }) => utilitiesApi.extractGlossary(libraryId, minOccurrences),
  });
};

// ============================================================================
// CANONICAL CANDIDATES (user-triggered mutation)
// ============================================================================

/**
 * Hook to suggest canonical candidates.
 *
 * @example
 * ```tsx
 * const { mutate: runCanonical, data, isPending } = useSuggestCanonical();
 * runCanonical({ libraryId, topN: 10, excludeAlreadyCanonical: true });
 * ```
 */
export const useSuggestCanonical = () => {
  return useMutation({
    mutationFn: ({
      libraryId,
      topN = 10,
      excludeAlreadyCanonical = false,
    }: {
      libraryId: string;
      topN?: number;
      excludeAlreadyCanonical?: boolean;
    }) => utilitiesApi.suggestCanonical(libraryId, topN, excludeAlreadyCanonical),
  });
};

// ============================================================================
// SUGGEST SUMMARIES (Phase 6 — Inkwell LLM, user-triggered)
// ============================================================================

/**
 * Hook to suggest summaries for artifacts missing them.
 *
 * @example
 * ```tsx
 * const { mutate: runSummaries, data, isPending } = useSuggestSummaries();
 * runSummaries({ libraryId });
 * ```
 */
export const useSuggestSummaries = () => {
  return useMutation({
    mutationFn: ({ libraryId }: { libraryId: string }) =>
      utilitiesApi.suggestSummaries(libraryId),
  });
};

// ============================================================================
// RESTRUCTURE / CONSOLIDATE (Phase 7 — Inkwell LLM, user-triggered)
// ============================================================================

/**
 * Hook to cluster related documents and suggest consolidation outlines.
 *
 * @example
 * ```tsx
 * const { mutate: runRestructure, data, isPending } = useRestructureDocuments();
 * runRestructure({ libraryId, similarityThreshold: 0.6 });
 * ```
 */
export const useRestructureDocuments = () => {
  return useMutation({
    mutationFn: ({
      libraryId,
      similarityThreshold = 0.6,
    }: {
      libraryId: string;
      similarityThreshold?: number;
    }) => utilitiesApi.restructureDocuments(libraryId, similarityThreshold),
  });
};
