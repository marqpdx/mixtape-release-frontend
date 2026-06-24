import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversationDevices,
  trustDevice,
  fetchMyDevices,
  revokeDevice,
} from "@mixtape/api/clients/chat/chatApi";
import { rotateAllMyConversationKeys } from "@mixtape/api/lib/chat/keyRotation";
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
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: deviceQueryKeys.myDevices(),
    queryFn: fetchMyDevices,
    staleTime: 60_000,
  });

  // LW-C4: revoking one of my own devices rotates the key for every
  // Private/Ephemeral conversation I'm in, excluding that device — it stops
  // receiving future key bundles, so it can't read anything sent afterward.
  const revokeMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      await revokeDevice(deviceId);
      await rotateAllMyConversationKeys(deviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceQueryKeys.myDevices() });
    },
  });

  return {
    devices: (data ?? []) as DeviceSession[],
    isLoading,
    revokeDevice: (deviceId: string) => revokeMutation.mutateAsync(deviceId),
    isRevoking: revokeMutation.isPending,
  };
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

  const verificationStatus = computeVerificationStatus(data);

  return {
    data,
    isLoading,
    verificationStatus,
    trustDevice: (deviceId: string) => trustMutation.mutate(deviceId),
    isTrusting: trustMutation.isPending,
  };
}
