// Collection API client (Curation layer)
// Separate from Stackroom IR APIs to maintain conceptual boundary

import {
  CollectionListItem,
  CollectionDetail,
  CollectionCreateRequest,
  CollectionUpdateRequest,
  CollectionListParams,
  SourceFileMinimal,
  WritingPieceMinimal,
  LibraryItem,
  LibraryItemCreateRequest,
  LibraryItemUpdateRequest,
  LibraryItemReorderRequest,
  CollectionItemListParams,
} from '@mixtape/core/types/collectionTypes';
import { axiosInstance } from '../../lib/axiosInstance';

// ============================================================================
// COLLECTION CRUD
// ============================================================================

/**
 * List all Collections accessible to the current user
 */
export async function listCollections(
  params?: CollectionListParams
): Promise<CollectionListItem[]> {
  const response = await axiosInstance.get<CollectionListItem[]>(
    '/api/collections/',
    { params }
  );
  return response.data;
}

/**
 * Create a new Collection
 */
export async function createCollection(
  data: CollectionCreateRequest
): Promise<CollectionDetail> {
  const response = await axiosInstance.post<CollectionDetail>(
    '/api/collections/',
    data
  );
  return response.data;
}

/**
 * Get Collection detail by ID
 */
export async function getCollection(
  collectionId: string
): Promise<CollectionDetail> {
  const response = await axiosInstance.get<CollectionDetail>(
    `/api/collections/${collectionId}/`
  );
  return response.data;
}

/**
 * Update Collection metadata
 */
export async function updateCollection(
  collectionId: string,
  data: CollectionUpdateRequest
): Promise<CollectionDetail> {
  const response = await axiosInstance.patch<CollectionDetail>(
    `/api/collections/${collectionId}/`,
    data
  );
  return response.data;
}

/**
 * Delete a Collection
 */
export async function deleteCollection(
  collectionId: string
): Promise<void> {
  await axiosInstance.delete(`/api/collections/${collectionId}/`);
}

// ============================================================================
// SOURCE FILES (Available to add to Collection)
// ============================================================================

/**
 * Get all SourceFiles available in this Collection's Library
 * Shows which files are already added and how many times
 */
export async function getAvailableFiles(
  collectionId: string
): Promise<SourceFileMinimal[]> {
  const response = await axiosInstance.get<SourceFileMinimal[]>(
    `/api/collections/${collectionId}/available-files/`
  );
  return response.data;
}

/**
 * Get all published WritingPieces available for this Collection
 * Shows which documents are already added and how many times
 * Filters by sponsor match (same sponsor as Collection)
 */
export async function getAvailableDocuments(
  collectionId: string
): Promise<WritingPieceMinimal[]> {
  const response = await axiosInstance.get<WritingPieceMinimal[]>(
    `/api/collections/${collectionId}/available-documents/`
  );
  return response.data;
}

// ============================================================================
// LIBRARY ITEMS (Editorial overlays)
// ============================================================================

/**
 * List all items in a Collection
 */
export async function getCollectionItems(
  collectionId: string,
  params?: CollectionItemListParams
): Promise<LibraryItem[]> {
  const response = await axiosInstance.get<LibraryItem[]>(
    `/api/collections/${collectionId}/items/`,
    { params }
  );
  return response.data;
}

/**
 * Add a SourceFile to Collection as a LibraryItem
 */
export async function createLibraryItem(
  collectionId: string,
  data: LibraryItemCreateRequest
): Promise<LibraryItem> {
  const response = await axiosInstance.post<LibraryItem>(
    `/api/collections/${collectionId}/items/`,
    data
  );
  return response.data;
}

/**
 * Get a single LibraryItem by ID
 */
export async function getLibraryItem(
  collectionId: string,
  itemId: string
): Promise<LibraryItem> {
  const response = await axiosInstance.get<LibraryItem>(
    `/api/collections/${collectionId}/items/${itemId}/`
  );
  return response.data;
}

/**
 * Update a LibraryItem (editorial overlay)
 */
export async function updateLibraryItem(
  collectionId: string,
  itemId: string,
  data: LibraryItemUpdateRequest
): Promise<LibraryItem> {
  const response = await axiosInstance.patch<LibraryItem>(
    `/api/collections/${collectionId}/items/${itemId}/`,
    data
  );
  return response.data;
}

/**
 * Remove a LibraryItem from Collection
 * DOES NOT delete the SourceFile (preserves IR truth)
 */
export async function deleteLibraryItem(
  collectionId: string,
  itemId: string
): Promise<void> {
  await axiosInstance.delete(
    `/api/collections/${collectionId}/items/${itemId}/`
  );
}

/**
 * Bulk reorder LibraryItems
 */
export async function reorderLibraryItems(
  collectionId: string,
  data: LibraryItemReorderRequest
): Promise<{ detail: string }> {
  const response = await axiosInstance.post<{ detail: string }>(
    `/api/collections/${collectionId}/items/reorder/`,
    data
  );
  return response.data;
}
