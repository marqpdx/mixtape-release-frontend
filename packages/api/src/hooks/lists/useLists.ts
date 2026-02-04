// packages/api/src/hooks/lists/useLists.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listsApi,
  ListDetail,
  ListCreatePayload,
  ListUpdatePayload,
  ListReorderPayload,
} from '../../clients/lists/listsApi';

// ============================================================================
// QUERY HOOKS
// ============================================================================

interface UseListsOptions {
  sponsorType?: string;
  sponsorObjectId?: string;
  enabled?: boolean;
}

interface UseListsReturn {
  lists: ListDetail[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch lists for a sponsor (defaults to current user)
 */
export function useLists(options: UseListsOptions = {}): UseListsReturn {
  const { sponsorType, sponsorObjectId, enabled = true } = options;

  const {
    data: lists = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lists', sponsorType, sponsorObjectId],

    queryFn: async () => {
      return await listsApi.getLists({
        sponsor_type: sponsorType,
        sponsor_object_id: sponsorObjectId,
      });
    },

    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000,    // 3 minutes

    enabled,

    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    lists,
    isLoading,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}

interface UseListOptions {
  listId: string;
  enabled?: boolean;
}

interface UseListReturn {
  list: ListDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch a single list by ID
 */
export function useList(options: UseListOptions): UseListReturn {
  const { listId, enabled = true } = options;

  const {
    data: list = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['list', listId],

    queryFn: async () => {
      return await listsApi.getList(listId);
    },

    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes

    enabled: enabled && !!listId,

    retry: 2,
  });

  return {
    list,
    isLoading,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new list
 */
export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ListCreatePayload) => {
      return await listsApi.createList(payload);
    },
    onSuccess: () => {
      // Invalidate lists query to refetch
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

/**
 * Hook to update a list
 */
export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, payload }: { listId: string; payload: ListUpdatePayload }) => {
      return await listsApi.updateList(listId, payload);
    },
    onSuccess: (data) => {
      // Update the specific list in cache
      queryClient.setQueryData(['list', data.id], data);
      // Invalidate lists query
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

/**
 * Hook to delete a list
 */
export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      return await listsApi.deleteList(listId);
    },
    onSuccess: (_, listId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['list', listId] });
      // Invalidate lists query
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

/**
 * Hook to toggle an item's completion status
 */
export function useToggleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, itemIndex }: { listId: string; itemIndex: number }) => {
      return await listsApi.toggleItem(listId, itemIndex);
    },
    onSuccess: (data) => {
      // Update the list in cache
      queryClient.setQueryData(['list', data.id], data);
    },
  });
}

/**
 * Hook to reorder items in a list
 */
export function useReorderItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      payload,
    }: {
      listId: string;
      payload: ListReorderPayload;
    }) => {
      return await listsApi.reorderItems(listId, payload);
    },
    onSuccess: (data) => {
      // Update the list in cache
      queryClient.setQueryData(['list', data.id], data);
    },
  });
}
