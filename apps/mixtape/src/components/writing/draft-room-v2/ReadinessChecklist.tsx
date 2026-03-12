// components/writing/draft-room-v2/ReadinessChecklist.tsx

"use client";

import { Box, HStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { Tooltip } from "@components/ui/tooltip";

interface ReadinessItem {
  label: string;
  isReady: boolean;
  isOptional?: boolean; // yellow when missing instead of orange
  noneOk?: boolean; // overrides to green when checked
}

interface ReadinessChecklistProps {
  items: ReadinessItem[];
}

export function ReadinessChecklist({ items }: ReadinessChecklistProps) {
  return (
    <HStack gap={1.5} flexWrap="wrap">
      {items.map((item) => (
        <ReadinessDot key={item.label} item={item} />
      ))}
    </HStack>
  );
}

function ReadinessDot({ item }: { item: ReadinessItem }) {
  const green = useColorModeValue("green.400", "green.500");
  const yellow = useColorModeValue("yellow.400", "yellow.500");
  const gray = useColorModeValue("gray.300", "gray.600");

  const isGreen = item.isReady || item.noneOk;
  const color = isGreen ? green : item.isOptional ? yellow : gray;

  return (
    <Tooltip content={`${item.label}: ${isGreen ? "ready" : "not set"}`}>
      <Box
        w="8px"
        h="8px"
        borderRadius="full"
        bg={color}
        transition="background 0.2s"
      />
    </Tooltip>
  );
}

/**
 * Compact readiness dots for use in the draft queue list items
 */
export function ReadinessDotsCompact({
  title,
  hasBody,
  audience,
  tagsCount,
  categoriesCount,
  noneOkTags,
  noneOkCategories,
}: {
  title?: string;
  hasBody?: boolean;
  audience?: string;
  tagsCount?: number;
  categoriesCount?: number;
  noneOkTags?: boolean;
  noneOkCategories?: boolean;
}) {
  const items: ReadinessItem[] = [
    { label: "Title", isReady: Boolean(title?.trim()) },
    { label: "Body", isReady: Boolean(hasBody) },
    { label: "Audience", isReady: Boolean(audience?.trim()), isOptional: true },
    { label: "Tags", isReady: (tagsCount ?? 0) > 0, isOptional: true, noneOk: noneOkTags },
    { label: "Categories", isReady: (categoriesCount ?? 0) > 0, isOptional: true, noneOk: noneOkCategories },
  ];

  return <ReadinessChecklist items={items} />;
}
