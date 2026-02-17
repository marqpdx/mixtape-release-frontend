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
import { useColorModeValue } from "@components/ui/color-mode";
import { fetchPublicGroups } from "@mixtape/api/clients/public/publicApi";
import type {
  PublicGroup,
  PublicGroupEmblem,
} from "@mixtape/api/clients/public/publicApi";

export default function CrossroadsGalleryPage() {
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutedColor = useColorModeValue("gray.500", "gray.400");

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
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Text color={mutedColor}>{error}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="5xl" mx="auto" px="6" py="10">
      <Heading size="3xl" mb="2">
        Crossroads Gallery
      </Heading>
      <Text color={mutedColor} mb="3" maxW="2xl">
        The living directory of groups that make up this ecosystem. Communities
        hold space for circles and their members. Coalitions bridge across
        boundaries. Each group carries its own identity, culture, and creative
        output — explore them here.
      </Text>
      <Text fontSize="sm" color={mutedColor} mb="8">
        {groups.length} {groups.length === 1 ? "group" : "groups"} in the gallery
      </Text>

      {groups.length === 0 ? (
        <Text color={mutedColor}>No public groups yet.</Text>
      ) : (
        <Grid templateColumns="repeat(2, 1fr)" gap="5">
          {groups.map((group) => (
            <GridItem
              key={group.id}
              colSpan={group.group_type === "community" ? 2 : 1}
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
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const isCommunity = group.group_type === "community";

  const bgStyle = getCardBackground(group, cardBg);

  return (
    <Box
      position="relative"
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      overflow="hidden"
      minH={isCommunity ? "200px" : "160px"}
      transition="box-shadow 0.2s"
      _hover={{ boxShadow: "md" }}
    >
      {/* Background layer */}
      <Box
        position="absolute"
        inset="0"
        {...bgStyle}
      />

      {/* Dark overlay for text readability when using images */}
      {group.background_image_url && (
        <Box
          position="absolute"
          inset="0"
          bg="blackAlpha.500"
        />
      )}

      {/* Content */}
      <Box position="relative" p="5" h="full">
        <HStack gap="3" align="start" mb="3">
          {/* Emblem */}
          <EmblemBadge emblem={group.emblem} title={group.title} />

          <VStack gap="0" align="start" flex="1">
            <Heading
              size={isCommunity ? "lg" : "md"}
              color={group.background_image_url ? "white" : undefined}
            >
              {group.title}
            </Heading>
            <HStack gap="2">
              <Badge
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
                color={group.background_image_url ? "whiteAlpha.800" : mutedColor}
              >
                {group.member_count} {group.member_count === 1 ? "member" : "members"}
              </Text>
            </HStack>
          </VStack>
        </HStack>

        {group.quick_intro && (
          <Text
            fontSize="sm"
            color={group.background_image_url ? "whiteAlpha.900" : mutedColor}
            lineClamp={isCommunity ? 3 : 2}
          >
            {group.quick_intro}
          </Text>
        )}

        {/* Decorator badges */}
        {group.decorators && group.decorators.length > 0 && (
          <HStack gap="1" flexWrap="wrap" mt="3">
            {group.decorators.slice(0, 4).map((d) => (
              <Badge
                key={d}
                variant="outline"
                size="sm"
                borderRadius="full"
                px="2"
                fontSize="2xs"
                color={group.background_image_url ? "whiteAlpha.800" : undefined}
                borderColor={group.background_image_url ? "whiteAlpha.400" : undefined}
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
  const fallbackBg = useColorModeValue("gray.300", "gray.600");

  if (emblem?.image_url) {
    return (
      <Box
        w="40px"
        h="40px"
        borderRadius="full"
        overflow="hidden"
        flexShrink={0}
        border="2px solid"
        borderColor="whiteAlpha.600"
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

  // Color-based fallback
  const bg = emblem?.bg || undefined;
  const fg = emblem?.fg || "white";

  return (
    <Box
      w="40px"
      h="40px"
      borderRadius="full"
      bg={bg || fallbackBg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
      border="2px solid"
      borderColor="whiteAlpha.600"
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
