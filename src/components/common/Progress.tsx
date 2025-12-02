// src/components/common/Progress

"use client";

import {
  Progress as ChakraProgress,
  ProgressRootProps,
  ProgressTrackProps,
  ProgressRangeProps,
  ProgressLabelProps,
  ProgressValueTextProps,
} from "@chakra-ui/react";
import { Box, Text } from "@chakra-ui/react";

interface ProgressProps extends ProgressRootProps {
  value: number;
  size?: "xs" | "sm" | "md" | "lg";
  label?: string;
}

export default function Progress({
  value,
  size = "md",
  label = "Uploading...",
  ...rest
}: ProgressProps) {
  // size → height mapping
  const heightMap: Record<string, string> = {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
  };

  return (
    <ChakraProgress.Root value={value} max={100} w="full" h={heightMap[size]} {...rest}>
      <ChakraProgress.Track>
        <ChakraProgress.Range />
      </ChakraProgress.Track>
      <Box mt={1}>
        <ChakraProgress.Label>{label}</ChakraProgress.Label>
        <ChakraProgress.ValueText />
      </Box>
    </ChakraProgress.Root>
  );
}
