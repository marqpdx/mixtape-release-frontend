"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import NextLink from "next/link";
import {
  Badge,
  Box,
  Container,
  Heading,
  HStack,
  Link as ChakraLink,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  fetchPublicMemberProfile,
  fetchPublicMemberShelves,
  type PublicShelf,
} from "@mixtape/api/clients/public/publicApi";

export default function MemberShelfPage() {
  const params = useParams();
  const username = params.username as string;
  const shelfSlug = params.shelfSlug as string;

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["public-member-profile", username],
    queryFn: () => fetchPublicMemberProfile(username),
    enabled: !!username,
  });

  const { data: shelves = [], isLoading: shelvesLoading } = useQuery({
    queryKey: ["public-member-shelves", username],
    queryFn: () => fetchPublicMemberShelves(username),
    enabled: !!username,
  });

  const resolvedShelfSlug = useMemo(
    () => (shelfSlug === "writing" ? "my-writing" : shelfSlug),
    [shelfSlug]
  );

  const shelf = useMemo<PublicShelf | null>(
    () => shelves.find((item) => item.slug === resolvedShelfSlug) || null,
    [resolvedShelfSlug, shelves]
  );

  if (profileLoading || shelvesLoading) {
    return (
      <Box bg={bg} minH="100vh" py={16}>
        <Container maxW="4xl">
          <HStack gap={3} color={muted}>
            <Spinner size="sm" />
            <Text>Loading shelf...</Text>
          </HStack>
        </Container>
      </Box>
    );
  }

  if (!profile || !shelf) {
    return (
      <Box bg={bg} minH="100vh" py={16}>
        <Container maxW="4xl">
          <Heading size="md">Shelf not found</Heading>
          <Text color={muted} mt={2}>
            This shelf doesn&apos;t exist or isn&apos;t available.
          </Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={bg} minH="100vh" py={12}>
      <Container maxW="4xl">
        <VStack align="stretch" gap={6}>
          <ChakraLink asChild color="green.600" fontSize="sm">
            <NextLink href={`/members/${username}?tab=writing`}>
              ← Back to writing
            </NextLink>
          </ChakraLink>

          <VStack align="stretch" gap={2}>
            <HStack justify="space-between" align="start">
              <Heading size="lg">{shelf.title}</Heading>
              {shelf.visibility ? (
                <Badge variant="outline" textTransform="capitalize">
                  {shelf.visibility}
                </Badge>
              ) : null}
            </HStack>
            {shelf.summary ? (
              <Text fontSize="md" color={muted}>
                {shelf.summary}
              </Text>
            ) : null}
          </VStack>

          {shelf.items.length === 0 ? (
            <Box borderWidth="1px" borderColor={border} borderRadius="lg" p={6} bg={cardBg}>
              <Text color={muted}>No published pieces here yet.</Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={4}>
              {shelf.items.map((item) => (
                <Box key={item.id} borderWidth="1px" borderColor={border} borderRadius="lg" p={5} bg={cardBg}>
                  <ChakraLink
                    asChild
                    fontWeight="semibold"
                    fontSize="lg"
                    _hover={{ textDecoration: "underline" }}
                  >
                    <NextLink href={`/members/${username}/writing/${item.slug}`}>
                      {item.title}
                    </NextLink>
                  </ChakraLink>
                  {item.excerpt ? (
                    <Text fontSize="sm" color={muted} mt={2}>
                      {item.excerpt}
                    </Text>
                  ) : null}
                  <HStack mt={2} gap={3} fontSize="xs" color={muted}>
                    {item.published_at ? (
                      <Text>{new Date(item.published_at).toLocaleDateString()}</Text>
                    ) : null}
                    {item.writing_kind ? <Text>{item.writing_kind}</Text> : null}
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
