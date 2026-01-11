// src/hooks/appearance/useGroupThemeSettings.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as appearanceApi from "@mixtape/api/clients/appearance/appearanceApi";

export const appearanceQueryKeys = {
  all: ["appearance"] as const,
  groupThemes: (groupSlug: string) => [...appearanceQueryKeys.all, "group", groupSlug, "themes"] as const,
};

export function useGroupThemeSettings(groupSlug: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: appearanceQueryKeys.groupThemes(groupSlug || ""),
    queryFn: () => appearanceApi.fetchGroupThemeSettings(groupSlug!),
    enabled: !!groupSlug,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: (payload: appearanceApi.UpdateGroupThemeSettingsPayload) =>
      appearanceApi.updateGroupThemeSettings(groupSlug!, payload),
    onSuccess: (data) => {
      if (!groupSlug) return;
      queryClient.setQueryData(appearanceQueryKeys.groupThemes(groupSlug), data);
    },
  });

  return {
    ...query,
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
