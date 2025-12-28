// hooks/useCollaboration.ts
/**
 * Hook for managing collaboration state on a WorkingDocument
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import { toaster } from '@/components/ui/toaster';
import type {
  CollaborationStatus,
  DispatchContent,
  EnableCollaborationRequest,
  AddCollaboratorsRequest,
  RemoveCollaboratorsRequest,
  CollaboratorRole,
} from '@mixtape/core/types/dispatchTypes';

interface EligibleCollaborator {
  id: number;
  member_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  display_name: string;
  roles: string[];
}

interface UseCollaborationOptions {
  pieceId: string;
  autoFetch?: boolean;
}

interface UseCollaborationReturn {
  // State
  isCollaborative: boolean;
  dispatchContent: DispatchContent | null;

  // Loading / readiness
  loading: boolean;                 // legacy “any loading”
  statusLoading: boolean;           // status request
  eligibleLoading: boolean;         // eligible request
  statusReady: boolean;             // ✅ fetched at least once

  error: string | null;
  eligibleCollaborators: EligibleCollaborator[];

  // Actions
  enableCollaboration: (request?: EnableCollaborationRequest) => Promise<void>;
  rescindCollaboration: () => Promise<void>;
  addCollaborators: (userIds: number[], role: CollaboratorRole) => Promise<void>;
  removeCollaborators: (userIds: number[]) => Promise<void>;
  refreshStatus: () => Promise<void>;
  fetchEligibleCollaborators: () => Promise<void>;

  // Computed
  canBeRescinded: boolean;
  hasCollaborativeEdits: boolean;
  editorCount: number;
  commenterCount: number;
}

export function useCollaboration({
  pieceId,
  autoFetch = true,
}: UseCollaborationOptions): UseCollaborationReturn {
  const [status, setStatus] = useState<CollaborationStatus>({
    is_collaborative: false,
    dispatch_content: null,
  });

  const [statusLoading, setStatusLoading] = useState(false);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [hasFetchedStatus, setHasFetchedStatus] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [eligibleCollaborators, setEligibleCollaborators] = useState<EligibleCollaborator[]>([]);

  const fetchStatus = useCallback(async () => {
    if (!pieceId) return;

    setStatusLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<CollaborationStatus>(
        `/api/writing/working-documents/${pieceId}/collaboration/status`
      );
      setStatus(response.data);
      setHasFetchedStatus(true);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to fetch collaboration status';
      setError(errorMsg);
      console.error('Failed to fetch collaboration status:', err);
    } finally {
      setStatusLoading(false);
    }
  }, [pieceId]);

  const fetchEligibleCollaborators = useCallback(async () => {
    if (!pieceId) return;

    setEligibleLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<{
        eligible_collaborators: EligibleCollaborator[];
        group_slug: string;
        group_name: string;
      }>(`/api/writing/working-documents/${pieceId}/collaboration/eligible`);

      setEligibleCollaborators(response.data.eligible_collaborators || []);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to fetch eligible collaborators';
      setError(errorMsg);
      console.error('Failed to fetch eligible collaborators:', err);
    } finally {
      setEligibleLoading(false);
    }
  }, [pieceId]);

  useEffect(() => {
    if (!autoFetch) return;
    if (!pieceId) return;

    // Fire in parallel; readiness is based on status fetch
    fetchStatus();
    fetchEligibleCollaborators();
  }, [autoFetch, pieceId, fetchStatus, fetchEligibleCollaborators]);

  const enableCollaboration = useCallback(
    async (request?: EnableCollaborationRequest) => {
      if (!pieceId) return;

      setStatusLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.post(
          `/api/writing/working-documents/${pieceId}/collaboration/enable`,
          request || {}
        );

        toaster.create({
          title: 'Collaboration enabled',
          description: response.data.message || 'You can now collaborate with others',
          type: 'success',
        });

        await fetchStatus();
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || 'Failed to enable collaboration';
        setError(errorMsg);
        toaster.create({
          title: 'Could not enable collaboration',
          description: errorMsg,
          type: 'error',
        });
        throw err;
      } finally {
        setStatusLoading(false);
      }
    },
    [pieceId, fetchStatus]
  );

  const rescindCollaboration = useCallback(async () => {
    if (!pieceId || !status.dispatch_content) return;

    setStatusLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post(
        `/api/writing/working-documents/${pieceId}/collaboration/rescind`
      );

      toaster.create({
        title: 'Collaboration ended',
        description: response.data.message || 'Back to solo editing mode',
        type: 'success',
      });

      await fetchStatus();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to rescind collaboration';
      const hasEdits = err?.response?.data?.has_collaborative_edits;

      setError(errorMsg);
      toaster.create({
        title: 'Could not end collaboration',
        description: hasEdits ? 'Cannot rescind - collaborators have made edits' : errorMsg,
        type: 'error',
      });
      throw err;
    } finally {
      setStatusLoading(false);
    }
  }, [pieceId, status.dispatch_content, fetchStatus]);

  const addCollaborators = useCallback(
    async (userIds: number[], role: CollaboratorRole) => {
      if (!status.dispatch_content) return;

      setStatusLoading(true);
      setError(null);

      try {
        const request: AddCollaboratorsRequest = { user_ids: userIds, role };

        await axiosInstance.post(
          `/api/dispatch/content/${status.dispatch_content.id}/collaborators`,
          request
        );

        toaster.create({
          title: 'Collaborators added',
          description: `Added ${userIds.length} ${role}(s)`,
          type: 'success',
        });

        await fetchStatus();
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || 'Failed to add collaborators';
        setError(errorMsg);
        toaster.create({
          title: 'Could not add collaborators',
          description: errorMsg,
          type: 'error',
        });
        throw err;
      } finally {
        setStatusLoading(false);
      }
    },
    [status.dispatch_content, fetchStatus]
  );

  const removeCollaborators = useCallback(
    async (userIds: number[]) => {
      if (!status.dispatch_content) return;

      setStatusLoading(true);
      setError(null);

      try {
        const request: RemoveCollaboratorsRequest = { user_ids: userIds };

        await axiosInstance.delete(
          `/api/dispatch/content/${status.dispatch_content.id}/collaborators`,
          { data: request }
        );

        toaster.create({
          title: 'Collaborators removed',
          description: `Removed ${userIds.length} collaborator(s)`,
          type: 'success',
        });

        await fetchStatus();
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || 'Failed to remove collaborators';
        setError(errorMsg);
        toaster.create({
          title: 'Could not remove collaborators',
          description: errorMsg,
          type: 'error',
        });
        throw err;
      } finally {
        setStatusLoading(false);
      }
    },
    [status.dispatch_content, fetchStatus]
  );

  const loading = statusLoading || eligibleLoading;
  const statusReady = hasFetchedStatus; // ✅ this is the important "meta ready" signal

  return {
    isCollaborative: status.is_collaborative,
    dispatchContent: status.dispatch_content,

    loading,
    statusLoading,
    eligibleLoading,
    statusReady,

    error,
    eligibleCollaborators,

    enableCollaboration,
    rescindCollaboration,
    addCollaborators,
    removeCollaborators,
    refreshStatus: fetchStatus,
    fetchEligibleCollaborators,

    canBeRescinded: status.dispatch_content?.can_be_rescinded ?? false,
    hasCollaborativeEdits: status.dispatch_content?.has_collaborative_edits ?? false,
    editorCount: status.dispatch_content?.editor_count ?? 0,
    commenterCount: status.dispatch_content?.commenter_count ?? 0,
  };
}

export type { EligibleCollaborator };
