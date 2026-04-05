"use client";

import { Button, Link, Popover, Stack, Text } from "@chakra-ui/react";
import { useHelp } from "./useHelp";

interface HelpTipProps {
  helpKey: string;
  label?: string;
}

export function HelpTip({ helpKey, label = "?" }: HelpTipProps) {
  const { resolveHelp, openDrawer } = useHelp();
  const resolved = resolveHelp(helpKey);
  const entry = resolved?.entries[0] ?? null;

  if (!entry) return null;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button size="xs" variant="outline" borderRadius="full" minW="28px" h="28px" px={0}>
          {label}
        </Button>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content borderRadius="lg" p={4} maxW="320px">
          <Stack gap={3}>
            <Text fontWeight="semibold">{entry.title}</Text>
            <Text fontSize="sm" color="fg.muted">
              {entry.excerpt}
            </Text>
            <Link
              role="button"
              color="fg"
              textDecoration="underline"
              textUnderlineOffset="3px"
              onClick={() => openDrawer(helpKey)}
            >
              Read more
            </Link>
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}
