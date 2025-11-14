// /src/app/(root)/layout.tsx

"use client";

import { Box } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
// import AdminTodoButtonWithModal from "@components/admin-apps/AdminTodoButtonWithModal";
import { usePermissions } from "@lib/auth/usePermissions";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bgColor = useColorModeValue("background.light", "background.dark");
  const textColor = useColorModeValue("text.light", "text.dark");
  const { isAdmin } = usePermissions();

  return (
    <>
      <Box
        textStyle={'body'}
        minH={'100vh'}
        my={0}
        p={0}
        maxW="100%"
        mx={'auto'}
        bg={bgColor}
        color={textColor}
      >
        {children}
      </Box>
      {/* <AdminTodoButtonWithModal isAdmin={isAdmin} /> */}
    </>
  );
}
