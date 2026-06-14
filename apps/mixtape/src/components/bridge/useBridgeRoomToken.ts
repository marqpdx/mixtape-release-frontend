"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBridgeRoomToken } from "@mixtape/api/clients/bridge/bridgeApi";

export function useBridgeRoomToken(sessionId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["bridge-room-token", sessionId],
    queryFn: () => fetchBridgeRoomToken(sessionId),
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 10, // 10 min — well inside the 4-hour token TTL
  });

  return {
    token: data?.token ?? null,
    livekitUrl: data?.livekit_url ?? null,
    roomName: data?.room_name ?? null,
    isLoading,
    error,
  };
}
