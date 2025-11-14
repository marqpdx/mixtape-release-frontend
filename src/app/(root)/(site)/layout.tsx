// src/app/(root)/(site)/layout.tsx - Updated with extraCompact navbar

"use client";

import { Box } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import AdminTodoButtonWithModal from "@components/admin-apps/AdminTodoButtonWithModal";
import Footer from "@components/layout/Footer";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import { usePermissions } from "@lib/auth/usePermissions";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bgColor = useColorModeValue("white", "gray.900");
  const { isAdmin } = usePermissions();

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* ✅ EXTRA COMPACT: Much smaller navbar for about pages */}
      <UnifiedNavbar extraCompact />

      {/* Main Content - Full Width, No Constraints, No Top Padding */}
      <Box w="full" maxW="none">
        {children}
      </Box>

      {/* Footer - Full Width */}
      <Footer />

      {/* Admin Tools */}
      <AdminTodoButtonWithModal isAdmin={isAdmin} />
    </Box>
  );
}