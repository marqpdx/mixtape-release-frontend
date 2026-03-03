// src/hooks/useWriting.ts
/**
 * Generic hook for fetching writing content (placements & drafts)
 * Works with both Group and Member sponsors
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlattenedPlacement, WritingWorkingCopy, WritingPiece } from '@mixtape/core/types/writingTypes';
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

  // Fetch placements (published content) for groups
  const {
    data: placements = [],
    isLoading: placementsLoading,
    error: placementsError,
    refetch: refetchPlacements,
  } = useQuery<FlattenedPlacement[]>({
    queryKey: ['writing', 'placements', sponsorType, sponsorSlug],
    queryFn: () => writingApi.fetchPlacements(sponsorType, sponsorSlug),
    enabled: !!sponsorSlug && sponsorType === 'group',
  });

  // Fetch published pieces for members (author view)
  const {
    data: publishedPieces = [],
    isLoading: publishedLoading,
    error: publishedError,
    refetch: refetchPublished,
  } = useQuery<WritingPiece[]>({
    queryKey: ['writing', 'published', sponsorType, sponsorSlug],
    queryFn: () => writingApi.fetchPublishedPieces(),
    enabled: !!sponsorSlug && sponsorType === 'member',
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

  const mapPieceToPlacement = (piece: WritingPiece): FlattenedPlacement => {
    if (process.env.NODE_ENV !== "production") {
      try {
        console.log("[useWriting] piece tags_list", piece.id, piece.tags_list);
      } catch {
        // ignore logging errors
      }
    }
    const authorName = sponsorSlug || piece.author?.email || 'author';
    return {
      id: piece.id,
      piece_id: piece.id,
      piece_slug: piece.slug,
      piece_title: piece.title,
      piece_body_json: piece.body_json,
      piece_status: piece.status,
      published_at: piece.published_at || piece.updated_at,
      pinned_at: piece.pinned_at,
      author_name: authorName,
      visibility: 'public',
      is_pinned: Boolean(piece.pinned_at),
      is_announcement: piece.writing_kind === 'announcement',
      order: 0,
      created_at: piece.created_at,
      updated_at: piece.updated_at,
      tags: piece.tags_list || [],
      sponsor_content_type: piece.sponsor_content_type,
      sponsor_object_id: piece.sponsor_object_id,
      display: {
        title: piece.title,
        excerpt: piece.excerpt,
        is_excerpt: false,
        body_json: piece.body_json,
      },
    };
  };

  const placementsData =
    sponsorType === 'member'
      ? (Array.isArray(publishedPieces) ? publishedPieces : []).map(mapPieceToPlacement)
      : placements;

  if (process.env.NODE_ENV !== "production") {
    try {
      console.log("[useWriting] drafts tags_list", drafts?.map((d) => ({
        id: d.id,
        pieceId: d.piece?.id,
        tags_list: (d as any).tags_list ?? d.piece?.tags_list,
      })));
    } catch {
      // ignore logging errors
    }
  }

  const isPlacementsLoading =
    sponsorType === 'member' ? publishedLoading : placementsLoading;
  const placementsErr =
    sponsorType === 'member' ? publishedError : placementsError;
  const refetchPublishedOrPlacements =
    sponsorType === 'member' ? refetchPublished : refetchPlacements;

  const refetch = () => {
    refetchPublishedOrPlacements();
    refetchDrafts();
  };

  return {
    placements: placementsData,
    drafts,
    isLoading: isPlacementsLoading || draftsLoading,
    placementsLoading: isPlacementsLoading,
    draftsLoading,
    error: (placementsErr || draftsError) as Error | null,
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
        group_overrides?: Record<string, {
          visibility?: 'public' | 'members' | 'unlisted' | 'private' | 'scheduled';
          is_excerpt?: boolean;
          follow_updates?: boolean;
          overrides?: Record<string, unknown>;
          order?: number;
          is_pinned?: boolean;
        }>;
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
        queryKey: ['writing', 'published', sponsorType, sponsorSlug],
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
        queryKey: ['writing', 'published', sponsorType, sponsorSlug],
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
        queryKey: ['writing', 'published', sponsorType, sponsorSlug],
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
