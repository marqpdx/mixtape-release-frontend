// src/components/common/Divider.tsx

"use client";

import { Box } from "@chakra-ui/react";

export const Divider = ({ my = 4, borderColor = "gray.200" }) => (
  <Box borderBottom="1px solid" borderColor={borderColor} my={my} w="100%" />
);
