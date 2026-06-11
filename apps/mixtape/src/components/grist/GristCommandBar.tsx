"use client";

import { Flex, Input, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useColorModeValue } from "@components/ui/color-mode";

interface GristCommandBarProps {
  onCommand?: (cmd: string, args: string) => void;
}

export function GristCommandBar({ onCommand }: GristCommandBarProps) {
  const [value, setValue] = useState("");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("white", "gray.800");
  const mutedColor = useColorModeValue("gray.400", "gray.500");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("/") && onCommand) {
      const parts = trimmed.slice(1).split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1).join(" ");
      onCommand(cmd, args);
    }
    setValue("");
  };

  return (
    <Flex
      as="form"
      onSubmit={handleSubmit}
      align="center"
      gap={2}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      py={3}
      px={4}
    >
      <Text fontSize="sm" color={mutedColor} flexShrink={0} userSelect="none">
        /
      </Text>

      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Try /log, /event, /draft…"
        variant="flushed"
        fontSize="sm"
        flex="1"
      />

      <Text fontSize="xs" color={mutedColor} flexShrink={0} userSelect="none">
        ⌘K
      </Text>
    </Flex>
  );
}
