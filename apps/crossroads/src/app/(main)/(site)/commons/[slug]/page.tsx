"use client";

// app/(main)/(site)/commons/[slug]/page.tsx

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NextLink from "next/link";
import {
  Badge,
  Box,
  HStack,
  Link as ChakraLink,
  Separator,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  fetchPublicCommonsDetail,
  type PublicCommonsDetail,
  type PublicCommonsFilament,
} from "@mixtape/api/clients/public/publicApi";

const TYPE_COLORS: Record<string, string> = {
  person: "purple",
  organization: "blue",
  group: "teal",
  project: "orange",
  place: "green",
  event: "red",
};

// Human-readable filament relation labels
function relationLabel(relationType: string, direction: "in" | "out"): string {
  const labels: Record<string, [string, string]> = {
    founded_by: ["Founded by", "Founder of"],
    collaborates_with: ["Collaborates with", "Collaborates with"],
    located_in: ["Located in", "Location for"],
    teaches_at: ["Teaches at", "Hosts"],
    inspired_by: ["Inspired by", "Inspired"],
    affiliated_with: ["Affiliated with", "Affiliated with"],
  };
  const pair = labels[relationType];
  if (pair) return direction === "out" ? pair[0] : pair[1];
  return relationType.replace(/_/g, " ");
}

function FilamentRow({ filament }: { filament: PublicCommonsFilament }) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  return (
    <HStack gap={2} fontSize="sm">
      <Text color={mutedColor} minW="140px">
        {relationLabel(filament.relation_type, filament.direction)}
      </Text>
      <ChakraLink as={NextLink} href={`/commons/${filament.related_slug}`} color="blue.500">
        {filament.related_title}
      </ChakraLink>
      {filament.note && (
        <Text color={mutedColor} fontStyle="italic">
          — {filament.note}
        </Text>
      )}
    </HStack>
  );
}

export default function CommonsDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [item, setItem] = useState<PublicCommonsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const quoteColor = useColorModeValue("gray.700", "gray.200");
  const quoteBorderColor = useColorModeValue("gray.300", "gray.600");
  const sectionLabelColor = useColorModeValue("gray.400", "gray.500");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPublicCommonsDetail(slug);
        setItem(data);
      } catch {
        setError("Entry not found.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || !item) {
    return (
      <Box maxW="720px" mx="auto" px={{ base: 4, md: 6 }} py={12}>
        <Text color="red.500">{error ?? "Entry not found."}</Text>
        <ChakraLink as={NextLink} href="/commons" color="blue.500" fontSize="sm" mt={4} display="block">
          ← Back to Commons
        </ChakraLink>
      </Box>
    );
  }

  const typeColor = TYPE_COLORS[item.item_type] ?? "gray";

  // Collect external links
  const externalLinks = [
    item.website && { label: "Website", href: item.website },
    item.instagram && { label: "Instagram", href: item.instagram },
    item.youtube && { label: "YouTube", href: item.youtube },
    item.rss && { label: "RSS", href: item.rss },
    item.contact_email && {
      label: "Contact",
      href: `mailto:${item.contact_email}`,
    },
    ...(item.contact_links
      ? Object.entries(item.contact_links).map(([label, href]) => ({
          label,
          href,
        }))
      : []),
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <Box maxW="720px" mx="auto" px={{ base: 4, md: 6 }} py={10}>
      {/* Back */}
      <ChakraLink
        as={NextLink}
        href="/commons"
        fontSize="sm"
        color={mutedColor}
        display="block"
        mb={6}
      >
        ← Commons
      </ChakraLink>

      {/* Title + meta */}
      <VStack align="start" gap={2} mb={6}>
        <HStack gap={2} wrap="wrap">
          <Text fontSize="3xl" fontWeight="bold" lineHeight="tight">
            {item.title}
          </Text>
          {item.item_type && (
            <Badge colorPalette={typeColor} borderRadius="full">
              {item.item_type}
            </Badge>
          )}
        </HStack>

        <HStack gap={3} wrap="wrap">
          {item.location_name && (
            <Text fontSize="sm" color={mutedColor}>
              {item.location_name}
            </Text>
          )}
          {item.founder && (
            <Text fontSize="sm" color={mutedColor}>
              Founded by {item.founder}
            </Text>
          )}
        </HStack>
      </VStack>

      {/* Recommendation — primary, shown first */}
      {item.why_recommended && (
        <Box
          borderLeft="3px solid"
          borderColor={quoteBorderColor}
          pl={4}
          py={1}
          mb={8}
        >
          <Text
            fontSize="md"
            fontStyle="italic"
            color={quoteColor}
            lineHeight="tall"
          >
            "{item.why_recommended}"
          </Text>
          {item.recommended_by_name && (
            <Text fontSize="xs" color={mutedColor} mt={2}>
              — {item.recommended_by_name}
            </Text>
          )}
        </Box>
      )}

      {/* Summary */}
      {item.summary && (
        <Text fontSize="md" color={mutedColor} mb={6} lineHeight="tall">
          {item.summary}
        </Text>
      )}

      {/* Body */}
      {item.body && (
        <Text fontSize="md" mb={8} lineHeight="tall" whiteSpace="pre-wrap">
          {item.body}
        </Text>
      )}

      {/* External links */}
      {externalLinks.length > 0 && (
        <Box mb={8}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color={sectionLabelColor}
            textTransform="uppercase"
            letterSpacing="wide"
            mb={3}
          >
            Links
          </Text>
          <HStack gap={4} wrap="wrap">
            {externalLinks.map((link) => (
              <ChakraLink
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                fontSize="sm"
                color="blue.500"
              >
                {link.label} →
              </ChakraLink>
            ))}
          </HStack>
        </Box>
      )}

      {/* Filaments */}
      {item.filaments.length > 0 && (
        <Box>
          <Separator mb={6} />
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color={sectionLabelColor}
            textTransform="uppercase"
            letterSpacing="wide"
            mb={4}
          >
            Connections
          </Text>
          <VStack align="start" gap={3}>
            {item.filaments.map((f, i) => (
              <FilamentRow key={i} filament={f} />
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
