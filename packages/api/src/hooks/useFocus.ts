// packages/api/src/hooks/useFocus.ts
// Focus-Centered Writing ADR, Phase 2 (FCW-6): Focus data hooks.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as focusApi from "@mixtape/api/clients/writing/focusApi";
import type { Focus, FocusObjectType, FocusState, FocusVerb } from "@mixtape/api/clients/writing/focusApi";

const FOCUSES_KEY = ["writing", "focuses"];
const focusKey = (id: string) => ["writing", "focuses", id];

export function useFocuses() {
  return useQuery<Focus[]>({
    queryKey: FOCUSES_KEY,
    queryFn: () => focusApi.listFocuses(),
  });
}

export function useCreateFocus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ objectType, objectId, verb }: { objectType: FocusObjectType; objectId: string; verb?: FocusVerb }) =>
      focusApi.createFocus(objectType, objectId, verb),
    onSuccess: () => qc.invalidateQueries({ queryKey: FOCUSES_KEY }),
  });
}

export function useFocus(focusId: string | null) {
  const qc = useQueryClient();

  const { data: focus, isLoading, error } = useQuery<Focus>({
    queryKey: focusKey(focusId!),
    queryFn: () => focusApi.getFocus(focusId!),
    enabled: !!focusId,
  });

  const updateState = useMutation({
    mutationFn: (state: FocusState) => focusApi.updateFocusState(focusId!, state),
    onSuccess: (updated) => qc.setQueryData(focusKey(focusId!), updated),
  });

  const resolve = useMutation({
    mutationFn: () => focusApi.resolveFocus(focusId!),
    onSuccess: (updated) => {
      qc.setQueryData(focusKey(focusId!), updated);
      qc.invalidateQueries({ queryKey: FOCUSES_KEY });
    },
  });

  return { focus, isLoading, error, updateState, resolve };
}
