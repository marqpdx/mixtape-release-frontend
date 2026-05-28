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
  type PersonalStudioResponse,
  type PersonalGroupItem,
  type GroupPulseResponse,
  type GroupCanonResponse,
  type GroupCommandResponse,
  type GroupClientsResponse,
  type BerylDismissMode,
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
