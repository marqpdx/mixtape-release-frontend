// src/app/(root)/member/[username]/library/page.tsx

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
  Badge,
  SimpleGrid,
  Spinner,
  Link,
  Button,
  Input,
  Textarea,
  Select,
  createListCollection,
  Portal,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useColorModeValue } from "@components/ui/color-mode";
import { useMemberProfile } from "@hooks/member/useMemberProfile";
import { useAuth } from "@/lib/auth/AuthContext";
import * as stackroomApi from "@mixtape/api/clients/stackroom/stackroomApi";
import { formatDistanceToNow } from "date-fns";

type LibraryPlacement = Awaited<ReturnType<typeof stackroomApi.fetchLibraryPlacements>>[number];

export default function MemberLibraryPage() {
  const params = useParams();
  const username = params?.username as string | undefined;
  const { member, isLoading: memberLoading } = useMemberProfile(username);
  const { user } = useAuth();
  const isOwner = Boolean(user && member && user.username === member.username);

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");

  const {
    data: libraries = [],
    isLoading: librariesLoading,
    refetch: refetchLibraries,
  } = useQuery({
    queryKey: ["library", "public", username],
    queryFn: () => stackroomApi.fetchPublicLibrariesByUsername(username || "", "writing"),
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
    const summary: Record<
      string,
      { count: number; lastPublishedAt: string | null }
    > = {};
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

  const primaryShelf = useMemo(() => {
    if (!libraries.length) return null;
    return libraries.find((lib) => lib.slug === "my-writing" || lib.title === "My Writing") ?? libraries[0];
  }, [libraries]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftVisibility, setDraftVisibility] = useState<"public" | "members" | "unlisted" | "private">("public");

  const visibilityCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Public", value: "public" },
          { label: "Members", value: "members" },
          { label: "Link-only", value: "unlisted" },
          { label: "Private", value: "private" },
        ],
      }),
    []
  );

  const startEdit = () => {
    if (!primaryShelf) return;
    setDraftTitle(primaryShelf.title);
    setDraftSummary(primaryShelf.summary || "");
    setDraftBody(primaryShelf.body || "");
    setDraftVisibility((primaryShelf.visibility as typeof draftVisibility) || "public");
    setEditing(true);
  };

  const handleSave = async () => {
    if (!primaryShelf) return;
    setSaving(true);
    try {
      await stackroomApi.updateLibrary(primaryShelf.id, {
        title: draftTitle,
        summary: draftSummary,
        body: draftBody,
        visibility: draftVisibility,
      });
      await refetchLibraries();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (memberLoading || librariesLoading) {
    return (
      <Box bg={bg} minH="100vh" py={16}>
        <Container maxW="4xl">
          <HStack gap={3} color="gray.500">
            <Spinner size="sm" />
            <Text>Loading library...</Text>
          </HStack>
        </Container>
      </Box>
    );
  }

  if (!member) {
    return (
      <Box bg={bg} minH="100vh" py={16}>
        <Container maxW="4xl">
          <Heading size="md">Library not found</Heading>
          <Text color="gray.500" mt={2}>
            This member does not have a public library yet.
          </Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={bg} minH="100vh" py={12}>
      <Container maxW="5xl">
        <VStack align="stretch" gap={8}>
          <VStack align="stretch" gap={2}>
            <Heading size="lg">{member.display_name || member.username}</Heading>
            <Text color="gray.500">@{member.username}</Text>

            {editing ? (
              <VStack align="stretch" gap={3} mt={3}>
                <Input
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder="Library title"
                />
                <Input
                  value={draftSummary}
                  onChange={(event) => setDraftSummary(event.target.value)}
                  placeholder="One-sentence intro"
                />
                <Textarea
                  value={draftBody}
                  onChange={(event) => setDraftBody(event.target.value)}
                  placeholder="Longer framing (optional)"
                  minH="120px"
                />
                <Select.Root
                  value={[draftVisibility]}
                  onValueChange={({ value }) =>
                    setDraftVisibility((value[0] as typeof draftVisibility) || "public")
                  }
                  collection={visibilityCollection}
                >
                  <Select.HiddenSelect />
                  <Select.Control maxW="260px">
                    <Select.Trigger>
                      <Select.ValueText placeholder="Visibility" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                      <Select.ClearTrigger />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {visibilityCollection.items.map((item) => (
                          <Select.Item item={item} key={item.value}>
                            {item.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
                <HStack gap={3}>
                  <Button size="sm" onClick={handleSave} loading={saving} colorScheme="green">
                    Save library intro
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <>
                {primaryShelf?.summary && (
                  <Text fontSize="md" color="gray.600" mt={3}>
                    {primaryShelf.summary}
                  </Text>
                )}
                {primaryShelf?.body && (
                  <Text fontSize="sm" color="gray.600">
                    {primaryShelf.body}
                  </Text>
                )}
                {isOwner && primaryShelf && (
                  <Button
                    size="sm"
                    variant="outline"
                    w="fit-content"
                    mt={3}
                    onClick={startEdit}
                  >
                    Edit library intro
                  </Button>
                )}
              </>
            )}
          </VStack>

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
                      <Text fontSize="sm" color="gray.600">
                        {library.summary}
                      </Text>
                    )}
                    <HStack justify="space-between" fontSize="xs" color="gray.500">
                      <Text>{countLabel}</Text>
                      <Text>{updatedLabel}</Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.400">
                      Debug: {library.id} · {library.visibility ?? "unknown"} · {library.scope ?? "n/a"}
                    </Text>
                    <Link
                      as={NextLink}
                      href={`/app/${member.username}/library/${library.slug === "my-writing" ? "writing" : library.slug}`}
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

          {!libraries.length && !placementsLoading && (
            <Text color="gray.500">No shelves yet.</Text>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
