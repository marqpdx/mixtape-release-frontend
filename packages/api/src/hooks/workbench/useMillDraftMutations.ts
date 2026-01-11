// packages/api/src/hooks/workbench/useMillDraftMutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  workbenchApi,
  MillDraftCreatePayload,
  MillDraftUpdatePayload,
  MillDraftActionPayload,
  MillDraftValidationPayload,
  MillDraftDetail,
  MillDraftActionResponse,
  MillDraftValidationResponse,
} from '../../clients/workbench/workbenchApi';

/**
 * Hook to create a new MillDraft
 */
export function useCreateMillDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: MillDraftCreatePayload) => {
      console.log('➕ Creating MillDraft:', payload);
      return await workbenchApi.createDraft(payload);
    },

    onSuccess: (data, variables) => {
      console.log('✅ MillDraft created:', data.id);

      // Invalidate Review Queue and draft lists for this sponsor
      queryClient.invalidateQueries({
        queryKey: ['review-queue', variables.sponsor_type, variables.sponsor_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['milldrafts', variables.sponsor_type, variables.sponsor_id],
      });

      // Cache the newly created draft
      queryClient.setQueryData(['milldraft', data.id], data);
    },

    onError: (error: Error) => {
      console.error('❌ Failed to create MillDraft:', error.message);
    },
  });
}

/**
 * Hook to update a MillDraft
 */
export function useUpdateMillDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ draftId, payload }: { draftId: string; payload: MillDraftUpdatePayload }) => {
      console.log('✏️ Updating MillDraft:', draftId);
      return await workbenchApi.updateDraft(draftId, payload);
    },

    onSuccess: (data) => {
      console.log('✅ MillDraft updated:', data.id);

      // Update the cached draft
      queryClient.setQueryData(['milldraft', data.id], data);

      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['milldrafts'] });
    },

    onError: (error: Error) => {
      console.error('❌ Failed to update MillDraft:', error.message);
    },
  });
}

/**
 * Hook to perform action on a MillDraft (open, promote, archive, etc.)
 */
export function useMillDraftAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ draftId, payload }: { draftId: string; payload: MillDraftActionPayload }) => {
      console.log(`🎬 Performing action "${payload.action}" on MillDraft:`, draftId);
      return await workbenchApi.performAction(draftId, payload);
    },

    onSuccess: (data) => {
      console.log('✅ Action completed:', data.message);

      // Update the cached draft with the new state
      queryClient.setQueryData(['milldraft', data.draft.id], data.draft);

      // Invalidate lists to refresh (status may have changed)
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['milldrafts'] });
    },

    onError: (error: Error) => {
      console.error('❌ Failed to perform action:', error.message);
    },
  });
}

/**
 * Hook to validate a MillDraft
 */
export function useValidateMillDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ draftId, payload = {} }: { draftId: string; payload?: MillDraftValidationPayload }) => {
      console.log('🔍 Validating MillDraft:', draftId, payload.hard ? '(hard)' : '(soft)');
      return await workbenchApi.validateDraft(draftId, payload);
    },

    onSuccess: (data, variables) => {
      console.log('✅ Validation complete:', data.is_valid ? 'VALID' : 'INVALID');

      // Refresh the draft to get updated validation state
      queryClient.invalidateQueries({ queryKey: ['milldraft', variables.draftId] });
    },

    onError: (error: Error) => {
      console.error('❌ Failed to validate MillDraft:', error.message);
    },
  });
}
