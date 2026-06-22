import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversationDevices,
  trustDevice,
  fetchMyDevices,
  revokeDevice,
} from "@mixtape/api/clients/chat/chatApi";
import type {
  ParticipantDeviceGroup,
  DeviceSession,
  VerificationStatus,
} from "@mixtape/core/types/chatTypes";

export const deviceQueryKeys = {
  myDevices: () => ["chat", "devices", "mine"] as const,
  conversationDevices: (slug: string) => ["chat", "devices", "conversation", slug] as const,
};

export function computeVerificationStatus(
  groups: ParticipantDeviceGroup[] | undefined
): VerificationStatus {
  if (!groups || groups.length === 0) return "unverified";

  const devices = groups.flatMap((g) => g.devices);
  if (devices.length === 0) return "unverified";

  const allVerified = devices.every((d) => d.verified_by_me);
  if (allVerified) return "verified";

  const anyVerified = devices.some((d) => d.verified_by_me);
  if (anyVerified) return "partial";

  return "unverified";
}

export function useMyDevices() {
  const { data, isLoading } = useQuery({
    queryKey: deviceQueryKeys.myDevices(),
    queryFn: fetchMyDevices,
    staleTime: 60_000,
  });

  return { devices: (data ?? []) as DeviceSession[], isLoading };
}

export function useConversationDevices(slug: string, enabled: boolean = true) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: deviceQueryKeys.conversationDevices(slug),
    queryFn: () => fetchConversationDevices(slug),
    staleTime: 30_000,
    enabled,
  });

  const trustMutation = useMutation({
    mutationFn: (deviceId: string) => trustDevice(slug, deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.conversationDevices(slug) });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.myDevices() });
    },
  });

  const verificationStatus = computeVerificationStatus(data);

  return {
    data,
    isLoading,
    verificationStatus,
    trustDevice: (deviceId: string) => trustMutation.mutate(deviceId),
    isTrusting: trustMutation.isPending,
  };
}
