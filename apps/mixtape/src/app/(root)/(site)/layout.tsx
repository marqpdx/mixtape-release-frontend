// src/app/(root)/(site)/layout.tsx - Updated with extraCompact navbar

"use client";

import { Box } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import Footer from "@components/layout/Footer";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import { usePermissions } from "@mixtape/auth/usePermissions";
import { useAuth } from "@/lib/auth/AuthContext";
// import AdminTodoButtonWithModal from "@/components/admin/AdminTodoButtonWithModal";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bgColor = useColorModeValue("white", "gray.900");
  const { user, can, canInGroup } = useAuth();
  const { isAdmin } = usePermissions({ user, can, canInGroup });

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
      {/* <AdminTodoButtonWithModal isAdmin={isAdmin} /> */}
    </Box>
  );
}