// apps/mixtape/src/app/(authenticated)/ariadne/page.tsx

"use client";

import { useEffect } from "react";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserIdentity } from "@mixtape/core/types/auth";

/**
 * ARIADNE — scaffold (P3, decisions/ariadne/ariadne-build-spec.md §2a)
 *
 * Standalone surface, deliberately not folded into the Puddlejump Surface
 * (/app/puddlejump) even though both are su-only canon-governance tools
 * over the same corpus -- flagged as a likely future refactor, not
 * resolved. Superuser-only, same inline-check convention as
 * /admin/puddlejump (no shared gate COMPONENT exists yet to import; the
 * Puddlejump Surface's own gate is itself still unbuilt per
 * puddlejump-surface-adr-status.md).
 *
 * No Django API to enforce against yet -- P1's corpus connector
 * (mixtape-release-core app/ariadne/corpus.py) isn't exposed through any
 * endpoint. This page is a scaffold only; P4/P5 (schema, Lens/Run
 * mechanics) are what give it something real to render.
 */
export default function AriadnePage() {
  const { user, isLoading: identityLoading } = useAuth();
  const identity = user as UserIdentity | null;
  const isSuperuser = !!identity?.is_superuser;

  useEffect(() => {
    if (identity) {
      document.title = "Ariadne - Mixtape Crossroads";
    }
  }, [identity]);

  if (identityLoading) {
    return <Text>Loading...</Text>;
  }

  if (!identity) {
    return <Text>Authentication required...</Text>;
  }

  if (!isSuperuser) {
    return <Text>Superuser access required.</Text>;
  }

  return (
    <Box className="ard-root" p={{ base: 4, md: 6 }}>
      <VStack align="stretch" gap={2} maxW="640px">
        <Heading as="h1" size="lg" color="theme.text">
          Ariadne
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Concept discovery over the Puddlejump corpus. Scaffold only --
          corpus access (P1) and infrastructure isolation (P2) are built;
          schema and Lens/Run mechanics (P4/P5) are not, so there is no
          concept data to show here yet.
        </Text>
      </VStack>
    </Box>
  );
}
