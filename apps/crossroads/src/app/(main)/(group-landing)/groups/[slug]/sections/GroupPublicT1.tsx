"use client";

// GroupPublicT1 — Tier 1 surface. No GroupPublicConfig configured.
// Renders: full-bleed background image banner → group name + description → latest writing grid.

import { Box, Flex, Text, Grid } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import Link from "next/link";
import type { GroupPublicLandingConfig, FeaturedPiece } from "../types";

interface Props {
  config: GroupPublicLandingConfig;
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

function T1WritingCard({ piece }: { piece: FeaturedPiece }) {
  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "gray.50");
  const bodyColor = useColorModeValue("gray.600", "gray.300");
  const metaColor = useColorModeValue("gray.400", "gray.500");

  return (
    <Link href={`/reading/${piece.slug}`} style={{ textDecoration: "none" }}>
      <Box
        className="gpl-t1-card"
        bg={bg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={5}
        _hover={{ borderColor: "indigo.400" }}
        transition="border-color 0.15s"
        h="full"
      >
        <Text
          fontSize="md"
          fontWeight="700"
          color={titleColor}
          lineHeight={1.3}
          mb={3}
        >
          {piece.title}
        </Text>

        {piece.excerpt && (
          <Text
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

        <Flex align="center" gap={2} flexWrap="wrap">
          <Text fontSize="xs" color={metaColor}>{piece.author.display_name}</Text>
          {piece.published_at && (
            <>
              <Text fontSize="xs" color={metaColor}>·</Text>
              <Text fontSize="xs" color={metaColor}>{formatDate(piece.published_at)}</Text>
            </>
          )}
          {piece.reading_time && (
            <>
              <Text fontSize="xs" color={metaColor}>·</Text>
              <Text fontSize="xs" color={metaColor}>{piece.reading_time} min read</Text>
            </>
          )}
        </Flex>
      </Box>
    </Link>
  );
}

export function GroupPublicT1({ config, groupSlug }: Props) {
  const { group, featured_content } = config;

  const overlayColor = "rgba(0,0,0,0.45)";
  const sectionBg = useColorModeValue("white", "gray.950");
  const borderColor = useColorModeValue("gray.100", "gray.800");
  const titleColor = useColorModeValue("gray.900", "gray.50");
  const bodyColor = useColorModeValue("gray.600", "gray.300");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const linkColor = useColorModeValue("indigo.600", "indigo.400");

  const hasPieces = featured_content.pieces.length > 0;

  return (
    <>
      {/* Full-bleed background image banner */}
      <Box
        className="gpl-t1-banner"
        as="section"
        position="relative"
        minH={{ base: "320px", md: "420px" }}
        display="flex"
        alignItems="flex-end"
        style={
          group.background_image_url
            ? {
                backgroundImage: `url(${group.background_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: "linear-gradient(135deg, #3730a3 0%, #6d28d9 100%)" }
        }
      >
        {/* Overlay */}
        <Box
          position="absolute"
          inset={0}
          style={{ background: overlayColor }}
          borderRadius="0"
        />
        <Box
          className="gpl-t1-banner-content"
          position="relative"
          zIndex={1}
          px={{ base: 6, md: 12, lg: 20 }}
          py={{ base: 10, md: 14 }}
          maxW="720px"
        >
          <Text
            as="h1"
            fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
            fontWeight="700"
            color="white"
            lineHeight={1.2}
            mb={group.summary ? 4 : 0}
          >
            {group.title}
          </Text>
          {group.summary && (
            <Text
              fontSize={{ base: "md", md: "lg" }}
              color="whiteAlpha.800"
              lineHeight={1.7}
            >
              {group.summary}
            </Text>
          )}
        </Box>
      </Box>

      {/* Writing grid */}
      {hasPieces && (
        <Box
          className="gpl-t1-writing"
          as="section"
          bg={sectionBg}
          borderBottomWidth="1px"
          borderColor={borderColor}
          px={{ base: 6, md: 12, lg: 20 }}
          py={{ base: 16, md: 20 }}
        >
          <Flex justify="space-between" align="baseline" mb={8} flexWrap="wrap" gap={2}>
            <Text
              fontSize="xs"
              fontWeight="600"
              color={labelColor}
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Writing
            </Text>
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
            className="gpl-t1-grid"
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
            gap={5}
          >
            {featured_content.pieces.map((piece) => (
              <T1WritingCard key={piece.id} piece={piece} />
            ))}
          </Grid>
        </Box>
      )}

      {/* No content state */}
      {!hasPieces && (
        <Box
          className="gpl-t1-empty"
          as="section"
          bg={sectionBg}
          px={{ base: 6, md: 12, lg: 20 }}
          py={{ base: 16, md: 20 }}
        >
          <Text fontSize="md" color={bodyColor}>
            No published writing yet.
          </Text>
        </Box>
      )}
    </>
  );
}
