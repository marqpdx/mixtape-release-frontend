// src/hooks/useWriting.ts
/**
 * Generic hook for fetching writing content (placements & drafts)
 * Works with both Group and Member sponsors
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import { FlattenedPlacement, WritingWorkingCopy } from '@/types/writingTypes';
// import type { FlattenedPlacement, WritingWorkingCopy } from '@content/writingTypes';

interface SponsorConfig {
  type: 'group' | 'member';
  slug: string;
}

interface UseWritingReturn {
  placements: FlattenedPlacement[];
  drafts: WritingWorkingCopy[];
  isLoading: boolean;
  placementsLoading: boolean;
  draftsLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch placements and drafts for a sponsor (Group or Member)
 *
 * @param sponsorType - 'group' or 'member'
 * @param sponsorSlug - slug of the sponsor
 *
 * @example
 * // For a group
 * const { placements, drafts } = useWriting('group', 'my-group-slug');
 *
 * // For a member
 * const { placements, drafts } = useWriting('member', 'username');
 */
export function useWriting(
  sponsorType: 'group' | 'member',
  sponsorSlug: string
): UseWritingReturn {

  // Fetch placements (published content)
  const {
    data: placements = [],
    isLoading: placementsLoading,
    error: placementsError,
    refetch: refetchPlacements,
  } = useQuery<FlattenedPlacement[]>({
    queryKey: ['writing', 'placements', sponsorType, sponsorSlug],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/writing/placements', {
        params: {
          sponsor_type: sponsorType,
          sponsor_slug: sponsorSlug,
        },
      });
      // return response.data;
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
    enabled: !!sponsorSlug,
  });

  // Fetch drafts (working copies)
  const {
    data: drafts = [],
    isLoading: draftsLoading,
    error: draftsError,
    refetch: refetchDrafts,
  } = useQuery<WritingWorkingCopy[]>({
    queryKey: ['writing', 'drafts', sponsorType, sponsorSlug],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/writing/drafts', {
        params: {
          sponsor_type: sponsorType,
          sponsor_slug: sponsorSlug,
        },
      });
      // return response.data;
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
    enabled: !!sponsorSlug,
  });

  const refetch = () => {
    refetchPlacements();
    refetchDrafts();
  };

  return {
    placements,
    drafts,
    isLoading: placementsLoading || draftsLoading,
    placementsLoading,
    draftsLoading,
    error: (placementsError || draftsError) as Error | null,
    refetch,
  };
}

/**
 * Mutations for writing operations
 */
export function useWritingMutations(sponsorType: 'group' | 'member', sponsorSlug: string) {
  const queryClient = useQueryClient();

  const deleteDraft = useMutation({
    mutationFn: async (draftId: string) => {
      await axiosInstance.delete(`/api/writing/drafts/${draftId}`);
    },
    onSuccess: () => {
      // Invalidate drafts query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['writing', 'drafts', sponsorType, sponsorSlug],
      });
    },
  });

  const publishPiece = useMutation({
    mutationFn: async ({ pieceId, payload }: { pieceId: string; payload: any }) => {
      const response = await axiosInstance.post(`/api/writing/pieces/${pieceId}/publish`, payload);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both queries
      queryClient.invalidateQueries({
        queryKey: ['writing', 'placements', sponsorType, sponsorSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ['writing', 'drafts', sponsorType, sponsorSlug],
      });
    },
  });

  return {
    deleteDraft,
    publishPiece,
  };
}
