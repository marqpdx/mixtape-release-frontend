// src/app/(root)/member/[username]/library/[shelfSlug]/page.tsx

"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
import { format } from "date-fns";
import { IconGripVertical } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import type { WritingPiece } from "@mixtape/core/types/writingTypes";

export default function MemberShelfPage() {
  const params = useParams();
  const username = params?.username as string | undefined;
  const shelfSlug = params?.shelfSlug as string | undefined;

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");

  const { member, isLoading: memberLoading } = useMemberProfile(username);
  const { user } = useAuth();
  const isOwner = Boolean(user && member && user.username === member.username);

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

  const [search, setSearch] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

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

  const handleRemove = async (placementId: string) => {
    if (!shelf?.id) return;
    await stackroomApi.removeLibraryPlacement(shelf.id, placementId);
    await refetchPlacements();
  };

  const commitReorder = async (nextOrder: typeof orderedPlacements) => {
    if (!shelf?.id) return;
    setSavingOrder(true);
    try {
      await stackroomApi.reorderLibraryPlacements(
        shelf.id,
        nextOrder.map((placement) => placement.id)
      );
      await refetchPlacements();
    } finally {
      setSavingOrder(false);
    }
  };

  const handleMove = async (placementId: string, direction: "up" | "down") => {
    const current = [...orderedPlacements];
    const index = current.findIndex((placement) => placement.id === placementId);
    if (index < 0) return;
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= current.length) return;
    const [moved] = current.splice(index, 1);
    current.splice(swapWith, 0, moved);
    await commitReorder(current);
  };

  const handleDrop = async (overId: string) => {
    if (!draggingId || draggingId === overId) {
      setDraggingId(null);
      return;
    }
    const current = [...orderedPlacements];
    const fromIndex = current.findIndex((placement) => placement.id === draggingId);
    const toIndex = current.findIndex((placement) => placement.id === overId);
    if (fromIndex < 0 || toIndex < 0) {
      setDraggingId(null);
      return;
    }
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    setDraggingId(null);
    await commitReorder(current);
  };

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
            This shelf doesn’t exist or isn’t available.
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
            href={`/app/${member.username}/library`}
            color="green.600"
            fontSize="sm"
          >
            ← Back to library
          </Link>

          <VStack align="stretch" gap={2}>
            <HStack justify="space-between" align="start">
              <Heading size="lg">{shelf.title}</Heading>
              {shelf.visibility && (
                <Badge variant="outline" textTransform="capitalize">
                  {shelf.visibility}
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color="gray.400">
              Debug: {shelf.id} · {shelf.visibility ?? "unknown"} · {shelf.scope ?? "n/a"} · {placements.length} placements
            </Text>
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

          {placementsLoading ? (
            <HStack gap={2} color="gray.500">
              <Spinner size="sm" />
              <Text>Loading pieces...</Text>
            </HStack>
          ) : (
            <VStack align="stretch" gap={4}>
              {orderedPlacements.map((placement) => (
                <Box
                  key={placement.id}
                  bg={cardBg}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={border}
                  p={5}
                  draggable={isOwner}
                  onDragStart={() => setDraggingId(placement.id)}
                  onDragOver={(event) => {
                    if (isOwner) {
                      event.preventDefault();
                    }
                  }}
                  onDrop={() => {
                    if (isOwner) {
                      void handleDrop(placement.id);
                    }
                  }}
                  opacity={draggingId === placement.id ? 0.6 : 1}
                >
                  <VStack align="stretch" gap={3}>
                    <HStack justify="space-between" align="start">
                      <HStack gap={2} align="start">
                        {isOwner && (
                          <Box
                            color="gray.400"
                            _hover={{ color: "gray.600" }}
                            cursor="grab"
                            mt="2px"
                          >
                            <IconGripVertical size={16} />
                          </Box>
                        )}
                        <Link
                          as={NextLink}
                          href={`/writing/${placement.piece_slug}`}
                          fontWeight="semibold"
                          fontSize="lg"
                        >
                          {placement.piece_title}
                        </Link>
                      </HStack>
                    </HStack>
                    {placement.display?.excerpt && (
                      <Text color="gray.600">{placement.display.excerpt}</Text>
                    )}
                      {placement.published_at && (
                        <Text fontSize="xs" color="gray.500">
                          Published {format(new Date(placement.published_at), "PPP")}
                        </Text>
                      )}
                      {isOwner && (
                        <HStack gap={2}>
                          <Button size="xs" variant="outline" onClick={() => handleMove(placement.id, "up")}>
                            Up
                          </Button>
                          <Button size="xs" variant="outline" onClick={() => handleMove(placement.id, "down")}>
                            Down
                          </Button>
                          <Button size="xs" variant="outline" onClick={() => handleRemove(placement.id)}>
                            Remove
                          </Button>
                        </HStack>
                      )}
                    </VStack>
                  </Box>
                ))}
              {!orderedPlacements.length && (
                <Text color="gray.500">No published pieces here yet.</Text>
              )}
            </VStack>
          )}

          {isOwner && (
            <Box mt={10} borderWidth="1px" borderColor={border} borderRadius="lg" p={5} bg={cardBg}>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between">
                  <Heading size="sm">Shelf editor</Heading>
                  {savingOrder && <Text fontSize="xs" color="gray.500">Saving order…</Text>}
                </HStack>

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
