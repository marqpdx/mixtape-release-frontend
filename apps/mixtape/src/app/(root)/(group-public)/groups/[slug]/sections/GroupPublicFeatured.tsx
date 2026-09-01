"use client";

// GroupPublicFeatured — Featured writing cards (Decision 1, Decision 6)
// Decision 4: content backed by Collection; this component just renders what the server resolved.

import { Box, Flex, Text, Grid } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import Link from "next/link";
import type { FeaturedPiece } from "../types";

interface Props {
  pieces: FeaturedPiece[];
  layout: string;
  groupSlug: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface CardProps {
  piece: FeaturedPiece;
}

function FeaturedCard({ piece }: CardProps) {
  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headlineColor = useColorModeValue("gray.900", "gray.50");
  const bodyColor = useColorModeValue("gray.600", "gray.300");
  const metaColor = useColorModeValue("gray.400", "gray.500");

  return (
    <Link href={`/reading/${piece.slug}`} style={{ textDecoration: "none" }}>
      <Box
        className="gpl-fc-card"
        bg={bg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={6}
        _hover={{ borderColor: "indigo.400" }}
        transition="border-color 0.15s"
        h="full"
      >
        <Text
          className="gpl-fc-card-title"
          fontSize="lg"
          fontWeight="700"
          color={headlineColor}
          lineHeight={1.3}
          mb={3}
        >
          {piece.title}
        </Text>

        {piece.excerpt && (
          <Text
            className="gpl-fc-card-excerpt"
            fontSize="sm"
            color={bodyColor}
            lineHeight={1.6}
            mb={4}
            overflow="hidden"
            style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
          >
            {piece.excerpt}
          </Text>
        )}

        <Flex className="gpl-fc-card-meta" align="center" gap={3} flexWrap="wrap">
          <Text fontSize="xs" color={metaColor}>
            {piece.author.display_name}
          </Text>
          {piece.published_at && (
            <>
              <Text fontSize="xs" color={metaColor}>·</Text>
              <Text fontSize="xs" color={metaColor}>
                {formatDate(piece.published_at)}
              </Text>
            </>
          )}
          {piece.reading_time && (
            <>
              <Text fontSize="xs" color={metaColor}>·</Text>
              <Text fontSize="xs" color={metaColor}>
                {piece.reading_time} min read
              </Text>
            </>
          )}
        </Flex>
      </Box>
    </Link>
  );
}

export function GroupPublicFeatured({ pieces, groupSlug }: Props) {
  const bg = useColorModeValue("gray.50", "gray.950");
  const borderColor = useColorModeValue("gray.100", "gray.800");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const headingColor = useColorModeValue("gray.900", "gray.50");
  const linkColor = useColorModeValue("indigo.600", "indigo.400");

  return (
    <Box
      className="gpl-featured"
      id="gpl-featured"
      as="section"
      bg={bg}
      borderBottomWidth="1px"
      borderColor={borderColor}
      px={{ base: 6, md: 12, lg: 20 }}
      py={{ base: 16, md: 20 }}
    >
      <Flex className="gpl-fc-header" justify="space-between" align="baseline" mb={8} flexWrap="wrap" gap={2}>
        <Box>
          <Text
            fontSize="xs"
            fontWeight="600"
            color={labelColor}
            textTransform="uppercase"
            letterSpacing="wider"
            mb={1}
          >
            Featured Writing
          </Text>
          <Text fontSize="2xl" fontWeight="700" color={headingColor}>
            Selected Work
          </Text>
        </Box>
        <Link
          href={`/groups/${groupSlug}/writing`}
          style={{ fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}
        >
          <Text fontSize="sm" color={linkColor} fontWeight="500" _hover={{ textDecoration: "underline" }}>
            All writing →
          </Text>
        </Link>
      </Flex>

      <Grid
        className="gpl-fc-grid"
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
        gap={5}
      >
        {pieces.map((piece) => (
          <FeaturedCard key={piece.id} piece={piece} />
        ))}
      </Grid>
    </Box>
  );
}
