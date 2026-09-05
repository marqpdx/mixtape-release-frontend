"use client";

import { use } from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { GroupSurfaceShell } from "@components/surfaces/GroupSurfaceShell";

export default function GroupReceptionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, isLoading } = useAuth();

  const bg = useColorModeValue("gray.50", "gray.900");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  if (isLoading) {
    return (
      <Box className="rec-loading" minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bg}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!user?.is_superuser) {
    return (
      <Box className="rec-gate" minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bg}>
        <Text color={mutedText} fontSize="sm">
          Reception is not available yet.
        </Text>
      </Box>
    );
  }

  return (
    <GroupSurfaceShell groupSlug={slug} currentSurface="reception">
      <Box className="rec-root" px={{ base: 6, md: 10 }} py={8}>
        <Text
          className="rec-surface-label"
          fontSize="xs"
          fontWeight="600"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color={mutedText}
          mb={4}
        >
          Reception · {slug}
        </Text>
        <Text fontSize="sm" color={mutedText}>
          Surface scaffold — pilot in progress.
        </Text>
      </Box>
    </GroupSurfaceShell>
  );
}
