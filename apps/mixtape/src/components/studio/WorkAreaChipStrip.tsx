"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useRouter } from "next/navigation";

export interface WorkAreaChip {
  label: string;
  href?: string;
  active?: boolean;
}

interface WorkAreaChipStripProps {
  chips: WorkAreaChip[];
}

export function WorkAreaChipStrip({ chips }: WorkAreaChipStripProps) {
  const router = useRouter();
  const chipBg = useColorModeValue("gray.100", "gray.700");
  const chipActiveBg = useColorModeValue("blue.50", "blue.900");
  const chipActiveColor = useColorModeValue("blue.700", "blue.200");

  if (chips.length === 0) return null;

  return (
    <HStack mb={6} gap={2} flexWrap="wrap">
      {chips.map((chip) => (
        <Box
          key={chip.label}
          bg={chip.active ? chipActiveBg : chipBg}
          color={chip.active ? chipActiveColor : undefined}
          borderRadius="full"
          px={3}
          py={1}
          cursor={chip.href ? "pointer" : "default"}
          _hover={chip.href ? { opacity: 0.8 } : undefined}
          onClick={chip.href ? () => router.push(chip.href!) : undefined}
        >
          <Text fontSize="xs" fontWeight="medium">{chip.label}</Text>
        </Box>
      ))}
    </HStack>
  );
}
