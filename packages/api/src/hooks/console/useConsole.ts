import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchHubCaptures,
  fetchOrientation,
  fetchReentry,
  fetchSignals,
  fetchStewardship,
  HubCaptureKind,
  resolveHubCapture,
} from "@mixtape/api/clients/console/consoleApi";

const CONSOLE_STALE_MS = 60_000;

export function useReentry() {
  return useQuery({
    queryKey: ["console", "reentry"],
    queryFn: fetchReentry,
    staleTime: CONSOLE_STALE_MS,
  });
}

export function useSignals() {
  return useQuery({
    queryKey: ["console", "signals"],
    queryFn: fetchSignals,
    staleTime: CONSOLE_STALE_MS,
  });
}

export function useOrientation() {
  return useQuery({
    queryKey: ["console", "orientation"],
    queryFn: fetchOrientation,
    staleTime: CONSOLE_STALE_MS,
  });
}

export function useStewardship() {
  return useQuery({
    queryKey: ["console", "stewardship"],
    queryFn: fetchStewardship,
    staleTime: CONSOLE_STALE_MS,
  });
}

export function useHubCaptures(kind: HubCaptureKind, groupSlug?: string) {
  return useQuery({
    queryKey: ["console", "hub-captures", kind, groupSlug ?? null],
    queryFn: () => fetchHubCaptures(kind, groupSlug),
    staleTime: CONSOLE_STALE_MS,
  });
}

export function useResolveCapture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resolveHubCapture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["console", "hub-captures"] });
      queryClient.invalidateQueries({ queryKey: ["console", "orientation"] });
    },
  });
}
