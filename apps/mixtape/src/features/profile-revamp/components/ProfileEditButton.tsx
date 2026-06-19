"use client";

import NextLink from "next/link";
import { Button } from "@chakra-ui/react";
import { IconEdit } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth/AuthContext";

export function ProfileEditButton({ username }: { username: string }) {
  const { user } = useAuth();
  if (!user || user.username !== username) return null;

  return (
    <Button size="sm" variant="outline" asChild>
      <NextLink href="/dashboard?section=edit-profile">
        <IconEdit size={14} />
        Edit Profile
      </NextLink>
    </Button>
  );
}
