"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { fetchPublicWritingPiece } from "@mixtape/api/clients/public/publicApi";
import type { PublicWritingPiece } from "@mixtape/api/clients/public/publicApi";
import { TipTapRenderer } from "@mixtape/content/TipTapRenderer";
import NextLink from "next/link";

export default function PublicWritingPage() {
  const params = useParams();
  const username = params.username as string;
  const slug = params.slug as string;

  const [piece, setPiece] = useState<PublicWritingPiece | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutedColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPublicWritingPiece(slug);
        setPiece(data);
      } catch {
        setError("Writing piece not found.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || !piece) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Text color={mutedColor}>{error || "Writing piece not found."}</Text>
      </Box>
    );
  }

  return (
    <Box px="6" py="10" maxW="3xl" mx="auto">
      {/* Back link */}
      <ChakraLink asChild color="blue.500" fontSize="sm" mb="6" display="inline-block">
        <NextLink href={`/member/${username}`}>
          &larr; Back to {piece.author.display_name}
        </NextLink>
      </ChakraLink>

      {/* Article header */}
      <VStack gap="2" align="start" mb="8">
        <Heading size="2xl" lineHeight="1.2">
          {piece.title}
        </Heading>
        <HStack gap="3" fontSize="sm" color={mutedColor}>
          <Text>By {piece.author.display_name}</Text>
          {piece.published_at && (
            <Text>{new Date(piece.published_at).toLocaleDateString()}</Text>
          )}
          {piece.writing_kind && <Text>{piece.writing_kind}</Text>}
        </HStack>
      </VStack>

      {/* Article body */}
      {piece.body_json && (
        <Box mb="12">
          <TipTapRenderer
            content={piece.body_json as unknown as Parameters<typeof TipTapRenderer>[0]["content"]}
          />
        </Box>
      )}
    </Box>
  );
}
