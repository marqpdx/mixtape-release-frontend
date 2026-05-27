// packages/api/src/hooks/useLivingBook.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@mixtape/api/clients/livingBook/livingBookApi";

export function useLivingBook(id: string | null) {
  return useQuery({
    queryKey: ["living-book", id],
    queryFn: () => api.getLivingBook(id!),
    enabled: !!id,
  });
}

export function useLivingBookTree(id: string | null) {
  return useQuery({
    queryKey: ["living-book-tree", id],
    queryFn: () => api.getLivingBookTree(id!),
    enabled: !!id,
  });
}

export function useLivingBookAccumulated(id: string | null) {
  return useQuery({
    queryKey: ["living-book-accumulated", id],
    queryFn: () => api.getAccumulatedView(id!),
    enabled: !!id,
  });
}

export function useContextNeighbors(
  livingBookId: string | null,
  pieceId: string | null
) {
  return useQuery({
    queryKey: ["living-book-context", livingBookId, pieceId],
    queryFn: () => api.getContextNeighbors(livingBookId!, pieceId!),
    enabled: !!livingBookId && !!pieceId,
    staleTime: 60 * 1000,
  });
}

export function useLivingBookMutations(id: string) {
  const queryClient = useQueryClient();

  const invalidateTree = () => {
    queryClient.invalidateQueries({ queryKey: ["living-book-tree", id] });
    queryClient.invalidateQueries({ queryKey: ["living-book-accumulated", id] });
    queryClient.invalidateQueries({ queryKey: ["living-book", id] });
  };

  const promote = useMutation({
    mutationFn: api.promoteLivingBook,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["living-book"] }),
  });

  const addNode = useMutation({
    mutationFn: (payload: api.AddNodePayload) => api.addNode(id, payload),
    onSuccess: invalidateTree,
  });

  const createAddNode = useMutation({
    mutationFn: (payload: api.CreateAddNodePayload) => api.createAddNode(id, payload),
    onSuccess: invalidateTree,
  });

  const removeNode = useMutation({
    mutationFn: (pieceId: string) => api.removeNode(id, pieceId),
    onSuccess: invalidateTree,
  });

  const reorderNodes = useMutation({
    mutationFn: (payload: api.ReorderPayload) =>
      api.reorderNodes(id, payload.parent_id, payload.ordered_piece_ids),
    onSuccess: invalidateTree,
  });

  const updateBook = useMutation({
    mutationFn: (payload: Parameters<typeof api.updateLivingBook>[1]) =>
      api.updateLivingBook(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["living-book", id] }),
  });

  return { promote, addNode, createAddNode, removeNode, reorderNodes, updateBook };
}
