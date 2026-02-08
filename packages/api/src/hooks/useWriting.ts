// src/hooks/useWriting.ts
/**
 * Generic hook for fetching writing content (placements & drafts)
 * Works with both Group and Member sponsors
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlattenedPlacement, WritingWorkingCopy } from '@mixtape/core/types/writingTypes';
import * as writingApi from '@mixtape/api/clients/writing/api';
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
  setShowSolo: (show: boolean) => void;
  setShowCollab: (show: boolean) => void;
  showSolo: boolean;
  showCollab: boolean;
}

/**
 * Fetch placements and drafts for a sponsor (Group or Member)
 *
 * @param sponsorType - 'group' or 'member'
 * @param sponsorSlug - slug of the sponsor
 *
 * @example
 * // For a group
 * const { placements, drafts, setShowSolo, setShowCollab } = useWriting('group', 'my-group-slug');
 *
 * // For a member
 * const { placements, drafts } = useWriting('member', 'username');
 */
export function useWriting(
  sponsorType: 'group' | 'member',
  sponsorSlug: string
): UseWritingReturn {
  // Get initial state from localStorage, default to showing all (both true)
  const getInitialShowState = (key: string): boolean => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(key);
    return stored === null ? true : stored === 'true';
  };

  const [showSolo, setShowSoloState] = React.useState<boolean>(() =>
    getInitialShowState('writing:showSolo')
  );
  const [showCollab, setShowCollabState] = React.useState<boolean>(() =>
    getInitialShowState('writing:showCollab')
  );

  // Persist to localStorage when changed
  const setShowSolo = React.useCallback((show: boolean) => {
    setShowSoloState(show);
    if (typeof window !== 'undefined') {
      localStorage.setItem('writing:showSolo', String(show));
    }
  }, []);

  const setShowCollab = React.useCallback((show: boolean) => {
    setShowCollabState(show);
    if (typeof window !== 'undefined') {
      localStorage.setItem('writing:showCollab', String(show));
    }
  }, []);

  // Convert show flags to API filter
  // all = show everything (both true)
  // solo = show only solo (solo true, collab false)
  // collab = show only collab (solo false, collab true)
  // When both false, we still need to make the API call but will filter on frontend
  const draftFilter = React.useMemo((): 'all' | 'solo' | 'collab' => {
    if (showSolo && showCollab) return 'all'; // Show everything
    if (showSolo && !showCollab) return 'solo'; // Show only solo docs
    if (!showSolo && showCollab) return 'collab'; // Show only collab docs
    return 'all'; // Both false - fetch all but filter to empty on frontend
  }, [showSolo, showCollab]);

  // Fetch placements (published content)
  const {
    data: placements = [],
    isLoading: placementsLoading,
    error: placementsError,
    refetch: refetchPlacements,
  } = useQuery<FlattenedPlacement[]>({
    queryKey: ['writing', 'placements', sponsorType, sponsorSlug],
    queryFn: () => writingApi.fetchPlacements(sponsorType, sponsorSlug),
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
    queryFn: () => writingApi.fetchDrafts(sponsorType, sponsorSlug, draftFilter),
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
    setShowSolo,
    setShowCollab,
    showSolo,
    showCollab,
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
    queryFn: () => writingApi.fetchPiece(pieceSlug!),
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
    mutationFn: (draftId: string) => writingApi.deleteDraft(draftId),
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
        audience?: 'just_me' | 'readers';
        addressed_to?: 'public' | 'crossroads' | 'self';
        destinations: {
          groups?: string[];
          members?: string[];
          shelves?: string[];
        };
        placement_options?: {
          visibility?: 'public' | 'members' | 'unlisted' | 'private';
          is_excerpt?: boolean;
          follow_updates?: boolean;
          overrides?: Record<string, unknown>;
        };
      }
    }) => {
      return writingApi.publishPiece(pieceId, payload);
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
      return writingApi.publishAndPlace(pieceId, payload);
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

  /**
   * Unpublish piece mutation - return to draft
   */
  const unpublishPiece = useMutation({
    mutationFn: (pieceId: string) => writingApi.unpublishPiece(pieceId),
    onSuccess: () => {
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
    unpublishPiece,
  };
}
