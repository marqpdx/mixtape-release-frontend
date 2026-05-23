// apps/crossroads/src/app/(main)/(content)/about/how-it-works/page.tsx

"use client";

import { Box, Heading, HStack, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import HowItWorksContent from "@/content/HowItWorksContent";

export default function HowItWorksPage() {
  return (
    <>
      <UnifiedNavbar extraCompact />
      <Box maxW="900px" mx="auto" py={{ base: 10, md: 16 }} px={{ base: 5, md: 8 }}>
        <HStack gap={4} mb={{ base: 6, md: 8 }}>
          <Link as={NextLink} href="/" textDecoration="underline">
            Home
          </Link>
          <Link as={NextLink} href="/about" textDecoration="underline">
            About
          </Link>
        </HStack>

        <Heading as="h1" size="xl" mb={{ base: 6, md: 8 }}>
          How Crossroads Works
        </Heading>

        <HowItWorksContent />
      </Box>
    </>
  );
}
