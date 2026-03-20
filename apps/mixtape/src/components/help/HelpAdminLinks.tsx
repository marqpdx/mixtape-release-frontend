"use client";

import NextLink from "next/link";
import { HStack, Link } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";

export function HelpAdminLinks() {
  const { user } = useAuth();
  const isAdmin = !!user?.is_superuser || !!user?.is_staff;

  if (!isAdmin) {
    return null;
  }

  return (
    <HStack gap={4} wrap="wrap">
      <Link asChild color="fg" textDecoration="underline" textUnderlineOffset="3px" fontSize="sm">
        <NextLink href="/help/tech">Technical reference</NextLink>
      </Link>
    </HStack>
  );
}

