// packages/api/src/hooks/storyboard/useStoryboard.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStoryboard,
  createStoryboardItem,
  fetchStoryboardDetail,
  fetchStoryboards,
  fetchStoryboardNotes,
  fetchStoryboardEntities,
  updateStoryboardFolios,
  addStoryboardParticipation,
  removeStoryboardParticipation,
  addStoryboardNoteLink,
  removeStoryboardNoteLink,
  reorderStoryboardItems,
  resetStoryboardLayout,
  updateStoryboardSurfaceState,
  updateStoryboardItem,
  type CreateStoryboardItemPayload,
  type CreateStoryboardPayload,
  type Storyboard,
  type StoryboardDetail,
  type StoryboardItem,
  type StoryboardEntity,
  type StoryboardParticipation,
  type StoryboardItemLink,
  type StoryboardSurfaceState,
  type UpdateStoryboardItemPayload,
} from "../../clients/storyboard/storyboardApi";
import type { FolioNote } from "../../clients/folio/folioApi";

export const storyboardQueryKeys = {
  all: ["storyboard"] as const,
  list: () => [...storyboardQueryKeys.all, "list"] as const,
  detail: (id: string) => [...storyboardQueryKeys.all, "detail", id] as const,
};

export function useStoryboards() {
  return useQuery<Storyboard[]>({
    queryKey: storyboardQueryKeys.list(),
    queryFn: fetchStoryboards,
    staleTime: 30_000,
  });
}

export function useCreateStoryboard() {
  const queryClient = useQueryClient();
  return useMutation<Storyboard, Error, CreateStoryboardPayload>({
    mutationFn: createStoryboard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyboardQueryKeys.list() });
    },
  });
}

export function useStoryboardDetail(storyboardId: string | null) {
  return useQuery<StoryboardDetail>({
    queryKey: storyboardQueryKeys.detail(storyboardId ?? ""),
    queryFn: () => fetchStoryboardDetail(storyboardId as string),
    staleTime: 10_000,
    enabled: Boolean(storyboardId),
  });
}

export function useCreateStoryboardItem(storyboardId: string) {
  const queryClient = useQueryClient();
  return useMutation<StoryboardItem, Error, CreateStoryboardItemPayload>({
    mutationFn: (payload) => createStoryboardItem(storyboardId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyboardQueryKeys.detail(storyboardId) });
    },
  });
}

export function useUpdateStoryboardItem(storyboardId: string) {
  const queryClient = useQueryClient();
  return useMutation<StoryboardItem, Error, { itemId: string; payload: UpdateStoryboardItemPayload }>({
    mutationFn: ({ itemId, payload }) => updateStoryboardItem(storyboardId, itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyboardQueryKeys.detail(storyboardId) });
    },
  });
}

export function useReorderStoryboardItems(storyboardId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    StoryboardItem[],
    Error,
    { parent_id?: string | null; ordered_item_ids: string[] }
  >({
    mutationFn: (payload) => reorderStoryboardItems(storyboardId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyboardQueryKeys.detail(storyboardId) });
    },
  });
}

export function useStoryboardSurfaceState(storyboardId: string) {
  const queryClient = useQueryClient();
  return useMutation<StoryboardSurfaceState, Error, { itemId: string; payload: Partial<Omit<StoryboardSurfaceState, "item_id">> }>({
    mutationFn: ({ itemId, payload }) => updateStoryboardSurfaceState(storyboardId, itemId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyboardQueryKeys.detail(storyboardId) }),
  });
}

export function useResetStoryboardLayout(storyboardId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error>({
    mutationFn: () => resetStoryboardLayout(storyboardId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyboardQueryKeys.detail(storyboardId) }),
  });
}

export function useStoryboardNotes(storyboardId: string) {
  return useQuery<FolioNote[]>({
    queryKey: [...storyboardQueryKeys.detail(storyboardId), "notes"],
    queryFn: () => fetchStoryboardNotes(storyboardId),
    enabled: Boolean(storyboardId),
  });
}

export function useStoryboardEntities(storyboardId: string) {
  return useQuery<StoryboardEntity[]>({
    queryKey: [...storyboardQueryKeys.detail(storyboardId), "entities"],
    queryFn: () => fetchStoryboardEntities(storyboardId),
    enabled: Boolean(storyboardId),
  });
}

export function useUpdateStoryboardFolios(storyboardId: string) {
  const queryClient = useQueryClient();
  return useMutation<Storyboard, Error, string[]>({
    mutationFn: (folioIds) => updateStoryboardFolios(storyboardId, folioIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyboardQueryKeys.detail(storyboardId) }),
  });
}

export function useAddStoryboardParticipation(storyboardId: string) {
  const queryClient = useQueryClient();
  return useMutation<StoryboardParticipation, Error, { itemId: string; payload: { kind: string; entity_id?: string; name?: string; note_id?: string; mention_index?: number } }>({
    mutationFn: ({ itemId, payload }) => addStoryboardParticipation(storyboardId, itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyboardQueryKeys.detail(storyboardId) });
      queryClient.invalidateQueries({ queryKey: [...storyboardQueryKeys.detail(storyboardId), "entities"] });
      queryClient.invalidateQueries({ queryKey: [...storyboardQueryKeys.detail(storyboardId), "notes"] });
    },
  });
}

export function useRemoveStoryboardParticipation(storyboardId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { itemId: string; id: number }>({
    mutationFn: ({ itemId, id }) => removeStoryboardParticipation(storyboardId, itemId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyboardQueryKeys.detail(storyboardId) }),
  });
}

export function useAddStoryboardNoteLink(storyboardId: string) {
  const queryClient = useQueryClient();
  return useMutation<StoryboardItemLink, Error, { itemId: string; noteId: string }>({
    mutationFn: ({ itemId, noteId }) => addStoryboardNoteLink(storyboardId, itemId, noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyboardQueryKeys.detail(storyboardId) }),
  });
}

export function useRemoveStoryboardNoteLink(storyboardId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { itemId: string; id: number }>({
    mutationFn: ({ itemId, id }) => removeStoryboardNoteLink(storyboardId, itemId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyboardQueryKeys.detail(storyboardId) }),
  });
}
