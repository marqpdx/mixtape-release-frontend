// app/(authenticated)/focus/[focusId]/piece/[docId]/edit/page.tsx
//
// The Edit instrument — Focus-Centered Writing ADR (FCW-8).

"use client";

import { use } from "react";
import { Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { FocusEditPage } from "@components/writing/focus/FocusEditPage";

export default function FocusPieceEditPage({
  params,
}: {
  params: Promise<{ focusId: string; docId: string }>;
}) {
  const { focusId, docId } = use(params);
  const { user: identity, isLoading } = useAuth();

  if (isLoading) return <Text px={4} py={8}>Loading…</Text>;
  if (!identity) return <Text px={4} py={8}>Authentication required.</Text>;

  return <FocusEditPage focusId={focusId} pieceId={docId} />;
}
