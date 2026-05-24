"use client";

import { Button, HStack, Text, type StackProps } from "@chakra-ui/react";

export type GroupLayoutVariant = "a" | "b";

interface GroupLayoutSwitcherProps extends StackProps {
  currentLayout: GroupLayoutVariant;
  onLayoutChange: (layout: GroupLayoutVariant) => void;
}

export function GroupLayoutSwitcher({
  currentLayout,
  onLayoutChange,
  ...stackProps
}: GroupLayoutSwitcherProps) {
  return (
    <HStack
      justify="flex-end"
      gap={2}
      p={1}
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="full"
      bg="theme.surface"
      w="fit-content"
      ml="auto"
      {...stackProps}
    >
      <Text
        px={3}
        fontSize="xs"
        fontFamily="mono"
        letterSpacing="0.08em"
        textTransform="uppercase"
        color="theme.textSecondary"
      >
        Layout
      </Text>
      <Button
        size="xs"
        borderRadius="full"
        variant={currentLayout === "a" ? "solid" : "ghost"}
        onClick={() => onLayoutChange("a")}
      >
        A
      </Button>
      <Button
        size="xs"
        borderRadius="full"
        variant={currentLayout === "b" ? "solid" : "ghost"}
        onClick={() => onLayoutChange("b")}
      >
        B
      </Button>
    </HStack>
  );
}
