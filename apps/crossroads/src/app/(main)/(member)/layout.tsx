"use client";

import { Box } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import dynamic from "next/dynamic";

const UnifiedNavbar = dynamic(() => import("@components/layout/UnifiedNavbar"), {
  ssr: false,
});

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bgColor = useColorModeValue("white", "gray.900");

  return (
    <Box minH="100%" bg={bgColor}>
      <UnifiedNavbar extraCompact />
      <Box w="full" maxW="none">
        {children}
      </Box>
    </Box>
  );
}
