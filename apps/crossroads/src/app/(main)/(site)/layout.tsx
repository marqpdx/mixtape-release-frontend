// src/app/(root)/(site)/layout.tsx - Updated with extraCompact navbar

"use client";

import { Box } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import dynamic from "next/dynamic";
// import { usePermissions } from "@mixtape/auth/usePermissions";
// import AdminTodoButtonWithModal from "@/components/admin/AdminTodoButtonWithModal";

// Dynamically import UnifiedNavbar to avoid SSR/prerendering issues with useAuth
const UnifiedNavbar = dynamic(() => import("@components/layout/UnifiedNavbar"), {
  ssr: false,
});

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bgColor = useColorModeValue("white", "gray.900");
  // const { isAdmin } = usePermissions();

  return (
    <Box minH="100%" bg={bgColor}>
      {/* ✅ EXTRA COMPACT: Much smaller navbar for about pages */}
      <UnifiedNavbar extraCompact section="public" />

      {/* Main Content - Full Width, No Constraints, No Top Padding */}
      <Box w="full" maxW="none">
        {children}
      </Box>

      {/* Admin Tools */}
      {/* <AdminTodoButtonWithModal isAdmin={isAdmin} /> */}
    </Box>
  );
}
