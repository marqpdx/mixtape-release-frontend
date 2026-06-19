"use client";

import NextLink from "next/link";
import { Button } from "@chakra-ui/react";
import { IconEdit } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePathname, useSearchParams } from "next/navigation";

export function ProfileEditButton({ username }: { username: string }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (!user || user.username !== username) return null;

  const isEditPage = pathname === "/dashboard" && searchParams.get("section") === "edit-profile";

  if (isEditPage) {
    return (
      <Button size="sm" variant="outline" disabled>
        <IconEdit size={14} />
        Edit Profile
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" asChild>
      <NextLink href="/dashboard?section=edit-profile">
        <IconEdit size={14} />
        Edit Profile
      </NextLink>
    </Button>
  );
}
