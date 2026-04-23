import { useQuery } from "@tanstack/react-query";
import {
  fetchOrientation,
  fetchReentry,
  fetchSignals,
  fetchStewardship,
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
