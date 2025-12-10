// src/hooks/useWriting.ts
/**
 * Generic hook for fetching writing content (placements & drafts)
 * Works with both Group and Member sponsors
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import { FlattenedPlacement, WritingWorkingCopy } from '@/types/writingTypes';
import { publishPiece as publishPieceApi, publishAndPlace as publishAndPlaceApi } from '@/lib/writing/api';
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
  setDraftFilter: (filter: 'my' | 'shared' | 'all') => void;
  draftFilter: 'my' | 'shared' | 'all';
}

/**
 * Fetch placements and drafts for a sponsor (Group or Member)
 *
 * @param sponsorType - 'group' or 'member'
 * @param sponsorSlug - slug of the sponsor
 * @param options - Optional configuration
 *
 * @example
 * // For a group
 * const { placements, drafts, setDraftFilter } = useWriting('group', 'my-group-slug');
 *
 * // For a member
 * const { placements, drafts } = useWriting('member', 'username');
 */
export function useWriting(
  sponsorType: 'group' | 'member',
  sponsorSlug: string,
  options?: { defaultDraftFilter?: 'my' | 'shared' | 'all' }
): UseWritingReturn {
  const [draftFilter, setDraftFilter] = React.useState<'my' | 'shared' | 'all'>(
    options?.defaultDraftFilter || 'my'
  );

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
    queryKey: ['writing', 'drafts', sponsorType, sponsorSlug, draftFilter],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/writing/drafts', {
        params: {
          sponsor_type: sponsorType,
          sponsor_slug: sponsorSlug,
          filter: draftFilter,
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
    setDraftFilter,
    draftFilter,
  };
}

/**
 * Fetch a single published piece by slug
 *
 * @param pieceSlug - slug of the piece to fetch
 *
 * @example
 * const { piece, isLoading, error } = useWritingPiece('my-piece-slug');
 */
export function useWritingPiece(pieceSlug: string | null) {
  const {
    data: piece,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['writing', 'piece', pieceSlug],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/writing/pieces/view/${pieceSlug}`);
      return response.data;
    },
    enabled: !!pieceSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    piece: piece || null,
    isLoading,
    error: error as Error | null,
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

  /**
   * Publish piece mutation - standard publish flow
   * Used by SimplePublishDialog
   */
  const publishPiece = useMutation({
    mutationFn: async ({ pieceId, payload }: {
      pieceId: string;
      payload: {
        title?: string;
        body_json?: any;
        excerpt?: string;
        destinations: {
          groups?: string[];
          members?: string[];
        };
        placement_options?: {
          visibility?: 'public' | 'private';
          is_excerpt?: boolean;
          follow_updates?: boolean;
        };
      }
    }) => {
      return publishPieceApi(pieceId, payload);
    },
    onSuccess: () => {
      // Invalidate both placements and drafts to refresh the lists
      queryClient.invalidateQueries({
        queryKey: ['writing', 'placements', sponsorType, sponsorSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ['writing', 'drafts', sponsorType, sponsorSlug],
      });
    },
  });

  /**
   * Publish and place mutation - advanced publish flow
   * Used by GroupPublishControls for publish-and-place endpoint
   */
  const publishAndPlace = useMutation({
    mutationFn: async ({ pieceId, payload }: { pieceId: string; payload: any }) => {
      return publishAndPlaceApi(pieceId, payload);
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
    publishAndPlace,
  };
}
