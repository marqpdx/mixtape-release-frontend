// packages/api/src/hooks/spellbook/useSpellbook.ts

/**
 * React Query hooks for Spellbook (shared spell dictionary)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  spellbookApi,
  SpellCorrection,
  SpellSuggestion,
  SpellCorrectionCreatePayload,
  SpellSuggestionCreatePayload,
} from '../../clients/spellbook';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const spellbookKeys = {
  all: ['spellbook'] as const,
  corrections: () => [...spellbookKeys.all, 'corrections'] as const,
  suggestions: () => [...spellbookKeys.all, 'suggestions'] as const,
  suggestionsByStatus: (status: string) => [...spellbookKeys.suggestions(), status] as const,
};

// ============================================================================
// CORRECTIONS HOOKS
// ============================================================================

/**
 * Fetch all approved spell corrections
 */
export function useSpellCorrections() {
  return useQuery({
    queryKey: spellbookKeys.corrections(),
    queryFn: () => spellbookApi.getCorrections(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Add a new spell correction (superadmin only)
 */
export function useAddSpellCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SpellCorrectionCreatePayload) => spellbookApi.addCorrection(payload),
    onSuccess: (newCorrection) => {
      // Optimistically add to cache
      queryClient.setQueryData<SpellCorrection[]>(
        spellbookKeys.corrections(),
        (old) => old ? [...old, newCorrection].sort((a, b) => a.wrong_word.localeCompare(b.wrong_word)) : [newCorrection]
      );
    },
  });
}

/**
 * Delete a spell correction (superadmin only)
 */
export function useDeleteSpellCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (correctionId: string) => spellbookApi.deleteCorrection(correctionId),
    onSuccess: (_, correctionId) => {
      // Remove from cache
      queryClient.setQueryData<SpellCorrection[]>(
        spellbookKeys.corrections(),
        (old) => old?.filter((c) => c.id !== correctionId) ?? []
      );
    },
  });
}

/**
 * Record usage of a correction (fire-and-forget, no UI update needed)
 */
export function useRecordCorrectionUsage() {
  return useMutation({
    mutationFn: (correctionId: string) => spellbookApi.recordUsage(correctionId),
    // No cache update needed - usage count is informational
  });
}

// ============================================================================
// SUGGESTIONS HOOKS
// ============================================================================

/**
 * Fetch spell suggestions
 * - Regular users: their own suggestions
 * - Superadmins: pending suggestions by default
 */
export function useSpellSuggestions(status?: 'pending' | 'approved' | 'rejected') {
  return useQuery({
    queryKey: status ? spellbookKeys.suggestionsByStatus(status) : spellbookKeys.suggestions(),
    queryFn: () => spellbookApi.getSuggestions(status),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Submit a new spell suggestion
 */
export function useSubmitSpellSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SpellSuggestionCreatePayload) => spellbookApi.submitSuggestion(payload),
    onSuccess: () => {
      // Invalidate suggestions to refetch
      queryClient.invalidateQueries({ queryKey: spellbookKeys.suggestions() });
    },
  });
}

/**
 * Approve a spell suggestion (superadmin only)
 */
export function useApproveSpellSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestionId: string) => spellbookApi.approveSuggestion(suggestionId),
    onSuccess: (result) => {
      // Add the new correction to cache
      queryClient.setQueryData<SpellCorrection[]>(
        spellbookKeys.corrections(),
        (old) => old ? [...old, result.correction].sort((a, b) => a.wrong_word.localeCompare(b.wrong_word)) : [result.correction]
      );
      // Invalidate suggestions to refetch
      queryClient.invalidateQueries({ queryKey: spellbookKeys.suggestions() });
    },
  });
}

/**
 * Reject a spell suggestion (superadmin only)
 */
export function useRejectSpellSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ suggestionId, note }: { suggestionId: string; note?: string }) =>
      spellbookApi.rejectSuggestion(suggestionId, note),
    onSuccess: () => {
      // Invalidate suggestions to refetch
      queryClient.invalidateQueries({ queryKey: spellbookKeys.suggestions() });
    },
  });
}

// ============================================================================
// CONVENIENCE HOOK
// ============================================================================

/**
 * Combined hook for common spell correction operations
 */
export function useSpellbook() {
  const corrections = useSpellCorrections();
  const addCorrection = useAddSpellCorrection();
  const deleteCorrection = useDeleteSpellCorrection();
  const recordUsage = useRecordCorrectionUsage();
  const submitSuggestion = useSubmitSpellSuggestion();

  return {
    // Data
    corrections: corrections.data ?? [],
    isLoading: corrections.isLoading,
    error: corrections.error,

    // Mutations
    addCorrection: addCorrection.mutateAsync,
    deleteCorrection: deleteCorrection.mutateAsync,
    recordUsage: recordUsage.mutate,
    submitSuggestion: submitSuggestion.mutateAsync,

    // Mutation states
    isAdding: addCorrection.isPending,
    isDeleting: deleteCorrection.isPending,
    isSubmitting: submitSuggestion.isPending,
  };
}
