// apps/mixtape/src/components/admin/AdminNavSwitcher.tsx
//
// Shared switcher between the three top-level admin surfaces. Each page
// (Admin, Sysadmin, Puddlejump) renders this at the same spot so it's
// always obvious how to get to the other two.

"use client";

import { HStack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

export type AdminSurface = "admin" | "sysadmin" | "puddlejump";

const SURFACES: Array<{ id: AdminSurface; label: string; href: string }> = [
  { id: "admin", label: "Admin", href: "/admin" },
  { id: "sysadmin", label: "Sysadmin", href: "/admin/sysadmin" },
  { id: "puddlejump", label: "Puddlejump", href: "/admin/puddlejump" },
];

interface AdminNavSwitcherProps {
  active: AdminSurface;
}

export default function AdminNavSwitcher({ active }: AdminNavSwitcherProps) {
  return (
    <HStack
      gap={1}
      p={1}
      bg="theme.bgSubtle"
      borderRadius="md"
      display="inline-flex"
      mb={4}
    >
      {SURFACES.map((surface) => {
        const isActive = surface.id === active;
        return (
          <NextLink key={surface.id} href={surface.href} legacyBehavior passHref>
            <Text
              as="a"
              px={3}
              py={1.5}
              fontSize="sm"
              fontWeight={isActive ? "semibold" : "medium"}
              borderRadius="sm"
              bg={isActive ? "theme.surface" : "transparent"}
              color={isActive ? "theme.text" : "theme.textSecondary"}
              boxShadow={isActive ? "sm" : "none"}
              _hover={isActive ? undefined : { color: "theme.text" }}
              transition="all 0.15s"
            >
              {surface.label}
            </Text>
          </NextLink>
        );
      })}
    </HStack>
  );
}
