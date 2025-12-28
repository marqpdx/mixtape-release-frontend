// src/components/common/Divider.tsx

"use client";

import { Box } from "@chakra-ui/react";

interface DividerProps {
  my?: number;          // integer (or number) spacing
  borderColor?: string;
}

export const Divider = ({ my = 4, borderColor = "gray.200" }: DividerProps) => {
  return (
    <Box
      borderBottom="1px solid"
      borderColor={borderColor}
      my={my}
      w="100%"
    />
  );
};
