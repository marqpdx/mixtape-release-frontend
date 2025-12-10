// hooks/useCollaboration.ts
/**
 * Hook for managing collaboration state on a WorkingDocument
 */

import { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import { toaster } from '@/components/ui/toaster';
import type {
  CollaborationStatus,
  DispatchContent,
  EnableCollaborationRequest,
  AddCollaboratorsRequest,
  RemoveCollaboratorsRequest,
  CollaboratorRole,
} from '@/types/dispatchTypes';

interface EligibleCollaborator {
  id: number;
  member_object: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
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
  loading: boolean;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibleCollaborators, setEligibleCollaborators] = useState<EligibleCollaborator[]>([]);

  // Fetch collaboration status
  const fetchStatus = useCallback(async () => {
    if (!pieceId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<CollaborationStatus>(
        `/api/writing/working-documents/${pieceId}/collaboration/status`
      );
      setStatus(response.data);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to fetch collaboration status';
      setError(errorMsg);
      console.error('Failed to fetch collaboration status:', err);
    } finally {
      setLoading(false);
    }
  }, [pieceId]);

  // Fetch eligible collaborators
  const fetchEligibleCollaborators = useCallback(async () => {
    if (!pieceId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<{
        eligible_collaborators: EligibleCollaborator[];
        group_slug: string;
        group_name: string;
      }>(`/api/writing/working-documents/${pieceId}/collaboration/eligible`);

      setEligibleCollaborators(response.data.eligible_collaborators || []);
      console.log('🔍 Fetched eligible collaborators:', response.data.eligible_collaborators);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to fetch eligible collaborators';
      setError(errorMsg);
      console.error('Failed to fetch eligible collaborators:', err);
    } finally {
      setLoading(false);
    }
  }, [pieceId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchStatus();
      fetchEligibleCollaborators();
    }
  }, [autoFetch, fetchStatus, fetchEligibleCollaborators]);

  // Enable collaboration
  const enableCollaboration = useCallback(async (request?: EnableCollaborationRequest) => {
    if (!pieceId) return;

    setLoading(true);
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

      // Refresh status
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
      setLoading(false);
    }
  }, [pieceId, fetchStatus]);

  // Rescind collaboration
  const rescindCollaboration = useCallback(async () => {
    if (!pieceId || !status.dispatch_content) return;

    setLoading(true);
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

      // Refresh status
      await fetchStatus();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to rescind collaboration';
      const hasEdits = err?.response?.data?.has_collaborative_edits;

      setError(errorMsg);
      toaster.create({
        title: 'Could not end collaboration',
        description: hasEdits
          ? 'Cannot rescind - collaborators have made edits'
          : errorMsg,
        type: 'error',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pieceId, status.dispatch_content, fetchStatus]);

  // Add collaborators
  const addCollaborators = useCallback(async (userIds: number[], role: CollaboratorRole) => {
    if (!status.dispatch_content) return;

    setLoading(true);
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

      // Refresh status
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
      setLoading(false);
    }
  }, [status.dispatch_content, fetchStatus]);

  // Remove collaborators
  const removeCollaborators = useCallback(async (userIds: number[]) => {
    if (!status.dispatch_content) return;

    setLoading(true);
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

      // Refresh status
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
      setLoading(false);
    }
  }, [status.dispatch_content, fetchStatus]);

  return {
    // State
    isCollaborative: status.is_collaborative,
    dispatchContent: status.dispatch_content,
    loading,
    error,
    eligibleCollaborators,

    // Actions
    enableCollaboration,
    rescindCollaboration,
    addCollaborators,
    removeCollaborators,
    refreshStatus: fetchStatus,
    fetchEligibleCollaborators,

    // Computed
    canBeRescinded: status.dispatch_content?.can_be_rescinded ?? false,
    hasCollaborativeEdits: status.dispatch_content?.has_collaborative_edits ?? false,
    editorCount: status.dispatch_content?.editor_count ?? 0,
    commenterCount: status.dispatch_content?.commenter_count ?? 0,
  };
}

// Export the EligibleCollaborator type for use in components
export type { EligibleCollaborator };
