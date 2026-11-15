"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Grid,
  GridItem,
  Heading,
  HStack,
  Image,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { fetchPublicGroups } from "@mixtape/api/clients/public/publicApi";
import type {
  PublicGroup,
  PublicGroupEmblem,
} from "@mixtape/api/clients/public/publicApi";

export default function CrossroadsGalleryPage() {
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPublicGroups();
        setGroups(data);
      } catch {
        setError("Could not load groups.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <Box className="cgal-loading" bg="theme.bg" color="theme.textMuted" role="status" aria-label="Loading groups" px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="cgal-error" bg="theme.bg" color="theme.text" px="6" py="20" textAlign="center">
        <Text role="alert" color="status.danger.fg">{error}</Text>
      </Box>
    );
  }

  return (
    <Box className="cgal-root" bg="theme.bg" color="theme.text" maxW="5xl" mx="auto" px="6" py="10">
      <Heading size="3xl" mb="2">
        Crossroads Gallery
      </Heading>
      <Text color="theme.textMuted" mb="3" maxW="2xl">
        The living directory of groups that make up this ecosystem. Communities
        hold space for circles and their members. Coalitions bridge across
        boundaries. Each group carries its own identity, culture, and creative
        output — explore them here.
      </Text>
      <Text fontSize="sm" color="theme.textMuted" mb="8">
        {groups.length} {groups.length === 1 ? "group" : "groups"} in the gallery
      </Text>

      {groups.length === 0 ? (
        <Text color="theme.textMuted">No public groups yet.</Text>
      ) : (
        <Grid className="cgal-grid" templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }} gap="5">
          {groups.map((group) => (
            <GridItem
              className="cgal-grid-item"
              key={group.id}
              colSpan={{ base: 1, md: group.group_type === "community" ? 2 : 1 }}
            >
              <GroupCard group={group} />
            </GridItem>
          ))}
        </Grid>
      )}
    </Box>
  );
}

// --- Sub-components ---

function GroupCard({ group }: { group: PublicGroup }) {
  const isCommunity = group.group_type === "community";

  const bgStyle = getCardBackground(group, "theme.surface");

  return (
    <Box
      className="cgal-card"
      bg="theme.surface"
      color="theme.text"
      position="relative"
      borderRadius="lg"
      border="1px solid"
      borderColor="ui.borderSubtle"
      overflow="hidden"
      minH={isCommunity ? "200px" : "160px"}
      transition="box-shadow 0.2s"
      _hover={{ boxShadow: "var(--ui-shadow-raised)" }}
    >
      {/* Background layer */}
      <Box
        className="cgal-artwork"
        position="absolute"
        inset="0"
        {...bgStyle}
      />

      {/* Content */}
      <Box className="cgal-copy" position="relative" bg="theme.surface" color="theme.text" borderRadius="md" m="3" p="5" overflowWrap="anywhere">
        <HStack className="cgal-card-heading" gap="3" align="start" mb="3">
          {/* Emblem */}
          <EmblemBadge emblem={group.emblem} title={group.title} />

          <VStack className="cgal-card-title" gap="0" align="start" flex="1" minW="0">
            <Heading
              maxW="full"
              overflowWrap="anywhere"
              size={isCommunity ? "lg" : "md"}
              color="theme.text"
            >
              {group.title}
            </Heading>
            <HStack className="cgal-meta" gap="2" wrap="wrap">
              <Badge
                bg="ui.surfaceSubtle"
                color="theme.text"
                variant="subtle"
                size="sm"
                borderRadius="full"
                px="2"
                textTransform="capitalize"
              >
                {group.group_type}
              </Badge>
              <Text
                fontSize="xs"
                color="theme.textMuted"
              >
                {group.member_count} {group.member_count === 1 ? "member" : "members"}
              </Text>
            </HStack>
          </VStack>
        </HStack>

        {group.quick_intro && (
          <Text
            fontSize="sm"
            color="theme.textMuted"
            lineClamp={isCommunity ? 3 : 2}
          >
            {group.quick_intro}
          </Text>
        )}

        {/* Decorator badges */}
        {group.decorators && group.decorators.length > 0 && (
          <HStack className="cgal-decorators" gap="1" flexWrap="wrap" mt="3">
            {group.decorators.slice(0, 4).map((d) => (
              <Badge
                key={d}
                variant="outline"
                size="sm"
                borderRadius="full"
                px="2"
                fontSize="2xs"
                bg="ui.surfaceSubtle"
                color="theme.text"
                borderColor="ui.borderSubtle"
              >
                {formatDecorator(d)}
              </Badge>
            ))}
          </HStack>
        )}
      </Box>
    </Box>
  );
}

function EmblemBadge({
  emblem,
  title,
}: {
  emblem: PublicGroupEmblem | null;
  title: string;
}) {
  if (emblem?.image_url) {
    return (
      <Box
        className="cgal-emblem-image"
        w="40px"
        h="40px"
        borderRadius="full"
        overflow="hidden"
        flexShrink={0}
        border="2px solid"
        borderColor="ui.borderSubtle"
      >
        <Image
          src={emblem.image_url}
          alt={title}
          w="full"
          h="full"
          objectFit="cover"
        />
      </Box>
    );
  }

  // Supplied emblem colours are artwork; absent colours use a semantic initials pair.
  const bg = emblem?.bg || undefined;
  const fg = emblem?.fg || (bg ? "white" : "theme.text");

  return (
    <Box
      className="cgal-emblem-initial"
      w="40px"
      h="40px"
      borderRadius="full"
      bg={bg || "ui.surfaceSubtle"}
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      border="2px solid"
      borderColor="ui.borderSubtle"
    >
      <Text fontSize="md" fontWeight="bold" color={fg}>
        {title.charAt(0).toUpperCase()}
      </Text>
    </Box>
  );
}

// --- Helpers ---

function getCardBackground(
  group: PublicGroup,
  fallbackBg: string
): Record<string, string> {
  if (group.background_image_url) {
    return {
      backgroundImage: `url(${group.background_image_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  if (group.emblem?.bg) {
    const bg = group.emblem.bg;
    const palette = group.emblem.palette;
    if (palette && palette.length >= 2) {
      return {
        background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
      };
    }
    return {
      background: `linear-gradient(135deg, ${bg}, ${lighten(bg)})`,
    };
  }

  return { bg: fallbackBg };
}

function lighten(hex: string): string {
  // Simple lighten: blend toward white by ~40%
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const blend = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.4));
  return `#${blend(r).toString(16).padStart(2, "0")}${blend(g).toString(16).padStart(2, "0")}${blend(b).toString(16).padStart(2, "0")}`;
}

function formatDecorator(code: string): string {
  // "education_hub" → "Education Hub"
  return code
    .replace(/^(isA__|can__|has__)/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
