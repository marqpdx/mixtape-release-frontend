"use client";
// app/(root)/writing/issue/[issueSlug]/IssueReaderPageClient.tsx
// ADR-0054 P1-10 (renamed from WritingRun per Phase 3 amendment): Minimal sequential reader for a published Issue

import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Skeleton,
  SkeletonText,
  Separator,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { Link } from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { formatDistanceToNow } from "date-fns";

interface IssuePiece {
  order_index: number;
  is_lead: boolean;
  piece_id: string;
  piece_slug: string;
  piece_title: string;
  piece_excerpt: string;
  published_at: string;
  author: { username: string; display_name: string };
}

interface PublicIssue {
  id: string;
  slug: string;
  title: string;
  designation: string | null;
  description: Record<string, unknown> | null;
  status: string;
  published_at: string | null;
  piece_count: number;
  pieces: IssuePiece[];
}

function usePublicIssue(slug: string) {
  return useQuery<PublicIssue>({
    queryKey: ["public", "issues", slug],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/public/writing/issues/${slug}`);
      return res.data;
    },
    enabled: !!slug,
  });
}

export default function IssueReaderPageClient({ issueSlug }: { issueSlug: string }) {
  const { data: issue, isLoading, error } = usePublicIssue(issueSlug);

  if (isLoading) {
    return (
      <Box minH="100vh" py={12}>
        <Container maxW="3xl">
          <VStack gap={6} align="stretch">
            <Skeleton h="10" />
            <SkeletonText lineClamp={3} />
            <Separator />
            <Skeleton h="8" />
            <SkeletonText lineClamp={4} />
          </VStack>
        </Container>
      </Box>
    );
  }

  if (error || !issue) {
    return (
      <Box minH="100vh" py={12}>
        <Container maxW="3xl">
          <VStack align="center" gap={4} py={16}>
            <Heading size="md">Issue not found</Heading>
            <Text color="gray.500">
              This issue may not be published or may not exist.
            </Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" py={12}>
      <Container maxW="3xl">
        <VStack gap={8} align="stretch">
          {/* Issue header */}
          <VStack gap={2} align="stretch">
            <HStack gap={2} align="center">
              <Badge colorPalette="blue" size="sm">
                {issue.designation || "Issue"}
              </Badge>
              {issue.published_at && (
                <Text fontSize="sm" color="gray.500">
                  Published {formatDistanceToNow(new Date(issue.published_at), { addSuffix: true })}
                </Text>
              )}
            </HStack>
            <Heading size="2xl">{issue.title}</Heading>
            <Text fontSize="sm" color="gray.500">
              {issue.piece_count} piece{issue.piece_count !== 1 ? "s" : ""} in this issue
            </Text>
          </VStack>

          <Separator />

          {/* Ordered piece list */}
          <VStack gap={6} align="stretch">
            {issue.pieces.map((piece) => (
              <Box
                key={piece.piece_id}
                borderWidth="1px"
                borderRadius="lg"
                p={5}
                _hover={{ borderColor: "blue.300", boxShadow: "sm" }}
                transition="all 0.15s"
              >
                <HStack gap={3} mb={2} align="flex-start">
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    color="gray.400"
                    letterSpacing="wider"
                    textTransform="uppercase"
                    minW="24px"
                    pt={1}
                  >
                    {piece.order_index + 1}
                  </Text>
                  <VStack align="stretch" gap={1} flex={1}>
                    <Link as={NextLink} href={`/writing/${piece.piece_slug}`} _hover={{ textDecoration: "none" }}>
                      <Heading size="md" _hover={{ color: "blue.500" }} transition="color 0.15s">
                        {piece.piece_title}
                      </Heading>
                    </Link>
                    {piece.piece_excerpt && (
                      <Text fontSize="sm" color="gray.600" lineClamp={2}>
                        {piece.piece_excerpt}
                      </Text>
                    )}
                    <HStack gap={2} mt={1}>
                      <Text fontSize="xs" color="gray.400">
                        by {piece.author.display_name}
                      </Text>
                      {piece.published_at && (
                        <Text fontSize="xs" color="gray.400">
                          · {formatDistanceToNow(new Date(piece.published_at), { addSuffix: true })}
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}
