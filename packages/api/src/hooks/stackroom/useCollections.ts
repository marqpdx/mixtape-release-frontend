// Collection hooks (Curation layer)
// Separate from Stackroom IR hooks to maintain conceptual boundary

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as collectionApi from '@mixtape/api/clients/stackroom/collectionApi';
import {
  CollectionListItem,
  CollectionDetail,
  CollectionCreateRequest,
  CollectionUpdateRequest,
  CollectionListParams,
  SourceFileMinimal,
  LibraryItem,
  LibraryItemCreateRequest,
  LibraryItemUpdateRequest,
  LibraryItemReorderRequest,
  CollectionItemListParams,
  CollectionTextSearchRequest,
  CollectionTextSearchResponse,
} from '@mixtape/core/types/collectionTypes';

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const collectionQueryKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionQueryKeys.all, 'list'] as const,
  list: (params?: CollectionListParams) => [...collectionQueryKeys.lists(), params] as const,
  details: () => [...collectionQueryKeys.all, 'detail'] as const,
  detail: (collectionId: string) => [...collectionQueryKeys.details(), collectionId] as const,
  items: (collectionId: string) => [...collectionQueryKeys.detail(collectionId), 'items'] as const,
  itemsList: (collectionId: string, params?: CollectionItemListParams) =>
    [...collectionQueryKeys.items(collectionId), params] as const,
  availableFiles: (collectionId: string) =>
    [...collectionQueryKeys.detail(collectionId), 'available-files'] as const,
  search: (collectionId: string, query: string) =>
    [...collectionQueryKeys.detail(collectionId), 'search', query] as const,
};

// ============================================================================
// COLLECTION QUERY HOOKS
// ============================================================================

/**
 * Hook to list all Collections accessible to the user
 *
 * @example
 * ```tsx
 * const { collections, isLoading } = useCollections({ sponsor_type: 'group', sponsor_id: groupId });
 * ```
 */
export const useCollections = (params?: CollectionListParams) => {
  const {
    data: collections = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: collectionQueryKeys.list(params),
    queryFn: () => collectionApi.listCollections(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    collections,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to fetch a single Collection detail
 *
 * @example
 * ```tsx
 * const { collection, isLoading } = useCollection(collectionId);
 * ```
 */
export const useCollection = (collectionId: string | null) => {
  const {
    data: collection = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: collectionId ? collectionQueryKeys.detail(collectionId) : ['collections', 'empty'],
    queryFn: () => {
      if (!collectionId) return Promise.resolve(null);
      return collectionApi.getCollection(collectionId);
    },
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    collection,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to get available SourceFiles for adding to Collection
 * Shows which files are already in collection and usage count
 *
 * @example
 * ```tsx
 * const { files, isLoading } = useAvailableFiles(collectionId);
 * ```
 */
export const useAvailableFiles = (collectionId: string | null) => {
  const {
    data: files = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: collectionId ? collectionQueryKeys.availableFiles(collectionId) : ['collections', 'empty'],
    queryFn: () => {
      if (!collectionId) return Promise.resolve([]);
      return collectionApi.getAvailableFiles(collectionId);
    },
    enabled: !!collectionId,
    staleTime: 2 * 60 * 1000, // 2 minutes - more dynamic
    refetchOnWindowFocus: false,
  });

  return {
    files,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to get available WritingPieces (documents) for adding to Collection
 * Shows which documents are already in collection and usage count
 * Filters by sponsor match
 *
 * @example
 * ```tsx
 * const { documents, isLoading } = useAvailableDocuments(collectionId);
 * ```
 */
export const useAvailableDocuments = (collectionId: string | null) => {
  const {
    data: documents = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: collectionId
      ? [...collectionQueryKeys.detail(collectionId), 'available-documents']
      : ['collections', 'empty'],
    queryFn: () => {
      if (!collectionId) return Promise.resolve([]);
      return collectionApi.getAvailableDocuments(collectionId);
    },
    enabled: !!collectionId,
    staleTime: 2 * 60 * 1000, // 2 minutes - more dynamic
    refetchOnWindowFocus: false,
  });

  return {
    documents,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to list LibraryItems in a Collection
 *
 * @example
 * ```tsx
 * const { items, isLoading } = useCollectionItems(collectionId, { folder: 'research' });
 * ```
 */
export const useCollectionItems = (
  collectionId: string | null,
  params?: CollectionItemListParams
) => {
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: collectionId
      ? collectionQueryKeys.itemsList(collectionId, params)
      : ['collections', 'empty'],
    queryFn: () => {
      if (!collectionId) return Promise.resolve([]);
      return collectionApi.getCollectionItems(collectionId, params);
    },
    enabled: !!collectionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  return {
    items,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to get a single LibraryItem
 *
 * @example
 * ```tsx
 * const { item, isLoading } = useLibraryItem(collectionId, itemId);
 * ```
 */
export const useLibraryItem = (
  collectionId: string | null,
  itemId: string | null
) => {
  const {
    data: item = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: collectionId && itemId
      ? [...collectionQueryKeys.items(collectionId), itemId]
      : ['collections', 'empty'],
    queryFn: () => {
      if (!collectionId || !itemId) return Promise.resolve(null);
      return collectionApi.getLibraryItem(collectionId, itemId);
    },
    enabled: !!collectionId && !!itemId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    item,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to search Collection content (full-text search through Chunks)
 * Searches ingested document content using PostgreSQL ILIKE
 * Returns snippets with context around matches
 *
 * @example
 * ```tsx
 * const { searchResults, isSearching, search } = useCollectionTextSearch(collectionId);
 *
 * // Trigger search
 * search({ query: 'saddle', limit: 20 });
 * ```
 */
export const useCollectionTextSearch = (collectionId: string | null) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLimit, setSearchLimit] = useState<number>(20);

  const {
    data: searchResults = null,
    isLoading: isSearching,
    error,
    refetch,
  } = useQuery({
    queryKey: collectionId && searchQuery
      ? collectionQueryKeys.search(collectionId, searchQuery)
      : ['collections', 'empty'],
    queryFn: () => {
      if (!collectionId || !searchQuery) return Promise.resolve(null);
      return collectionApi.searchCollectionText(collectionId, {
        query: searchQuery,
        limit: searchLimit,
      });
    },
    enabled: !!collectionId && !!searchQuery,
    staleTime: 1 * 60 * 1000, // 1 minute (search results change less frequently)
    refetchOnWindowFocus: false,
  });

  const search = (params: CollectionTextSearchRequest) => {
    setSearchQuery(params.query);
    setSearchLimit(params.limit || 20);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    searchResults,
    isSearching,
    error: error as Error | null,
    search,
    clearSearch,
    refetch,
  };
};

// ============================================================================
// COLLECTION MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new Collection
 *
 * @example
 * ```tsx
 * const createMutation = useCreateCollection();
 *
 * await createMutation.mutateAsync({
 *   title: 'New Collection',
 *   summary: 'Description',
 *   sponsor_type: 'group',
 *   sponsor_id: groupId
 * });
 * ```
 */
export const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CollectionCreateRequest) => collectionApi.createCollection(data),
    onSuccess: () => {
      // Invalidate all collection lists to refetch
      queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() });
    },
  });
};

/**
 * Hook to update Collection metadata
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateCollection();
 *
 * await updateMutation.mutateAsync({
 *   collectionId,
 *   data: { title: 'New Title', summary: 'Updated summary' }
 * });
 * ```
 */
export const useUpdateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, data }: {
      collectionId: string;
      data: CollectionUpdateRequest;
    }) => collectionApi.updateCollection(collectionId, data),
    onSuccess: (updatedCollection) => {
      // Invalidate collection lists
      queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() });
      // Update the specific collection cache
      queryClient.setQueryData(
        collectionQueryKeys.detail(updatedCollection.id),
        updatedCollection
      );
    },
  });
};

/**
 * Hook to delete a Collection
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteCollection();
 *
 * await deleteMutation.mutateAsync(collectionId);
 * ```
 */
export const useDeleteCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: string) => collectionApi.deleteCollection(collectionId),
    onSuccess: (_, collectionId) => {
      // Invalidate all collection lists
      queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() });
      // Remove the specific collection from cache
      queryClient.removeQueries({ queryKey: collectionQueryKeys.detail(collectionId) });
    },
  });
};

// ============================================================================
// LIBRARY ITEM MUTATION HOOKS
// ============================================================================

/**
 * Hook to add content to Collection as LibraryItem (polymorphic)
 * Supports SourceFile and WritingPiece
 *
 * @example
 * ```tsx
 * const createMutation = useCreateLibraryItem();
 *
 * // Add SourceFile
 * await createMutation.mutateAsync({
 *   collectionId,
 *   data: {
 *     content_type: 'source_file',
 *     content_id: fileId,
 *     order_index: 1,
 *     tags: ['important']
 *   }
 * });
 *
 * // Add WritingPiece
 * await createMutation.mutateAsync({
 *   collectionId,
 *   data: {
 *     content_type: 'writing_piece',
 *     content_id: articleId,
 *     tags: ['featured']
 *   }
 * });
 * ```
 */
export const useCreateLibraryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, data }: {
      collectionId: string;
      data: LibraryItemCreateRequest;
    }) => collectionApi.createLibraryItem(collectionId, data),
    onSuccess: (_, variables) => {
      // Invalidate items list for this collection
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.items(variables.collectionId)
      });
      // Invalidate available files (counts changed for SourceFiles)
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.availableFiles(variables.collectionId)
      });
      // Invalidate available documents (counts changed for WritingPieces)
      queryClient.invalidateQueries({
        queryKey: [...collectionQueryKeys.detail(variables.collectionId), 'available-documents']
      });
      // Invalidate collection detail (item count changed)
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.detail(variables.collectionId)
      });
    },
  });
};

/**
 * Hook to update LibraryItem editorial overlay
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateLibraryItem();
 *
 * await updateMutation.mutateAsync({
 *   collectionId,
 *   itemId,
 *   data: { tags: ['updated'], is_featured: true }
 * });
 * ```
 */
export const useUpdateLibraryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, itemId, data }: {
      collectionId: string;
      itemId: string;
      data: LibraryItemUpdateRequest;
    }) => collectionApi.updateLibraryItem(collectionId, itemId, data),
    onSuccess: (updatedItem, variables) => {
      // Update the specific item in cache
      queryClient.setQueryData(
        [...collectionQueryKeys.items(variables.collectionId), variables.itemId],
        updatedItem
      );
      // Invalidate items list (may affect ordering/filtering)
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.items(variables.collectionId)
      });
    },
  });
};

/**
 * Hook to remove LibraryItem from Collection
 * Does NOT delete the content object (preserves IR truth for SourceFiles, published WritingPieces)
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteLibraryItem();
 *
 * await deleteMutation.mutateAsync({ collectionId, itemId });
 * ```
 */
export const useDeleteLibraryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, itemId }: {
      collectionId: string;
      itemId: string;
    }) => collectionApi.deleteLibraryItem(collectionId, itemId),
    onSuccess: (_, variables) => {
      // Invalidate items list
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.items(variables.collectionId)
      });
      // Invalidate available files (counts changed for SourceFiles)
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.availableFiles(variables.collectionId)
      });
      // Invalidate available documents (counts changed for WritingPieces)
      queryClient.invalidateQueries({
        queryKey: [...collectionQueryKeys.detail(variables.collectionId), 'available-documents']
      });
      // Invalidate collection detail (item count changed)
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.detail(variables.collectionId)
      });
    },
  });
};

/**
 * Hook to bulk reorder LibraryItems
 *
 * @example
 * ```tsx
 * const reorderMutation = useReorderLibraryItems();
 *
 * await reorderMutation.mutateAsync({
 *   collectionId,
 *   data: {
 *     items: [
 *       { id: 'item1', order_index: 1 },
 *       { id: 'item2', order_index: 2 },
 *     ]
 *   }
 * });
 * ```
 */
export const useReorderLibraryItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, data }: {
      collectionId: string;
      data: LibraryItemReorderRequest;
    }) => collectionApi.reorderLibraryItems(collectionId, data),
    onSuccess: (_, variables) => {
      // Invalidate items list to refetch with new order
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.items(variables.collectionId)
      });
    },
  });
};
