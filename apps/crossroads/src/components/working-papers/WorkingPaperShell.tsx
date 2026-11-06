// apps/crossroads/src/components/working-papers/WorkingPaperShell.tsx
//
// Frame for the Working Papers pages: navbar, a narrow reading column, and a
// trail back up through the three layers (packet → TL;DR → paper).

import type { ReactNode } from "react";
import Link from "next/link";
import { Box, Container, HStack, Text } from "@chakra-ui/react";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import { formatDate } from "@/lib/workingPapers";

export type Crumb = { label: string; href?: string };

// Shown on every Working Papers page (CTO, 2026-11-06); not on public pages.
const NOT_PUBLIC =
  "Not yet a public document. Shared with you, the intended reader, for review; please don't pass it on.";

export function WorkingPaperShell({
  crumbs,
  children,
  notPublic = true,
}: {
  crumbs: Crumb[];
  children: ReactNode;
  notPublic?: boolean;
}) {
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
          {notPublic && (
            <Box role="note" mb={8} px={4} py={3} borderWidth="1px" borderRadius="md" bg="bg.muted" fontSize="sm">
              {NOT_PUBLIC}
            </Box>
          )}
          {children}
        </Container>
      </Box>
    </>
  );
}

export function PaperStamp({ version, date }: { version?: string; date?: string }) {
  const parts = [version && `Version ${version}`, date && formatDate(date)].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <Text fontSize="sm" color="fg.muted">
      Working paper · {parts.join(" · ")}
    </Text>
  );
}
