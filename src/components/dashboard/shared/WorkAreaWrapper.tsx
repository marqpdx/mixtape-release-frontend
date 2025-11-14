// src/components/dashboard/shared/WorkAreaWrapper.tsx

import React from "react";
import { Box } from "@chakra-ui/react";

interface WorkAreaWrapperProps {
  children: React.ReactNode;
  maxWidth?: string;
  padding?: number | string;
}

export function WorkAreaWrapper({
  children,
  maxWidth = "none",
  padding = 4
}: WorkAreaWrapperProps) {
  return (
    <Box className="work-area-wrapper"
      px={padding}
      py={2}
      maxWidth={maxWidth}
      w="100%"
    >
      {children}
    </Box>
  );
}

export default WorkAreaWrapper;