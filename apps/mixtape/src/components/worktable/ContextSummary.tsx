"use client";

// ContextSummary — shows pending open-capture counts for the active context.
// Renders as a "system entry" in the stream column; counts are clickable stubs.

import { Box, HStack, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useHubCaptures } from "@mixtape/api/hooks/console/useConsole";
import type { WorkTableContext } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function plural(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}

function wordNum(n: number): string {
  const words = ["zero","one","two","three","four","five","six","seven","eight","nine","ten"];
  return words[n] ?? String(n);
}

// ---------------------------------------------------------------------------
// Clickable count fragment
// ---------------------------------------------------------------------------

function CountLink({
  count,
  label,
  onClick,
}: {
  count: number;
  label: string;
  onClick?: () => void;
}) {
  const linkColor = useColorModeValue("blue.600", "blue.300");
  return (
    <Box
      as="span"
      color={linkColor}
      fontWeight="600"
      cursor={onClick ? "pointer" : "default"}
      _hover={onClick ? { textDecoration: "underline" } : {}}
      onClick={onClick}
    >
      {wordNum(count)} {label}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ContextSummary({ context }: { context: WorkTableContext }) {
  const groupSlug = context.kind === "group" ? context.slug : undefined;

  const { data: needData, isLoading: needLoading } = useHubCaptures("need_more", groupSlug);
  const { data: remindData, isLoading: remindLoading } = useHubCaptures("remind", groupSlug);
  const { data: fixData, isLoading: fixLoading } = useHubCaptures("fix", groupSlug);

  const cardBg = useColorModeValue("gray.50", "gray.850");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.700", "gray.200");

  const isLoading = needLoading || remindLoading || fixLoading;

  const needCount = needData?.captures.length ?? 0;
  const remindCount = remindData?.captures.length ?? 0;
  const fixCount = fixData?.captures.length ?? 0;
  const total = needCount + remindCount + fixCount;

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        px={4}
        py={3}
        mb={3}
      >
        <Text fontSize="sm" color={mutedColor}>Loading activity summary…</Text>
      </Box>
    );
  }

  const contextLabel =
    context.kind === "group"
      ? `in ${context.title}`
      : "across your personal workspace";

  if (total === 0) {
    return (
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        px={4}
        py={3}
        mb={3}
      >
        <Text fontSize="sm" color={mutedColor}>
          Nothing pending {contextLabel}. Clean slate.
        </Text>
      </Box>
    );
  }

  // Build sentence fragments for non-zero kinds
  const fragments: React.ReactNode[] = [];

  if (needCount > 0) {
    fragments.push(
      <CountLink
        key="need"
        count={needCount}
        label={plural(needCount, "item needed", "items needed")}
      />
    );
  }
  if (remindCount > 0) {
    fragments.push(
      <CountLink
        key="remind"
        count={remindCount}
        label={plural(remindCount, "reminder pending", "reminders pending")}
      />
    );
  }
  if (fixCount > 0) {
    fragments.push(
      <CountLink
        key="fix"
        count={fixCount}
        label={plural(fixCount, "fix pending", "fixes pending")}
      />
    );
  }

  // Join with commas and "and"
  const joined = fragments.reduce<React.ReactNode[]>((acc, frag, i) => {
    if (i === 0) return [frag];
    const isLast = i === fragments.length - 1;
    return [...acc, isLast && fragments.length > 1 ? <span key={`sep-${i}`}>, and </span> : <span key={`sep-${i}`}>, </span>, frag];
  }, []);

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      px={4}
      py={3}
      mb={3}
    >
      <HStack gap={1} flexWrap="wrap">
        <Text fontSize="sm" color={textColor} as="span">
          You have{" "}
          {joined}
          {" "}{contextLabel}.
        </Text>
      </HStack>
    </Box>
  );
}
