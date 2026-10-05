// packages/api/src/hooks/storyboard/useStoryboard.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStoryboard,
  createStoryboardItem,
  fetchStoryboardDetail,
  fetchStoryboards,
  reorderStoryboardItems,
  updateStoryboardItem,
  type CreateStoryboardItemPayload,
  type CreateStoryboardPayload,
  type Storyboard,
  type StoryboardDetail,
  type StoryboardItem,
  type UpdateStoryboardItemPayload,
} from "../../clients/storyboard/storyboardApi";

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
