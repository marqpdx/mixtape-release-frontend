"use client";

import {
  Box,
  Button,
  Flex,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { IconDevices, IconShieldCheck, IconShieldOff } from "@tabler/icons-react";
import { useConversationDevices } from "@mixtape/api/hooks/chat/useConversationDevices";
import type { TrustProfile } from "./interfaces";

interface DeviceVerificationPanelProps {
  slug: string;
  trustProfile: TrustProfile;
}

export const DeviceVerificationPanel = ({ slug, trustProfile }: DeviceVerificationPanelProps) => {
  const enabled = trustProfile === "private" || trustProfile === "ephemeral";
  const { data, isLoading, trustDevice, isTrusting } = useConversationDevices(slug, enabled);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <Flex justify="center" py="4">
        <Spinner size="sm" />
      </Flex>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Text fontSize="sm" color="text.muted" py="2">
        No participant devices found.
      </Text>
    );
  }

  return (
    <Stack gap="4">
      {data.map((participant) => (
        <Box key={participant.username}>
          <Text fontSize="xs" fontWeight="semibold" color="text.muted" mb="2">
            {(participant.display_name || participant.username).toUpperCase()}
          </Text>
          <Stack gap="2">
            {participant.devices.map((device) => (
              <Flex
                key={device.device_id}
                align="center"
                justify="space-between"
                px="3"
                py="2"
                borderRadius="md"
                bg={device.verified_by_me ? "green.subtle" : "bg.muted"}
                gap="3"
              >
                <Flex align="center" gap="2" flex="1" minW="0">
                  <IconDevices size={14} />
                  <Box minW="0">
                    <Text fontSize="sm" fontWeight="medium" truncate>
                      {device.device_name}
                    </Text>
                    <Text fontSize="xs" color="text.muted" fontFamily="mono">
                      {device.verification_fingerprint}
                    </Text>
                  </Box>
                </Flex>
                {device.verified_by_me ? (
                  <Flex align="center" gap="1" color="green.600">
                    <IconShieldCheck size={14} />
                    <Text fontSize="xs">Verified</Text>
                  </Flex>
                ) : (
                  <Button
                    size="xs"
                    variant="outline"
                    loading={isTrusting}
                    onClick={() => trustDevice(device.device_id)}
                  >
                    <IconShieldOff size={12} />
                    Verify
                  </Button>
                )}
              </Flex>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
};
