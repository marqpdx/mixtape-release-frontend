"use client";

import { use } from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { GroupSurfaceShell } from "@components/surfaces/GroupSurfaceShell";
import { WorkshopSurface, WorkshopClioPanel } from "@components/surfaces/WorkshopSurface";

export default function GroupWorkshopPage({
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
      <Box className="wks-loading" minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bg}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!user?.is_superuser) {
    return (
      <Box className="wks-gate" minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bg}>
        <Text color={mutedText} fontSize="sm">
          Home Workshop is not available yet.
        </Text>
      </Box>
    );
  }

  return (
    <GroupSurfaceShell
      groupSlug={slug}
      currentSurface="workshop"
      rightPanel={<WorkshopClioPanel />}
    >
      <WorkshopSurface groupSlug={slug} />
    </GroupSurfaceShell>
  );
}
