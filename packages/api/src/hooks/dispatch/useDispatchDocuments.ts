// src/hooks/dispatch/useDispatchDocuments.ts
// React Query hook for fetching dispatch documents

import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import { DispatchDocument } from '@components/dispatch/interfaces';

interface UseDispatchDocumentsOptions {
  enabled?: boolean;
}

/**
 * Fetch all dispatch documents for the current user
 */
export function useDispatchDocuments(options: UseDispatchDocumentsOptions = {}) {
  return useQuery({
    queryKey: ['dispatch', 'documents'],
    queryFn: async (): Promise<DispatchDocument[]> => {
      const response = await axiosInstance.get('/api/dispatch/content');
      return response.data;
    },
    enabled: options.enabled !== false,
  });
}

/**
 * Fetch a single dispatch document by ID
 */
export function useDispatchDocument(documentId: string | null, options: UseDispatchDocumentsOptions = {}) {
  return useQuery({
    queryKey: ['dispatch', 'documents', documentId],
    queryFn: async (): Promise<DispatchDocument> => {
      if (!documentId) throw new Error('Document ID is required');
      const response = await axiosInstance.get(`/api/dispatch/content/${documentId}`);
      return response.data;
    },
    enabled: !!documentId && options.enabled !== false,
  });
}
