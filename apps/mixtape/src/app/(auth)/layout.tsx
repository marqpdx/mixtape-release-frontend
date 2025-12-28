// /src/app/(auth)/layout.tsx

"use client";

import { Box } from "@chakra-ui/react";
import { BaseContentBox } from "@/components/layout/BaseContentBox";

/**
 * Auth Layout
 *
 * Used for public authentication pages (/login, /signup, /forgot-password).
 * Does NOT fetch user identity since users on these pages are not authenticated.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BaseContentBox pt={10}>
      <Box maxW="5xl" mx="auto">
        {children}
      </Box>
    </BaseContentBox>
  );
}
