"use client";

import { Button, HStack, Text, type StackProps } from "@chakra-ui/react";
import {
  GROUP_MEMBER_VIEW_DEFINITIONS,
  type GroupMemberViewId,
} from "./member-views/registry";

export type GroupLayoutVariant = GroupMemberViewId;

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
      {GROUP_MEMBER_VIEW_DEFINITIONS.map((view) => (
        <Button
          key={view.id}
          size="xs"
          borderRadius="full"
          variant={currentLayout === view.id ? "solid" : "ghost"}
          onClick={() => onLayoutChange(view.id)}
          title={view.description}
        >
          {view.label}
        </Button>
      ))}
    </HStack>
  );
}
