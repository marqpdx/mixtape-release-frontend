// src/app/(root)/writing/[pieceSlug]/page.tsx

"use client";

import { useParams } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Skeleton,
  SkeletonText,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useWritingPiece } from "@hooks/useWriting";
import { TipTapRenderer } from "@components/tiptap/TipTapRenderer";
import { formatDistanceToNow } from "date-fns";

export default function WritingPublicPage() {
  const params = useParams();
  const pieceSlug = params?.pieceSlug as string | undefined;

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  const { piece, isLoading, error } = useWritingPiece(pieceSlug || null);

  if (isLoading) {
    return (
      <Box bg={bgColor} minH="100vh">
        <Skeleton h="200px" mb={8} />
        <Container maxW="3xl">
          <VStack gap={4} align="stretch">
            <Skeleton h="10" />
            <SkeletonText lineClamp={5} />
          </VStack>
        </Container>
      </Box>
    );
  }

  if (error || !piece) {
    return (
      <Box bg={bgColor} minH="100vh" py={12}>
        <Container maxW="3xl">
          <VStack align="center" gap={4}>
            <Heading size="md">Piece not found</Heading>
            <Text color="gray.500">
              This piece may have been deleted or you don't have permission to view it.
            </Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={12}>
      <Container maxW="3xl">
        <Box bg={cardBg} borderRadius="lg" borderWidth="1px" p={8}>
          <VStack gap={6} align="stretch">
            <VStack gap={3} align="stretch">
              <Heading size="2xl">{piece.title}</Heading>
              {piece.published_at && (
                <HStack gap={2} fontSize="sm" color="gray.500">
                  <Text>
                    Published {formatDistanceToNow(new Date(piece.published_at), { addSuffix: true })}
                  </Text>
                </HStack>
              )}
            </VStack>

            {piece.excerpt && (
              <Text fontSize="lg" color="gray.600" fontStyle="italic">
                {piece.excerpt}
              </Text>
            )}

            <Box className="writing-piece-content">
              <TipTapRenderer content={piece.body_json} />
            </Box>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
