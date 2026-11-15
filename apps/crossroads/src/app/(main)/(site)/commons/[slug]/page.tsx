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
import {
  fetchPublicCommonsDetail,
  type PublicCommonsDetail,
  type PublicCommonsFilament,
} from "@mixtape/api/clients/public/publicApi";

const commonsLinkStyles = {
  color: "theme.text",
  textDecoration: "underline",
  _hover: { color: "theme.text" },
  _focusVisible: {
    outline: "3px solid",
    outlineColor: "ui.borderControl",
    outlineOffset: "2px",
  },
} as const;

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
  return (
    <HStack className="cmdt-filament" gap={2} fontSize="sm" wrap="wrap">
      <Text color="theme.textMuted" minW="140px">
        {relationLabel(filament.relation_type, filament.direction)}
      </Text>
      <ChakraLink as={NextLink} href={`/commons/${filament.related_slug}`} {...commonsLinkStyles}>
        {filament.related_title}
      </ChakraLink>
      {filament.note && (
        <Text color="theme.textMuted" fontStyle="italic">
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
      <Box
        className="cmdt-loading"
        bg="theme.bg"
        color="theme.textMuted"
        role="status"
        aria-label="Loading entry"
        textAlign="center"
        py={20}
      >
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || !item) {
    return (
      <Box
        className="cmdt-error"
        bg="theme.bg"
        color="theme.text"
        maxW="720px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={12}
      >
        <Text role="alert" color="status.danger.fg">{error ?? "Entry not found."}</Text>
        <ChakraLink as={NextLink} href="/commons" {...commonsLinkStyles} fontSize="sm" mt={4} display="block">
          ← Back to Commons
        </ChakraLink>
      </Box>
    );
  }

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
    <Box
      className="cmdt-root"
      bg="theme.bg"
      color="theme.text"
      maxW="720px"
      mx="auto"
      px={{ base: 4, md: 6 }}
      py={10}
    >
      {/* Back */}
      <ChakraLink
        as={NextLink}
        href="/commons"
        fontSize="sm"
        {...commonsLinkStyles}
        display="block"
        mb={6}
      >
        ← Commons
      </ChakraLink>

      {/* Title + meta */}
      <VStack className="cmdt-header" align="start" gap={2} mb={6}>
        <HStack className="cmdt-heading" gap={2} wrap="wrap">
          <Text fontSize="3xl" fontWeight="bold" lineHeight="tight">
            {item.title}
          </Text>
          {item.item_type && (
            <Badge bg="ui.surfaceSubtle" color="theme.text" borderRadius="full">
              {item.item_type}
            </Badge>
          )}
        </HStack>

        <HStack className="cmdt-meta" gap={3} wrap="wrap">
          {item.location_name && (
            <Text fontSize="sm" color="theme.textMuted">
              {item.location_name}
            </Text>
          )}
          {item.founder && (
            <Text fontSize="sm" color="theme.textMuted">
              Founded by {item.founder}
            </Text>
          )}
        </HStack>
      </VStack>

      {/* Recommendation — primary, shown first */}
      {item.why_recommended && (
        <Box
          className="cmdt-recommendation"
          borderLeft="3px solid"
          borderColor="ui.borderSubtle"
          pl={4}
          py={1}
          mb={8}
        >
          <Text
            fontSize="md"
            fontStyle="italic"
            color="theme.text"
            lineHeight="tall"
          >
            "{item.why_recommended}"
          </Text>
          {item.recommended_by_name && (
            <Text fontSize="xs" color="theme.textMuted" mt={2}>
              — {item.recommended_by_name}
            </Text>
          )}
        </Box>
      )}

      {/* Summary */}
      {item.summary && (
        <Text fontSize="md" color="theme.textMuted" mb={6} lineHeight="tall">
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
        <Box className="cmdt-links" mb={8}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="theme.textMuted"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={3}
          >
            Links
          </Text>
          <HStack className="cmdt-external-links" gap={4} wrap="wrap">
            {externalLinks.map((link) => (
              <ChakraLink
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                fontSize="sm"
                {...commonsLinkStyles}
              >
                {link.label} →
              </ChakraLink>
            ))}
          </HStack>
        </Box>
      )}

      {/* Filaments */}
      {item.filaments.length > 0 && (
        <Box className="cmdt-connections">
          <Separator borderColor="ui.borderSubtle" mb={6} />
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="theme.textMuted"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={4}
          >
            Connections
          </Text>
          <VStack className="cmdt-filaments" align="start" gap={3}>
            {item.filaments.map((f, i) => (
              <FilamentRow key={i} filament={f} />
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
