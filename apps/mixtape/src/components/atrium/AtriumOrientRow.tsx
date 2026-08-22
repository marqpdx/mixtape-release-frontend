"use client";

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { IconX } from "@tabler/icons-react";
import { useState } from "react";
import { useColorModeValue } from "@components/ui/color-mode";

type OutputType = "note" | "draft" | "plan" | "document" | "decision";

const OUTPUT_TYPES: { value: OutputType; label: string }[] = [
  { value: "note",      label: "Note" },
  { value: "draft",     label: "Draft" },
  { value: "plan",      label: "Plan" },
  { value: "document",  label: "Document" },
  { value: "decision",  label: "Decision" },
];

const PROMOTION_PATHS: Record<OutputType, string> = {
  note:      "→ Workbench draft",
  draft:     "→ Workbench draft",
  plan:      "→ Puddlejump plan",
  document:  "→ Puddlejump doc",
  decision:  "→ Puddlejump ADR",
};

interface AtriumOrientRowProps {
  onDismiss: () => void;
}

export function AtriumOrientRow({ onDismiss }: AtriumOrientRowProps) {
  const [selected, setSelected] = useState<OutputType | null>(null);
  const borderColor = useColorModeValue("blue.100", "blue.800");
  const bgColor = useColorModeValue("blue.50", "blue.950");
  const labelColor = useColorModeValue("gray.600", "gray.300");
  const pathColor = useColorModeValue("blue.600", "blue.300");
  const dismissColor = useColorModeValue("gray.400", "gray.500");

  function handleSelect(type: OutputType) {
    setSelected(type);
  }

  function handleConfirm() {
    onDismiss();
  }

  return (
    <Box
      className="aorient-root"
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      px={3}
      py={2}
    >
      <Flex align="center" gap={2} flexWrap="wrap">
        <Text fontSize="xs" color={labelColor} flexShrink={0}>
          Target output:
        </Text>
        <Flex gap={1} flexWrap="wrap" flex="1">
          {OUTPUT_TYPES.map(({ value, label }) => (
            <Button
              key={value}
              size="2xs"
              variant={selected === value ? "solid" : "outline"}
              colorScheme={selected === value ? "blue" : "gray"}
              onClick={() => handleSelect(value)}
              flexShrink={0}
            >
              {label}
            </Button>
          ))}
        </Flex>
        {selected && (
          <>
            <Text fontSize="xs" color={pathColor} flexShrink={0}>
              {PROMOTION_PATHS[selected]}
            </Text>
            <Button
              size="2xs"
              variant="ghost"
              colorScheme="blue"
              onClick={handleConfirm}
              flexShrink={0}
            >
              Set
            </Button>
          </>
        )}
        <Box
          as="button"
          onClick={onDismiss}
          color={dismissColor}
          flexShrink={0}
          ml="auto"
          _hover={{ color: "gray.600" }}
        >
          <IconX size={12} />
        </Box>
      </Flex>
    </Box>
  );
}
