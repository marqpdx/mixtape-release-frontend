"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Link as ChakraLink,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  fetchPublicMemberShelves,
  type PublicShelf,
} from "@mixtape/api/clients/public/publicApi";
import NextLink from "next/link";

interface MemberPublicWritingPanelProps {
  username: string;
}

export default function MemberPublicWritingPanel({
  username,
}: MemberPublicWritingPanelProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [kindFilter, setKindFilter] = useState<string | null>(null);

  const cardBg = useColorModeValue("gray.50", "gray.800");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const ctaBg = useColorModeValue("gray.50", "gray.800");
  const ctaBorderColor = useColorModeValue("gray.200", "gray.700");

  const isOwner = isAuthenticated && user?.username === username;

  const {
    data: shelves = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-member-shelves", username],
    queryFn: () => fetchPublicMemberShelves(username),
    enabled: !!username,
  });

  const allItems = useMemo(() => shelves.flatMap((shelf) => shelf.items), [shelves]);

  const writingKinds = useMemo(() => {
    const kinds = new Set<string>();
    for (const item of allItems) {
      if (item.writing_kind) kinds.add(item.writing_kind);
    }
    return Array.from(kinds).sort();
  }, [allItems]);

  const filteredShelves = useMemo(() => {
    if (!kindFilter) return shelves;
    return shelves
      .map((shelf) => ({
        ...shelf,
        items: shelf.items.filter((item) => item.writing_kind === kindFilter),
      }))
      .filter((shelf) => shelf.items.length > 0);
  }, [shelves, kindFilter]);

  const filteredAllItems = filteredShelves.flatMap((shelf) => shelf.items);
  const primaryShelf = useMemo(
    () => shelves.find((shelf) => shelf.slug === "my-writing" || shelf.title === "My Writing") || shelves[0] || null,
    [shelves]
  );
  const visibleShelfCount = filteredShelves.length;

  if (isLoading) {
    return (
      <Box px="6" py="12" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box px="6" py="12" textAlign="center">
        <Text color={mutedColor}>Could not load published writing.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <VStack align="stretch" gap={6} mb={8}>
        <Box
          border="1px solid"
          borderColor={borderColor}
          borderRadius="2xl"
          bg={cardBg}
          px={{ base: 5, md: 6 }}
          py={{ base: 5, md: 6 }}
        >
          <VStack align="stretch" gap={4}>
            <VStack align="stretch" gap={1}>
              <Text fontSize="xs" fontWeight="bold" letterSpacing="0.08em" textTransform="uppercase" color={mutedColor}>
                Public Writing
              </Text>
              <Heading size="lg">Published shelves and recent pieces</Heading>
              <Text color={mutedColor} maxW="3xl">
                Browse the shelves this member uses to organize published writing. Open a shelf to see everything in it, or jump directly into individual pieces below.
              </Text>
            </VStack>

            <HStack gap={3} flexWrap="wrap">
              <MetricChip label="Shelves" value={String(shelves.length)} />
              <MetricChip label="Visible pieces" value={String(allItems.length)} />
              <MetricChip label="Kinds" value={String(writingKinds.length || (allItems.length ? 1 : 0))} />
            </HStack>

            {primaryShelf ? (
              <Box
                border="1px solid"
                borderColor={borderColor}
                borderRadius="xl"
                px={4}
                py={4}
                bg="transparent"
              >
                <HStack justify="space-between" align={{ base: "start", md: "center" }} flexDirection={{ base: "column", md: "row" }} gap={4}>
                  <VStack align="stretch" gap={1} flex="1">
                    <HStack gap={2} flexWrap="wrap">
                      <Text fontWeight="semibold">{primaryShelf.title}</Text>
                      <Badge variant="subtle" colorPalette="green">
                        Featured shelf
                      </Badge>
                      <Badge variant="outline">
                        {primaryShelf.item_count} {primaryShelf.item_count === 1 ? "piece" : "pieces"}
                      </Badge>
                    </HStack>
                    {primaryShelf.summary ? (
                      <Text fontSize="sm" color={mutedColor}>
                        {primaryShelf.summary}
                      </Text>
                    ) : (
                      <Text fontSize="sm" color={mutedColor}>
                        Start here for the member&apos;s main public writing shelf.
                      </Text>
                    )}
                  </VStack>

                  <Button asChild size="sm" colorPalette="blue" variant="outline">
                    <NextLink href={`/members/${username}/library/${primaryShelf.slug === "my-writing" ? "writing" : primaryShelf.slug}`}>
                      Open shelf
                    </NextLink>
                  </Button>
                </HStack>
              </Box>
            ) : null}

            {shelves.length > 1 ? (
              <VStack align="stretch" gap={2}>
                <Text fontSize="sm" color={mutedColor}>
                  Jump to shelf
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  {shelves.map((shelf) => (
                    <Button key={shelf.id} asChild size="xs" variant="outline">
                      <NextLink href={`/members/${username}/library/${shelf.slug === "my-writing" ? "writing" : shelf.slug}`}>
                        {shelf.title}
                      </NextLink>
                    </Button>
                  ))}
                </HStack>
              </VStack>
            ) : null}
          </VStack>
        </Box>

        {visibleShelfCount > 0 ? (
          <Text fontSize="sm" color={mutedColor}>
            Showing {visibleShelfCount} {visibleShelfCount === 1 ? "shelf" : "shelves"}
            {kindFilter ? ` filtered to ${kindFilter}.` : "."}
          </Text>
        ) : null}
      </VStack>

      {isOwner && (
        <ChakraLink asChild color="blue.500" fontSize="sm" mb="4" display="inline-block">
          <NextLink href={`/app/member/${username}/library`}>
            Manage in Workbench
          </NextLink>
        </ChakraLink>
      )}

      <ViewerContextStrip
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        isOwner={isOwner}
        mutedColor={mutedColor}
        ctaBg={ctaBg}
        ctaBorderColor={ctaBorderColor}
      />

      {allItems.length > 1 && writingKinds.length > 1 && (
        <WritingFilterChips
          kinds={writingKinds}
          activeKind={kindFilter}
          onKindChange={setKindFilter}
        />
      )}

      {allItems.length === 0 ? (
        <Text color={mutedColor} mt="6">
          No published writing yet.
        </Text>
      ) : !kindFilter && shelves.length === 1 && shelves[0].items.length === 1 ? (
        <SinglePieceCard
          item={allItems[0]}
          username={username}
          cardBg={cardBg}
          mutedColor={mutedColor}
          borderColor={borderColor}
        />
      ) : filteredAllItems.length === 0 ? (
        <Text color={mutedColor} mt="6">
          No pieces match this filter.
        </Text>
      ) : (
        <VStack gap="6" align="stretch" mt="2">
          {filteredShelves.map((shelf) => (
            <ShelfCard
              key={shelf.id}
              shelf={shelf}
              username={username}
              cardBg={cardBg}
              mutedColor={mutedColor}
              borderColor={borderColor}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}

function MetricChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box borderWidth="1px" borderRadius="full" px={3} py={1.5}>
      <HStack gap={2}>
        <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em">
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="semibold">
          {value}
        </Text>
      </HStack>
    </Box>
  );
}

function WritingFilterChips({
  kinds,
  activeKind,
  onKindChange,
}: {
  kinds: string[];
  activeKind: string | null;
  onKindChange: (kind: string | null) => void;
}) {
  return (
    <HStack gap="2" flexWrap="wrap" mb="4">
      <Badge
        size="sm"
        variant={activeKind === null ? "solid" : "outline"}
        colorPalette="gray"
        cursor="pointer"
        px="3"
        py="1"
        borderRadius="full"
        onClick={() => onKindChange(null)}
      >
        All
      </Badge>
      {kinds.map((kind) => (
        <Badge
          key={kind}
          size="sm"
          variant={activeKind === kind ? "solid" : "outline"}
          colorPalette="gray"
          cursor="pointer"
          px="3"
          py="1"
          borderRadius="full"
          textTransform="capitalize"
          onClick={() => onKindChange(activeKind === kind ? null : kind)}
        >
          {kind}
        </Badge>
      ))}
    </HStack>
  );
}

function ViewerContextStrip({
  isAuthenticated,
  authLoading,
  isOwner,
  mutedColor,
  ctaBg,
  ctaBorderColor,
}: {
  isAuthenticated: boolean;
  authLoading: boolean;
  isOwner: boolean;
  mutedColor: string;
  ctaBg: string;
  ctaBorderColor: string;
}) {
  if (authLoading) return null;

  if (isOwner) {
    return (
      <Text py="2" px="3" mb="6" fontSize="sm" color={mutedColor}>
        This is your public writing view.
      </Text>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box
        py="3"
        px="4"
        mb="6"
        borderRadius="md"
        border="1px solid"
        borderColor={ctaBorderColor}
        bg={ctaBg}
      >
        <Text fontSize="sm" color={mutedColor} mb="2">
          You&apos;re viewing as a guest. Some content may be members-only.
        </Text>
        <HStack gap="3">
          <ChakraLink asChild fontSize="sm" color="blue.500">
            <NextLink href="/app/login">Log in to respond</NextLink>
          </ChakraLink>
          <Text fontSize="sm" color={mutedColor}>·</Text>
          <ChakraLink asChild fontSize="sm" color="blue.500">
            <NextLink href="/welcome/start">Join to participate</NextLink>
          </ChakraLink>
        </HStack>
      </Box>
    );
  }

  return (
    <Box
      py="3"
      px="4"
      mb="6"
      borderRadius="md"
      border="1px solid"
      borderColor={ctaBorderColor}
      bg={ctaBg}
    >
      <Text fontSize="sm" color={mutedColor}>
        You&apos;re a member of this community.
      </Text>
    </Box>
  );
}

function ShelfCard({
  shelf,
  username,
  cardBg,
  mutedColor,
  borderColor,
}: {
  shelf: PublicShelf;
  username: string;
  cardBg: string;
  mutedColor: string;
  borderColor: string;
}) {
  if (shelf.items.length === 0) return null;

  return (
    <Box
      p="5"
      bg={cardBg}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
    >
      <HStack justify="space-between" mb="3">
        <Heading size="md">
          <ChakraLink asChild _hover={{ textDecoration: "underline" }}>
            <NextLink href={`/members/${username}/library/${shelf.slug === "my-writing" ? "writing" : shelf.slug}`}>
              {shelf.title}
            </NextLink>
          </ChakraLink>
        </Heading>
        <Text fontSize="xs" color={mutedColor}>
          {shelf.item_count} {shelf.item_count === 1 ? "piece" : "pieces"}
        </Text>
      </HStack>
      {shelf.summary && (
        <Text fontSize="sm" color={mutedColor} mb="3">
          {shelf.summary}
        </Text>
      )}
      <VStack gap="3" align="stretch">
        {shelf.items.map((item) => (
          <WritingItemRow
            key={item.id}
            item={item}
            username={username}
            mutedColor={mutedColor}
          />
        ))}
      </VStack>
    </Box>
  );
}

function SinglePieceCard({
  item,
  username,
  cardBg,
  mutedColor,
  borderColor,
}: {
  item: PublicShelf["items"][0];
  username: string;
  cardBg: string;
  mutedColor: string;
  borderColor: string;
}) {
  return (
    <Box
      mt="4"
      p="5"
      bg={cardBg}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
    >
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
      {item.excerpt && (
        <Text fontSize="sm" color={mutedColor} mt="2">
          {item.excerpt}
        </Text>
      )}
      <HStack mt="2" gap="3" fontSize="xs" color={mutedColor}>
        {item.published_at && (
          <Text>{new Date(item.published_at).toLocaleDateString()}</Text>
        )}
        {item.writing_kind && <Text>{item.writing_kind}</Text>}
      </HStack>
    </Box>
  );
}

function WritingItemRow({
  item,
  username,
  mutedColor,
}: {
  item: PublicShelf["items"][0];
  username: string;
  mutedColor: string;
}) {
  return (
    <Box>
      <ChakraLink
        asChild
        fontWeight="medium"
        _hover={{ textDecoration: "underline" }}
      >
        <NextLink href={`/members/${username}/writing/${item.slug}`}>
          {item.title}
        </NextLink>
      </ChakraLink>
      <HStack mt="1" gap="3" fontSize="xs" color={mutedColor}>
        {item.published_at && (
          <Text>{new Date(item.published_at).toLocaleDateString()}</Text>
        )}
        {item.writing_kind && <Text>{item.writing_kind}</Text>}
        {item.excerpt && <Text lineClamp={1}>{item.excerpt}</Text>}
      </HStack>
    </Box>
  );
}
