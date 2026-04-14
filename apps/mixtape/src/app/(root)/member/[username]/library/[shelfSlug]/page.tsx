// src/app/(root)/member/[username]/library/[shelfSlug]/page.tsx

"use client";

import { useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Link,
  Badge,
  Button,
  Input,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useColorModeValue } from "@components/ui/color-mode";
import { useMemberProfile } from "@hooks/member/useMemberProfile";
import * as stackroomApi from "@mixtape/api/clients/stackroom/stackroomApi";
import { useAuth } from "@/lib/auth/AuthContext";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import type { WritingPiece } from "@mixtape/core/types/writingTypes";
import {
  ContainerView,
  useContainerViewMode,
  type ContainerItem,
} from "@components/common/ContainerView";

type PlacementContainerItem = ContainerItem & {
  meta: { placementId: string; pieceSlug: string }
};

export default function MemberShelfPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string | undefined;
  const shelfSlug = params?.shelfSlug as string | undefined;

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");

  const { member, isLoading: memberLoading } = useMemberProfile(username);
  const { user } = useAuth();
  const isOwner = Boolean(user && member && user.username === member.username);

  const [viewMode, setViewMode] = useContainerViewMode("shelf-detail-view", "list");

  const { data: libraries = [], isLoading: librariesLoading } = useQuery({
    queryKey: ["library", "public", username],
    queryFn: () => stackroomApi.fetchPublicLibrariesByUsername(username || "", "writing"),
    enabled: !!username,
  });

  const resolvedShelfSlug = useMemo(
    () => (shelfSlug === "writing" ? "my-writing" : shelfSlug),
    [shelfSlug]
  );

  const shelf = useMemo(
    () => libraries.find((lib) => lib.slug === resolvedShelfSlug) || null,
    [libraries, resolvedShelfSlug]
  );

  const { data: placements = [], isLoading: placementsLoading, refetch: refetchPlacements } = useQuery({
    queryKey: ["library", "placements", shelf?.id],
    queryFn: () => stackroomApi.fetchLibraryPlacements(shelf!.id),
    enabled: !!shelf?.id,
  });

  const orderedPlacements = useMemo(() => {
    return [...placements].sort((a, b) => {
      const aOrder = a.order_index ?? 0;
      const bOrder = b.order_index ?? 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      if (!a.published_at || !b.published_at) return 0;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
  }, [placements]);

  const containerItems: PlacementContainerItem[] = useMemo(
    () =>
      orderedPlacements.map((p) => ({
        id: p.id,
        title: p.display?.title || p.piece_title || "Untitled",
        subtitle: p.display?.excerpt || undefined,
        date: p.published_at || undefined,
        meta: { placementId: p.id, pieceSlug: p.piece_slug },
      })),
    [orderedPlacements]
  );

  const [search, setSearch] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);

  const { data: publishedPieces = [], isLoading: piecesLoading } = useQuery({
    queryKey: ["writing", "published", username],
    queryFn: async () => {
      const response = await axiosInstance.get<WritingPiece[]>("/api/writing/pieces", {
        params: { status: "published" },
      });
      return response.data;
    },
    enabled: isOwner,
  });

  const shelfPieceIds = useMemo(
    () => new Set(placements.map((placement) => placement.piece_id)),
    [placements]
  );

  const filteredPieces = useMemo(() => {
    if (!search.trim()) return publishedPieces;
    const needle = search.toLowerCase();
    return publishedPieces.filter((piece) => piece.title?.toLowerCase().includes(needle));
  }, [publishedPieces, search]);

  const handleAdd = async (pieceId: string) => {
    if (!shelf?.id) return;
    await stackroomApi.addLibraryPlacement(shelf.id, pieceId);
    await refetchPlacements();
  };

  const handleRemoveItem = useCallback(
    async (item: ContainerItem) => {
      if (!shelf?.id) return;
      await stackroomApi.removeLibraryPlacement(shelf.id, item.id);
      await refetchPlacements();
    },
    [shelf?.id, refetchPlacements]
  );

  const handleReorder = useCallback(
    async (orderedIds: string[]) => {
      if (!shelf?.id) return;
      setSavingOrder(true);
      try {
        await stackroomApi.reorderLibraryPlacements(shelf.id, orderedIds);
        await refetchPlacements();
      } finally {
        setSavingOrder(false);
      }
    },
    [shelf?.id, refetchPlacements]
  );

  const handleItemClick = useCallback(
    (item: ContainerItem) => {
      const ci = item as PlacementContainerItem;
      router.push(`/members/${username}/writing/${ci.meta.pieceSlug}`);
    },
    [router, username]
  );

  if (memberLoading || librariesLoading) {
    return (
      <Box bg={bg} minH="100vh" py={16}>
        <Container maxW="4xl">
          <HStack gap={3} color="gray.500">
            <Spinner size="sm" />
            <Text>Loading shelf...</Text>
          </HStack>
        </Container>
      </Box>
    );
  }

  if (!member || !shelf) {
    return (
      <Box bg={bg} minH="100vh" py={16}>
        <Container maxW="4xl">
          <Heading size="md">Shelf not found</Heading>
          <Text color="gray.500" mt={2}>
            This shelf doesn't exist or isn't available.
          </Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={bg} minH="100vh" py={12}>
      <Container maxW="4xl">
        <VStack align="stretch" gap={6}>
          <Link
            as={NextLink}
            href={`/members/${member.username}/library`}
            color="green.600"
            fontSize="sm"
          >
            ← Back to library
          </Link>

          <VStack align="stretch" gap={2}>
            <HStack justify="space-between" align="start">
              <Heading size="lg">{shelf.title}</Heading>
              <HStack gap={2}>
                {savingOrder && <Text fontSize="xs" color="gray.500">Saving order…</Text>}
                {shelf.visibility && (
                  <Badge variant="outline" textTransform="capitalize">
                    {shelf.visibility}
                  </Badge>
                )}
              </HStack>
            </HStack>
            {shelf.summary && (
              <Text fontSize="md" color="gray.600">
                {shelf.summary}
              </Text>
            )}
            {shelf.body && (
              <Text fontSize="sm" color="gray.600">
                {shelf.body}
              </Text>
            )}
          </VStack>

          <ContainerView
            items={containerItems}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onItemClick={handleItemClick}
            onRemoveItem={isOwner ? handleRemoveItem : undefined}
            sortable={isOwner}
            onReorder={handleReorder}
            isLoading={placementsLoading}
            emptyStateMessage="No published pieces here yet."
          />

          {isOwner && (
            <Box mt={10} borderWidth="1px" borderColor={border} borderRadius="lg" p={5} bg={cardBg}>
              <VStack align="stretch" gap={4}>
                <Heading size="sm">Shelf editor</Heading>

                <Input
                  placeholder="Search your published writing"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                {piecesLoading ? (
                  <HStack gap={2} color="gray.500">
                    <Spinner size="sm" />
                    <Text>Loading writing…</Text>
                  </HStack>
                ) : (
                  <VStack align="stretch" gap={2}>
                    {filteredPieces.map((piece) => {
                      const alreadyAdded = shelfPieceIds.has(piece.id);
                      return (
                        <HStack key={piece.id} justify="space-between">
                          <Text fontSize="sm">{piece.title || "Untitled"}</Text>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleAdd(piece.id)}
                            disabled={alreadyAdded}
                          >
                            {alreadyAdded ? "On shelf" : "Add"}
                          </Button>
                        </HStack>
                      );
                    })}
                    {!filteredPieces.length && (
                      <Text fontSize="sm" color="gray.500">
                        No published pieces found.
                      </Text>
                    )}
                  </VStack>
                )}
              </VStack>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
