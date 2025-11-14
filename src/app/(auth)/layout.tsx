// /src/app/(auth)/layout.tsx

"use client";

import { Box } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

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
  const bgColor = useColorModeValue("background.light", "background.dark");
  const textColor = useColorModeValue("text.light", "text.dark");

  return (
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
      <Box pt={10} maxW={'5xl'} mx={'auto'}>
        {children}
      </Box>
    </Box>
  );
}
