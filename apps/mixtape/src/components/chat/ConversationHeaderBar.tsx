// components/chat/ConversationHeaderBar.tsx

"use client";

import {
  Flex,
  Text,
  Badge,
  Box,
  Stack,
  Button,
  Popover,
  Portal,
  RadioGroup,
  Drawer,
} from "@chakra-ui/react";
import { IconSettings, IconShieldCheck, IconShieldExclamation, IconShieldOff } from "@tabler/icons-react";
import { useState } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useConversationDevices } from "@mixtape/api/hooks/chat/useConversationDevices";
import { rotateConversationKey } from "@mixtape/api/lib/chat/keyRotation";
import { DeviceVerificationPanel } from "./DeviceVerificationPanel";
import type { TrustProfile } from "./interfaces";

type RetentionPeriod = "1d" | "7d" | "30d" | "90d" | "1y" | "indefinite";

const RETENTION_OPTIONS: { value: RetentionPeriod; label: string }[] = [
  { value: "indefinite", label: "Indefinite" },
  { value: "1y", label: "1 year" },
  { value: "90d", label: "90 days" },
  { value: "30d", label: "30 days" },
  { value: "7d", label: "7 days" },
  { value: "1d", label: "24 hours" },
];

const TRUST_LABELS: Record<TrustProfile, string> = {
  standard: "Standard",
  private: "Private",
  ephemeral: "Ephemeral",
};

const TRUST_COLORS: Record<TrustProfile, string> = {
  standard: "gray",
  private: "blue",
  ephemeral: "purple",
};

interface ConversationHeaderBarProps {
  slug: string;
  title: string;
  trustProfile: TrustProfile;
  initialRetentionPeriod?: RetentionPeriod;
}

const VERIFICATION_ICONS = {
  verified: <IconShieldCheck size={14} />,
  partial: <IconShieldExclamation size={14} />,
  unverified: <IconShieldOff size={14} />,
};

const VERIFICATION_COLORS = {
  verified: "green",
  partial: "orange",
  unverified: "gray",
};

const VERIFICATION_LABELS = {
  verified: "All verified",
  partial: "Partially verified",
  unverified: "Unverified",
};

export const ConversationHeaderBar = ({
  slug,
  title,
  trustProfile,
  initialRetentionPeriod = "indefinite",
}: ConversationHeaderBarProps) => {
  const [retentionPeriod, setRetentionPeriod] = useState<RetentionPeriod>(initialRetentionPeriod);
  const [saving, setSaving] = useState(false);
  const [verifyDrawerOpen, setVerifyDrawerOpen] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [rotateMessage, setRotateMessage] = useState<string | null>(null);

  const showVerification = trustProfile === "private" || trustProfile === "ephemeral";
  const { verificationStatus } = useConversationDevices(slug, showVerification);

  const handleRotateKey = async () => {
    setRotating(true);
    setRotateMessage(null);
    try {
      const { version } = await rotateConversationKey(slug);
      setRotateMessage(`Rotated to key v${version}. Devices you didn't include must reopen the chat to pick it up.`);
    } catch (err) {
      console.error("Failed to rotate conversation key", err);
      setRotateMessage("Rotation failed — see console for details.");
    } finally {
      setRotating(false);
    }
  };

  const handleRetentionChange = async (value: RetentionPeriod) => {
    setRetentionPeriod(value);
    setSaving(true);
    try {
      await axiosInstance.patch(`/api/chat/conversations/${slug}/retention`, {
        retention_period: value,
        enforcement_enabled: value !== "indefinite",
      });
    } catch (err) {
      console.error("Failed to save retention policy", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex
      className="chb-root"
      justify="space-between"
      align="center"
      direction={["column", "row"]}
      gap={[2, 0]}
    >
      <Flex align="center" gap="2" className="chb-title-row">
        <Text fontSize={["md", "lg"]} fontWeight="bold" color="text.primary">
          Chat: {title}
        </Text>
        <Badge
          className="chb-trust-badge"
          colorPalette={TRUST_COLORS[trustProfile]}
          variant="subtle"
          fontSize="xs"
        >
          {TRUST_LABELS[trustProfile]}
        </Badge>
        {showVerification && (
          <Badge
            className="chb-verification-badge"
            as="button"
            colorPalette={VERIFICATION_COLORS[verificationStatus]}
            variant="subtle"
            fontSize="xs"
            cursor="pointer"
            onClick={() => setVerifyDrawerOpen(true)}
            display="inline-flex"
            alignItems="center"
            gap="1"
            aria-label="Manage device verification"
          >
            {VERIFICATION_ICONS[verificationStatus]}
            {VERIFICATION_LABELS[verificationStatus]}
          </Badge>
        )}
      </Flex>

      <Popover.Root>
        <Popover.Trigger asChild>
          <Button
            className="chb-settings-trigger"
            variant="ghost"
            size="sm"
            aria-label="Conversation settings"
          >
            <IconSettings size={16} />
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content className="chb-settings-popover" w="240px">
              <Popover.Arrow />
              <Popover.Body>
                <Stack gap="3">
                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color="text.muted" mb="1">
                      CONVERSATION TYPE
                    </Text>
                    <Text fontSize="sm" color="text.primary">
                      {TRUST_LABELS[trustProfile]}
                      {trustProfile !== "standard" && (
                        <Text as="span" fontSize="xs" color="text.muted" ml="1">
                          (set at creation)
                        </Text>
                      )}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color="text.muted" mb="2">
                      MESSAGE RETENTION
                    </Text>
                    <RadioGroup.Root
                      value={retentionPeriod}
                      onValueChange={(details) => handleRetentionChange(details.value as RetentionPeriod)}
                      disabled={saving}
                    >
                      <Stack gap="1">
                        {RETENTION_OPTIONS.map((opt) => (
                          <RadioGroup.Item key={opt.value} value={opt.value}>
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemControl />
                            <RadioGroup.ItemText fontSize="sm">
                              {opt.label}
                            </RadioGroup.ItemText>
                          </RadioGroup.Item>
                        ))}
                      </Stack>
                    </RadioGroup.Root>
                  </Box>

                  {showVerification && (
                    <Box>
                      <Text fontSize="xs" fontWeight="semibold" color="text.muted" mb="2">
                        ENCRYPTION KEY
                      </Text>
                      <Button
                        className="chb-rotate-key"
                        size="xs"
                        variant="outline"
                        loading={rotating}
                        onClick={handleRotateKey}
                      >
                        Rotate encryption key
                      </Button>
                      {rotateMessage && (
                        <Text fontSize="xs" color="text.muted" mt="1">
                          {rotateMessage}
                        </Text>
                      )}
                    </Box>
                  )}
                </Stack>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>

      {showVerification && (
        <Drawer.Root
          open={verifyDrawerOpen}
          onOpenChange={(e) => setVerifyDrawerOpen(e.open)}
          placement="end"
          size="sm"
        >
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content className="chb-verify-drawer">
              <Drawer.CloseTrigger />
              <Drawer.Header>
                <Drawer.Title>Device Verification</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <Text fontSize="sm" color="text.muted" mb="4">
                  Verify each participant&apos;s device fingerprint out-of-band
                  (in person or over a trusted channel) before marking it as
                  verified. Verification is recorded for this conversation.
                </Text>
                <DeviceVerificationPanel slug={slug} trustProfile={trustProfile} />
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Drawer.Root>
      )}
    </Flex>
  );
};
