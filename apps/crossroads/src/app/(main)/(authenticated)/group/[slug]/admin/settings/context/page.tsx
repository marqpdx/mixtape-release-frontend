"use client";

import { useParams } from "next/navigation";
import { Box, HStack, Link as ChakraLink } from "@chakra-ui/react";
import NextLink from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { GroupContextEditor } from "@components/crossroads/GroupContextEditor";

export default function GroupContextPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading || !isAuthenticated) return null;

  return (
    <Box maxW="3xl" mx="auto" px="6" py="10">
      <HStack mb="6" justify="flex-end">
        <ChakraLink asChild fontSize="sm" color="blue.500">
          <NextLink href={`/group/${slug}/admin/settings`}>← Settings</NextLink>
        </ChakraLink>
      </HStack>
      <GroupContextEditor slug={slug} />
    </Box>
  );
}
