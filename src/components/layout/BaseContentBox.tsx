// src/components/layout/BaseContentBox.tsx
// Shared layout component to eliminate duplication across layouts

"use client";

import { Box } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { ReactNode } from "react";

interface BaseContentBoxProps {
  children: ReactNode;
  /**
   * Maximum width for content container
   * @default "100%"
   */
  maxW?: string;
  /**
   * Minimum height
   * @default "100vh"
   */
  minH?: string;
  /**
   * Additional padding top
   * @default 0
   */
  pt?: number;
}

/**
 * BaseContentBox - Reusable layout wrapper with color mode support
 *
 * Provides consistent background and text colors across all layouts.
 * Use this instead of duplicating Box + useColorModeValue in every layout.
 *
 * @example
 * ```tsx
 * <BaseContentBox>
 *   {children}
 * </BaseContentBox>
 * ```
 */
export function BaseContentBox({
  children,
  maxW = "100%",
  minH = "100vh",
  pt = 0,
}: BaseContentBoxProps) {
  const bgColor = useColorModeValue("background.light", "background.dark");
  const textColor = useColorModeValue("text.light", "text.dark");

  return (
    <Box
      textStyle="body"
      minH={minH}
      my={0}
      p={0}
      pt={pt}
      maxW={maxW}
      mx="auto"
      bg={bgColor}
      color={textColor}
    >
      {children}
    </Box>
  );
}
