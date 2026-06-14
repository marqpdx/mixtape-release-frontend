"use client";

import { ControlBar } from "@livekit/components-react";
import { Box } from "@chakra-ui/react";

export function BridgeControls() {
  return (
    <Box className="bridge-controls" bg="gray.800" borderTop="1px solid" borderColor="gray.700" p={2}>
      <ControlBar variation="minimal" />
    </Box>
  );
}
