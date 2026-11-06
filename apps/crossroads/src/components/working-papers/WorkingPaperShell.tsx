// apps/crossroads/src/components/working-papers/WorkingPaperShell.tsx
//
// Frame for the Working Papers pages: navbar, a narrow reading column, and a
// trail back up through the three layers (packet → TL;DR → paper).

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, Container, HStack, Text } from "@chakra-ui/react";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";

export type Crumb = { label: string; href?: string };

export function WorkingPaperShell({ crumbs, children }: { crumbs: Crumb[]; children: ReactNode }) {
  return (
    <>
      <UnifiedNavbar extraCompact />
      <Box as="main" py={{ base: 10, md: 16 }}>
        <Container maxW="3xl" px={{ base: 4, md: 6 }}>
          <HStack as="nav" aria-label="Breadcrumb" gap={2} mb={8} flexWrap="wrap" fontSize="sm" color="fg.muted">
            {crumbs.map((crumb, i) => (
              <HStack key={crumb.label} gap={2}>
                {i > 0 && <Text aria-hidden="true">/</Text>}
                {crumb.href ? (
                  <Link href={crumb.href} style={{ textDecoration: "underline" }}>
                    {crumb.label}
                  </Link>
                ) : (
                  <Text aria-current="page">{crumb.label}</Text>
                )}
              </HStack>
            ))}
          </HStack>
          {children}
        </Container>
      </Box>
    </>
  );
}

export function PaperStamp({ version, date }: { version?: string; date?: string }) {
  const parts = [version && `Version ${version}`, date].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <Text fontSize="sm" color="fg.muted">
      Working paper · {parts.join(" · ")}
    </Text>
  );
}
