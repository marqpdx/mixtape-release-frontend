"use client";

import { Button } from "@chakra-ui/react";
import { useHelp } from "./useHelp";

export function HelpButton() {
  const { openDrawer } = useHelp();

  return (
    <Button
      position="fixed"
      right={{ base: 4, md: 6 }}
      bottom={{ base: 4, md: 6 }}
      zIndex={1400}
      borderRadius="full"
      boxShadow="lg"
      size="sm"
      onClick={() => openDrawer()}
    >
      Help
    </Button>
  );
}
