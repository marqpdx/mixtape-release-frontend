// apps/mixtape/src/app/(authenticated)/admin/puddlejump/page.tsx

"use client";

import { useEffect } from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserIdentity } from "@mixtape/core/types/auth";
import AdminNavSwitcher from "@components/admin/AdminNavSwitcher";
import PuddlejumpBigBoard from "@components/dashboard/puddlejump/PuddlejumpBigBoard";

/**
 * PUDDLEJUMP BIG BOARD
 *
 * A knowledge surface reading the sibling puddlejump canon repo directly:
 * an ADR tote board and a Spikes binder, plus a sketch of a deliberately
 * quiet "attend ticker." Superuser-only, like /admin and /admin/sysadmin.
 *
 * Not a sectioned dashboard (no DashboardLayout sidebar) -- the board is a
 * single full-canvas surface, not a set of switchable sections.
 */
export default function PuddlejumpBigBoardPage() {
  const { user, isLoading: identityLoading } = useAuth();
  const identity = user as UserIdentity | null;
  const isSuperuser = !!identity?.is_superuser;

  useEffect(() => {
    if (identity) {
      document.title = "Puddlejump - Mixtape Crossroads";
    }
  }, [identity]);

  if (identityLoading) {
    return <Text>Loading Big Board...</Text>;
  }

  if (!identity) {
    return <Text>Authentication required...</Text>;
  }

  if (!isSuperuser) {
    return <Text>Superuser access required.</Text>;
  }

  return (
    <>
      {/* Unpadded wrapper matches DashboardLayout's own header slot
          (`<Box flexShrink={0}>{header}</Box>`) exactly, so the switcher
          sits at the same position it does on /admin and /admin/sysadmin. */}
      <Box flexShrink={0}>
        <AdminNavSwitcher active="puddlejump" />
      </Box>
      <Box p={{ base: 4, md: 6 }}>
        <Heading as="h1" size="lg" mb={1} color="theme.text">
          Big Board
        </Heading>
        <Text color="theme.textSecondary" mb={4} fontSize="sm">
          Puddlejump knowledge surface — read live from the canon repo.
        </Text>
        <PuddlejumpBigBoard />
      </Box>
    </>
  );
}
