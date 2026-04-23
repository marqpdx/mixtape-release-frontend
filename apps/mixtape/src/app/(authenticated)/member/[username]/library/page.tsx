"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  VStack,
  Skeleton,
  SkeletonText,
  Badge,
} from "@chakra-ui/react";
import { IconClock } from "@tabler/icons-react";
import { format } from "date-fns";
import Link from "next/link";
import NextLink from "next/link";
import { useColorModeValue } from "@components/ui/color-mode";
import { fetchPublicMemberWriting } from "@mixtape/api/clients/public/publicApi";
import type { PublicLibraryPiece } from "@mixtape/api/clients/public/publicApi";

function PieceCard({
  piece,
  username,
  borderColor,
  metaColor,
  excerptColor,
}: {
  piece: PublicLibraryPiece;
  username: string;
  borderColor: string;
  metaColor: string;
  excerptColor: string;
}) {
  const publishedDate = piece.published_at
    ? format(new Date(piece.published_at), "MMM d, yyyy")
    : null;

  return (
    <Link
      href={`/members/${username}/writing/${piece.slug}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <Box py={5} borderBottomWidth="1px" borderColor={borderColor}>
        <HStack gap={2} mb={2} flexWrap="wrap">
          <Heading as="h3" size="md" fontWeight="semibold" lineHeight="1.3">
            {piece.title}
          </Heading>
          {piece.writing_kind && piece.writing_kind !== "post" && (
            <Badge size="sm" variant="subtle" colorPalette="blue" flexShrink={0}>
              {piece.writing_kind}
            </Badge>
          )}
        </HStack>

        {piece.excerpt && (
          <Text
            fontSize="sm"
            color={excerptColor}
            lineHeight="1.6"
            mb={2}
            lineClamp={2}
          >
            {piece.excerpt}
          </Text>
        )}

        <HStack gap={2} fontSize="xs" color={metaColor} flexWrap="wrap">
          {piece.sponsor_group && (
            <>
              <Text
                as="span"
                onClick={(e) => e.preventDefault()}
              >
                <NextLink
                  href={`/groups/${piece.sponsor_group.slug}`}
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  {piece.sponsor_group.title}
                </NextLink>
              </Text>
              <Text>·</Text>
            </>
          )}
          {publishedDate && <Text>{publishedDate}</Text>}
          {piece.reading_time != null && piece.reading_time > 0 && (
            <>
              <Text>·</Text>
              <HStack gap={1}>
                <IconClock size={11} />
                <Text>{piece.reading_time} min</Text>
              </HStack>
            </>
          )}
        </HStack>
      </Box>
    </Link>
  );
}

function LibrarySkeleton({ borderColor }: { borderColor: string }) {
  return (
    <VStack gap={0} align="stretch">
      {[1, 2, 3].map((i) => (
        <Box key={i} py={5} borderBottomWidth="1px" borderColor={borderColor}>
          <Skeleton h="5" w="60%" mb={3} />
          <SkeletonText lineClamp={2} gap={2} mb={3} />
          <Skeleton h="3" w="30%" />
        </Box>
      ))}
    </VStack>
  );
}

export default function MemberLibraryPage() {
  const { username } = useParams();
  const usernameStr = Array.isArray(username) ? username[0] : (username as string);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const excerptColor = useColorModeValue("gray.600", "gray.300");
  const headingColor = useColorModeValue("gray.900", "gray.100");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  const { data: pieces, isLoading, error } = useQuery({
    queryKey: ["public-member-writing", usernameStr],
    queryFn: () => fetchPublicMemberWriting(usernameStr),
    enabled: !!usernameStr,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Box className="sixty-box" pt={0} px={2}>
      <Container maxW="680px" py={10} px={{ base: 4, md: 8 }}>
        <Box mb={8}>
          <Heading size="lg" color={headingColor} mb={1}>
            Library
          </Heading>
          <Text fontSize="sm" color={subtitleColor}>
            {usernameStr}
          </Text>
        </Box>

        {isLoading && <LibrarySkeleton borderColor={borderColor} />}

        {error && (
          <Text color="red.500" fontSize="sm">
            Failed to load library.
          </Text>
        )}

        {!isLoading && !error && pieces && pieces.length === 0 && (
          <Text color={metaColor} fontSize="sm">
            No published pieces yet.
          </Text>
        )}

        {!isLoading && !error && pieces && pieces.length > 0 && (
          <VStack gap={0} align="stretch">
            {pieces.map((piece) => (
              <PieceCard
                key={piece.id}
                piece={piece}
                username={usernameStr}
                borderColor={borderColor}
                metaColor={metaColor}
                excerptColor={excerptColor}
              />
            ))}
          </VStack>
        )}
      </Container>
    </Box>
  );
}
