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
} from "@chakra-ui/react";
import { IconSettings } from "@tabler/icons-react";
import { useState } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
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

export const ConversationHeaderBar = ({
  slug,
  title,
  trustProfile,
  initialRetentionPeriod = "indefinite",
}: ConversationHeaderBarProps) => {
  const [retentionPeriod, setRetentionPeriod] = useState<RetentionPeriod>(initialRetentionPeriod);
  const [saving, setSaving] = useState(false);

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
                </Stack>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Flex>
  );
};
