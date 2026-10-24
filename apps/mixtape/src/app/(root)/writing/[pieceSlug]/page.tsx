// src/app/(root)/writing/[pieceSlug]/page.tsx
//
// A piece's permalink. The old basic reading page here was retired in the
// surfaces pass (CTO, 2026-10-23); about nine links still use /writing/<slug>,
// so this sends the reader to the piece's home:
//   a member's piece → /member/<username>/writing/<slug>
//   a group's piece  → /groups/<group>/writing/<slug>
//   no sponsor       → the author's page
// It resolves in the browser, signed in, so members-only pieces stay visible.

"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import { useWritingPiece } from "@hooks/useWriting";

function pieceHome(piece: Record<string, string | null | undefined>, slug: string): string | null {
  if (piece.sponsor_type === "group" && piece.sponsor_slug) {
    return `/groups/${piece.sponsor_slug}/writing/${slug}`;
  }
  const member = piece.sponsor_type === "member" ? piece.sponsor_slug : piece.author_username;
  return member ? `/member/${member}/writing/${slug}` : null;
}

export default function WritingPermalinkPage({ params }: { params: Promise<{ pieceSlug: string }> }) {
  const { pieceSlug } = use(params);
  const router = useRouter();
  const { piece, isLoading, error } = useWritingPiece(pieceSlug || null);
  const home = piece ? pieceHome(piece, pieceSlug) : null;

  useEffect(() => {
    if (home) router.replace(home);
  }, [home, router]);

  if (isLoading || home) {
    return (
      <Box py={16} display="flex" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  return (
    <Box py={12} px={4}>
      <VStack gap={2}>
        <Heading size="md">Piece not found</Heading>
        <Text color="gray.500">{error ? "This piece may have been removed, or you can't see it." : "This piece has no home to open."}</Text>
      </VStack>
    </Box>
  );
}
