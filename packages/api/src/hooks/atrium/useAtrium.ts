// hooks/atrium/useAtrium.ts

import { useQuery } from "@tanstack/react-query";
import * as atriumApi from "@mixtape/api/clients/atrium/atriumApi";

export const atriumQueryKeys = {
  all: ["atrium"] as const,
  sessions: () => [...atriumQueryKeys.all, "sessions"] as const,
};

export function useAtriumSessions() {
  const { data: sessions = [], isLoading, error, refetch } = useQuery({
    queryKey: atriumQueryKeys.sessions(),
    queryFn: atriumApi.fetchAtriumSessions,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { sessions, isLoading, error: error as Error | null, refetch };
}
