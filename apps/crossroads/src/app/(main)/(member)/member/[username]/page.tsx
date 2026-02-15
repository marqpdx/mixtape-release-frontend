"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Badge,
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Link as ChakraLink,
  Image,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  fetchPublicMemberProfile,
  fetchPublicMemberShelves,
} from "@mixtape/api/clients/public/publicApi";
import type {
  PublicMemberProfile,
  PublicShelf,
} from "@mixtape/api/clients/public/publicApi";
import { TipTapRenderer } from "@mixtape/content/TipTapRenderer";
import NextLink from "next/link";

export default function MemberPublicPage() {
  const params = useParams();
  const username = params.username as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<PublicMemberProfile | null>(null);
  const [shelves, setShelves] = useState<PublicShelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useColorModeValue("gray.50", "gray.800");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const avatarFallbackBg = useColorModeValue("gray.300", "gray.600");
  const ctaBg = useColorModeValue("gray.50", "gray.800");
  const ctaBorderColor = useColorModeValue("gray.200", "gray.700");

  const isOwner = isAuthenticated && user?.username === username;

  useEffect(() => {
    async function load() {
      try {
        const [profileData, shelvesData] = await Promise.all([
          fetchPublicMemberProfile(username),
          fetchPublicMemberShelves(username),
        ]);
        setProfile(profileData);
        setShelves(shelvesData);
      } catch {
        setError("Member not found.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Text color={mutedColor}>{error || "Member not found."}</Text>
      </Box>
    );
  }

  // Flatten all items across shelves for "single piece" detection
  const allItems = shelves.flatMap((s) => s.items);

  return (
    <Box>
      {/* Background image banner — full width */}
      {profile.background_image_url && (
        <Box
          w="full"
          h="220px"
          overflow="hidden"
          mb="-40px"
        >
          <Image
            src={profile.background_image_url}
            alt=""
            w="full"
            h="full"
            objectFit="cover"
          />
        </Box>
      )}

      <Box maxW="3xl" mx="auto" px="6" pt={profile.background_image_url ? "0" : "10"} pb="10">
        {/* Header Block */}
        <HStack gap="4" align="end" mb="4">
          {/* Avatar */}
          <Box
            w="72px"
            h="72px"
            borderRadius="full"
            overflow="hidden"
            border="3px solid"
            borderColor={cardBg}
            flexShrink={0}
            bg={avatarFallbackBg}
            position="relative"
            zIndex={1}
          >
            {profile.avatar_url || profile.profile_image_url ? (
              <Image
                src={profile.profile_image_url || profile.avatar_url}
                alt={profile.display_name}
                w="full"
                h="full"
                objectFit="cover"
              />
            ) : (
              <Box
                w="full"
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="2xl"
                fontWeight="bold"
                color="white"
              >
                {profile.display_name.charAt(0).toUpperCase()}
              </Box>
            )}
          </Box>

          <VStack gap="0" align="start">
            <Heading size="2xl">{profile.display_name}</Heading>
            <Text color={mutedColor} fontSize="sm">
              @{profile.username}
            </Text>
          </VStack>
        </HStack>

        {profile.quick_intro && (
          <Text mb="2">{profile.quick_intro}</Text>
        )}

        {/* Group affiliations */}
        {profile.groups && profile.groups.length > 0 && (
          <HStack gap="2" flexWrap="wrap" mb="4">
            {profile.groups.map((g) => (
              <Badge
                key={g.slug}
                variant="subtle"
                size="sm"
                borderRadius="full"
                px="3"
                py="1"
              >
                {g.title}
              </Badge>
            ))}
          </HStack>
        )}

        {/* Bio */}
        {profile.bio_json && Object.keys(profile.bio_json).length > 0 && (
          <Box mb="6">
            <TipTapRenderer
              content={profile.bio_json as unknown as Parameters<typeof TipTapRenderer>[0]["content"]}
            />
          </Box>
        )}

        {/* Owner link back to workbench */}
        {isOwner && (
          <ChakraLink asChild color="blue.500" fontSize="sm" mb="4" display="inline-block">
            <NextLink href={`/app/member/${username}/library`}>
              Manage in Workbench
            </NextLink>
          </ChakraLink>
        )}

      {/* Viewer Context + CTAs */}
      <ViewerContextStrip
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        isOwner={isOwner}
        mutedColor={mutedColor}
        ctaBg={ctaBg}
        ctaBorderColor={ctaBorderColor}
      />

      {/* Writing Section */}
      {allItems.length === 0 ? (
        <Text color={mutedColor} mt="6">
          No published writing yet.
        </Text>
      ) : shelves.length === 1 && shelves[0].items.length === 1 ? (
        // Single piece — show it directly
        <SinglePieceCard
          item={allItems[0]}
          username={username}
          cardBg={cardBg}
          mutedColor={mutedColor}
          borderColor={borderColor}
        />
      ) : (
        // Multiple shelves/items
        <VStack gap="6" align="stretch" mt="2">
          {shelves.map((shelf) => (
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
    </Box>
  );
}

// --- Sub-components ---

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

  // Owner sees no CTAs — they have the workbench link
  if (isOwner) {
    return (
      <Text py="2" px="3" mb="6" fontSize="sm" color={mutedColor}>
        This is your public page.
      </Text>
    );
  }

  // Anonymous visitors
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
          You{"\u2019"}re viewing as a guest. Some content may be members-only.
        </Text>
        <HStack gap="3">
          <ChakraLink asChild fontSize="sm" color="blue.500">
            <NextLink href="/app/login">Log in to respond</NextLink>
          </ChakraLink>
          <Text fontSize="sm" color={mutedColor}>{"\u00B7"}</Text>
          <ChakraLink asChild fontSize="sm" color="blue.500">
            <NextLink href="/welcome/start">Join to participate</NextLink>
          </ChakraLink>
        </HStack>
      </Box>
    );
  }

  // Logged-in, viewing another member
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
        You{"\u2019"}re a member of this community.
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
        <Heading size="md">{shelf.title}</Heading>
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
        <NextLink href={`/member/${username}/writing/${item.slug}`}>
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
        <NextLink href={`/member/${username}/writing/${item.slug}`}>
          {item.title}
        </NextLink>
      </ChakraLink>
      <HStack mt="1" gap="3" fontSize="xs" color={mutedColor}>
        {item.published_at && (
          <Text>{new Date(item.published_at).toLocaleDateString()}</Text>
        )}
        {item.writing_kind && <Text>{item.writing_kind}</Text>}
        {item.excerpt && (
          <Text lineClamp={1}>{item.excerpt}</Text>
        )}
      </HStack>
    </Box>
  );
}
