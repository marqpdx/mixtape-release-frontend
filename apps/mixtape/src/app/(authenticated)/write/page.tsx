// app/(authenticated)/write/page.tsx
//
// The Gate — Focus-Centered Writing ADR (FCW-1).

"use client";

import { Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { WriteGate } from "@components/writing/gate/WriteGate";

export default function WritePage() {
  const { user: identity, isLoading } = useAuth();

  if (isLoading) return <Text px={4} py={8}>Loading…</Text>;
  if (!identity) return <Text px={4} py={8}>Authentication required.</Text>;

  return <WriteGate />;
}
