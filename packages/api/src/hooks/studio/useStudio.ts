// packages/api/src/hooks/studio/useStudio.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPersonalStudio,
  fetchPersonalGroups,
  fetchStudioGroupPulse,
  fetchGroupCanon,
  fetchGroupCommand,
  fetchGroupClients,
  dismissBerylPrompt,
  fetchGroupRecurringActions,
  createRecurringAction,
  updateRecurringAction,
  deleteRecurringAction,
  fetchPersonalRecurringActions,
  createPersonalRecurringAction,
  updatePersonalRecurringAction,
  deletePersonalRecurringAction,
  fetchBerylSession,
  updateBerylScrap,
  type PersonalStudioResponse,
  type PersonalGroupItem,
  type GroupPulseResponse,
  type GroupCanonResponse,
  type GroupCommandResponse,
  type GroupClientsResponse,
  type BerylDismissMode,
  type RecurringActionItem,
  type RecurringActionCreateInput,
  type RecurringActionUpdateInput,
  type BerylSessionResponse,
  type ScrapItem,
  type ScrapUpdateInput,
} from "../../clients/studio/studioApi";

// ============================================================================
// Query keys
// ============================================================================

export const studioQueryKeys = {
  all: ["studio"] as const,

  personal: () => [...studioQueryKeys.all, "personal"] as const,
  personalGroups: () => [...studioQueryKeys.all, "personal", "groups"] as const,

  group: (slug: string) => [...studioQueryKeys.all, "groups", slug] as const,
  groupPulse: (slug: string) => [...studioQueryKeys.group(slug), "pulse"] as const,
  groupCanon: (slug: string) => [...studioQueryKeys.group(slug), "canon"] as const,
  groupCommand: (slug: string) => [...studioQueryKeys.group(slug), "command"] as const,
  groupClients: (slug: string) => [...studioQueryKeys.group(slug), "clients"] as const,
  groupRecurringActions: (slug: string) => [...studioQueryKeys.group(slug), "recurring-actions"] as const,
  personalRecurringActions: () => [...studioQueryKeys.personal(), "recurring-actions"] as const,

  berylSession: (ctx: string) => [...studioQueryKeys.all, "beryl", "session", ctx] as const,
};

// ============================================================================
// Personal Studio
// ============================================================================

export function usePersonalStudio() {
  return useQuery<PersonalStudioResponse>({
    queryKey: studioQueryKeys.personal(),
    queryFn: fetchPersonalStudio,
    staleTime: 60_000,
  });
}

export function usePersonalGroups() {
  return useQuery<PersonalGroupItem[]>({
    queryKey: studioQueryKeys.personalGroups(),
    queryFn: fetchPersonalGroups,
    staleTime: 60_000,
  });
}

export function useBerylDismiss() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, BerylDismissMode>({
    mutationFn: (mode) => dismissBerylPrompt(mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.personal() });
    },
  });
}

// ============================================================================
// Group Studio
// ============================================================================

export function useStudioGroupPulse(groupSlug: string) {
  return useQuery<GroupPulseResponse>({
    queryKey: studioQueryKeys.groupPulse(groupSlug),
    queryFn: () => fetchStudioGroupPulse(groupSlug),
    enabled: !!groupSlug,
    staleTime: 30_000,
  });
}

export function useGroupCanon(groupSlug: string) {
  return useQuery<GroupCanonResponse>({
    queryKey: studioQueryKeys.groupCanon(groupSlug),
    queryFn: () => fetchGroupCanon(groupSlug),
    enabled: !!groupSlug,
    staleTime: 60_000,
  });
}

export function useGroupCommand(groupSlug: string) {
  return useQuery<GroupCommandResponse>({
    queryKey: studioQueryKeys.groupCommand(groupSlug),
    queryFn: () => fetchGroupCommand(groupSlug),
    enabled: !!groupSlug,
    staleTime: 15_000,
    refetchInterval: (query) => {
      const opsInFlight = query.state.data?.metrics.ops_in_flight ?? 0;
      return opsInFlight > 0 ? 10_000 : false;
    },
  });
}

export function useGroupClients(groupSlug: string) {
  return useQuery<GroupClientsResponse>({
    queryKey: studioQueryKeys.groupClients(groupSlug),
    queryFn: () => fetchGroupClients(groupSlug),
    enabled: !!groupSlug,
    staleTime: 5 * 60_000,
  });
}

// ============================================================================
// RecurringAction CRUD
// ============================================================================

export function useGroupRecurringActions(groupSlug: string) {
  return useQuery<RecurringActionItem[]>({
    queryKey: studioQueryKeys.groupRecurringActions(groupSlug),
    queryFn: () => fetchGroupRecurringActions(groupSlug),
    enabled: !!groupSlug,
    staleTime: 60_000,
  });
}

export function useCreateRecurringAction(groupSlug: string) {
  const queryClient = useQueryClient();
  return useMutation<RecurringActionItem, Error, RecurringActionCreateInput>({
    mutationFn: (input) => createRecurringAction(groupSlug, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.groupRecurringActions(groupSlug) });
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.groupPulse(groupSlug) });
    },
  });
}

export function useUpdateRecurringAction(groupSlug: string) {
  const queryClient = useQueryClient();
  return useMutation<RecurringActionItem, Error, { id: string; input: RecurringActionUpdateInput }>({
    mutationFn: ({ id, input }) => updateRecurringAction(groupSlug, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.groupRecurringActions(groupSlug) });
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.groupPulse(groupSlug) });
    },
  });
}

export function useDeleteRecurringAction(groupSlug: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteRecurringAction(groupSlug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.groupRecurringActions(groupSlug) });
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.groupPulse(groupSlug) });
    },
  });
}

// ============================================================================
// Personal RecurringAction CRUD
// ============================================================================

export function usePersonalRecurringActions() {
  return useQuery<RecurringActionItem[]>({
    queryKey: studioQueryKeys.personalRecurringActions(),
    queryFn: fetchPersonalRecurringActions,
    staleTime: 60_000,
  });
}

export function useCreatePersonalRecurringAction() {
  const queryClient = useQueryClient();
  return useMutation<RecurringActionItem, Error, RecurringActionCreateInput>({
    mutationFn: createPersonalRecurringAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.personalRecurringActions() });
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.personal() });
    },
  });
}

export function useUpdatePersonalRecurringAction() {
  const queryClient = useQueryClient();
  return useMutation<RecurringActionItem, Error, { id: string; input: RecurringActionUpdateInput }>({
    mutationFn: ({ id, input }) => updatePersonalRecurringAction(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.personalRecurringActions() });
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.personal() });
    },
  });
}

export function useDeletePersonalRecurringAction() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deletePersonalRecurringAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.personalRecurringActions() });
      queryClient.invalidateQueries({ queryKey: studioQueryKeys.personal() });
    },
  });
}

// ============================================================================
// Beryl session
// ============================================================================

export function useBerylSession(ctx: string) {
  return useQuery<BerylSessionResponse>({
    queryKey: studioQueryKeys.berylSession(ctx),
    queryFn: () => fetchBerylSession(ctx),
    enabled: !!ctx,
    staleTime: 0,
  });
}

export function useUpdateBerylScrap() {
  const queryClient = useQueryClient();
  return useMutation<ScrapItem, Error, { id: string; input: ScrapUpdateInput }>({
    mutationFn: ({ id, input }) => updateBerylScrap(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.setQueriesData<BerylSessionResponse>(
        { queryKey: [...studioQueryKeys.all, "beryl", "session"] },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            scraps: prev.scraps.map((s) => (s.id === id ? _data : s)),
          };
        },
      );
    },
  });
}
