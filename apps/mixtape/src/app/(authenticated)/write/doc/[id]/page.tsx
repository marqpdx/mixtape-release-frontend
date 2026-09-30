// app/(authenticated)/write/doc/[id]/page.tsx
//
// The Page — Focus-Centered Writing ADR (FCW-1/FCW-2).

"use client";

import { useParams } from "next/navigation";
import { Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { WritePage } from "@components/writing/gate/WritePage";

export default function WriteDocPage() {
  const { user: identity, isLoading } = useAuth();
  const params = useParams<{ id: string }>();

  if (isLoading) return <Text px={4} py={8}>Loading…</Text>;
  if (!identity) return <Text px={4} py={8}>Authentication required.</Text>;
  if (!params?.id) return <Text px={4} py={8}>No document specified.</Text>;

  return <WritePage pieceId={params.id} />;
}
