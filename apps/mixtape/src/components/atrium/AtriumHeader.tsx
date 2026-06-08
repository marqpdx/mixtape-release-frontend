"use client";

import { Avatar, Flex, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useColorModeValue } from "@components/ui/color-mode";

export function AtriumHeader() {
  const { user: identity } = useAuth();
  const borderColor = useColorModeValue("gray.100", "gray.800");

  const avatarUrl = identity?.profile?.avatar_url?.trim() || undefined;
  const initials = (identity?.username || identity?.email || "?")[0].toUpperCase();

  return (
    <Flex
      h="56px"
      align="center"
      justify="space-between"
      borderBottomWidth="1px"
      borderColor={borderColor}
    >
      {/* Left — Atrium identity marker */}
      <Text fontSize="sm" fontWeight="medium" letterSpacing="wide" color="gray.500">
        Atrium
      </Text>

      {/* Right — user avatar linking to profile */}
      <NextLink href={identity?.username ? `/member/${identity.username}` : "/settings"}>
        <Avatar.Root size="sm" cursor="pointer">
          <Avatar.Fallback>{initials}</Avatar.Fallback>
          {avatarUrl && <Avatar.Image src={avatarUrl} alt={identity?.username || "avatar"} />}
        </Avatar.Root>
      </NextLink>
    </Flex>
  );
}
