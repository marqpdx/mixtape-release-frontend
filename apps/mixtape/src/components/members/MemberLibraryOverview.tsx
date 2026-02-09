// apps/mixtape/src/components/members/MemberLibraryOverview.tsx

"use client";

import { useMemo } from "react";
import NextLink from "next/link";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  Spinner,
  Link,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useColorModeValue } from "@components/ui/color-mode";
import * as stackroomApi from "@mixtape/api/clients/stackroom/stackroomApi";
import { formatDistanceToNow } from "date-fns";

type LibraryPlacement = Awaited<ReturnType<typeof stackroomApi.fetchLibraryPlacements>>[number];

interface MemberLibraryOverviewProps {
  username: string;
}

export default function MemberLibraryOverview({ username }: MemberLibraryOverviewProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  const {
    data: libraries = [],
    isLoading: librariesLoading,
  } = useQuery({
    queryKey: ["library", "public", username],
    queryFn: () => stackroomApi.fetchPublicLibrariesByUsername(username, "writing"),
    enabled: !!username,
  });

  const libraryIds = useMemo(() => libraries.map((lib) => lib.id), [libraries]);

  const { data: placementsByLibrary = {}, isLoading: placementsLoading } = useQuery({
    queryKey: ["library", "placements", libraryIds],
    queryFn: async () => {
      const entries = await Promise.all(
        libraryIds.map(async (id) => {
          const placements = await stackroomApi.fetchLibraryPlacements(id);
          return [id, placements] as const;
        })
      );
      return Object.fromEntries(entries) as Record<string, LibraryPlacement[]>;
    },
    enabled: libraryIds.length > 0,
  });

  const librarySummaries = useMemo(() => {
    const summary: Record<string, { count: number; lastPublishedAt: string | null }> = {};
    libraries.forEach((lib) => {
      const placements = placementsByLibrary[lib.id] || [];
      const visiblePlacements = placements.filter((placement) => placement.published_at);
      const lastPublishedAt = visiblePlacements.reduce<string | null>((latest, placement) => {
        if (!placement.published_at) return latest;
        if (!latest) return placement.published_at;
        return new Date(placement.published_at) > new Date(latest) ? placement.published_at : latest;
      }, null);
      summary[lib.id] = {
        count: visiblePlacements.length,
        lastPublishedAt,
      };
    });
    return summary;
  }, [libraries, placementsByLibrary]);

  if (librariesLoading || placementsLoading) {
    return (
      <HStack gap={3} color={muted}>
        <Spinner size="sm" />
        <Text>Loading shelves...</Text>
      </HStack>
    );
  }

  if (!libraries.length) {
    return <Text color={muted}>No shelves yet.</Text>;
  }

  return (
    <VStack align="stretch" gap={6}>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {libraries.map((library) => {
          const summary = librarySummaries[library.id];
          const updatedLabel = summary?.lastPublishedAt
            ? `Updated ${formatDistanceToNow(new Date(summary.lastPublishedAt), { addSuffix: true })}`
            : "No items yet";
          const countLabel = `${summary?.count ?? 0} pieces`;
          return (
            <Box
              key={library.id}
              bg={cardBg}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={border}
              p={5}
            >
              <VStack align="stretch" gap={2}>
                <HStack justify="space-between" align="start">
                  <Heading size="md">{library.title}</Heading>
                  {library.visibility && (
                    <Badge variant="outline" textTransform="capitalize">
                      {library.visibility}
                    </Badge>
                  )}
                </HStack>
                {library.summary && (
                  <Text fontSize="sm" color={muted}>
                    {library.summary}
                  </Text>
                )}
                <HStack justify="space-between" fontSize="xs" color={muted}>
                  <Text>{countLabel}</Text>
                  <Text>{updatedLabel}</Text>
                </HStack>
                <Link
                  as={NextLink}
                  href={`/@${username}/library/${library.slug}`}
                  color="green.600"
                  fontSize="sm"
                >
                  Open shelf
                </Link>
              </VStack>
            </Box>
          );
        })}
      </SimpleGrid>
    </VStack>
  );
}
