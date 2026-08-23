"use client";

import { Button, Flex, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { AtriumDialMode } from "@mixtape/core/types/atriumTypes";

const ANCHORS: { mode: AtriumDialMode; label: string; hint: string }[] = [
  { mode: "very_focused", label: "Very Focused", hint: "Narrows toward a named output" },
  { mode: "expressive",   label: "Expressive",   hint: "Claude stays in background; you lead" },
  { mode: "vague",        label: "Vague",         hint: "More guidance, sideways invitations" },
];

interface AtriumDialProps {
  value: AtriumDialMode;
  onChange: (mode: AtriumDialMode) => void;
  disabled?: boolean;
}

export function AtriumDial({ value, onChange, disabled }: AtriumDialProps) {
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const activeScheme = "blue";

  return (
    <Flex className="adial-root" align="center" gap={2} flexWrap="wrap">
      <Text fontSize="xs" color={labelColor} flexShrink={0}>
        Dial:
      </Text>
      {ANCHORS.map(({ mode, label, hint }) => {
        const isActive = value === mode;
        return (
          <Button
            key={mode}
            size="xs"
            variant={isActive ? "solid" : "outline"}
            colorScheme={isActive ? activeScheme : "gray"}
            onClick={() => !disabled && onChange(mode)}
            aria-pressed={isActive}
            title={hint}
            disabled={disabled}
            flexShrink={0}
          >
            {label}
          </Button>
        );
      })}
    </Flex>
  );
}
