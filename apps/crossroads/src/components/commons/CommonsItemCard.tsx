"use client";

// components/commons/CommonsItemCard.tsx

import NextLink from "next/link";
import {
  Badge,
  Box,
  HStack,
  Link as ChakraLink,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { PublicCommonsItem } from "@mixtape/api/clients/public/publicApi";

interface CommonsItemCardProps {
  item: PublicCommonsItem;
}

export default function CommonsItemCard({ item }: CommonsItemCardProps) {
  return (
    <Box
      className="cmic-root"
      position="relative"
      bg="theme.surface"
      color="theme.text"
      borderWidth="1px"
      borderStyle="solid"
      borderColor="ui.borderSubtle"
      borderRadius="lg"
      p={5}
      _hover={{ borderColor: "ui.borderControl" }}
      transition="border-color 0.15s"
    >
      <VStack className="cmic-content" align="start" gap={2}>
        {/* Title + type badge */}
        <HStack className="cmic-heading" gap={2} wrap="wrap">
          <Text fontWeight="semibold" fontSize="md" lineHeight="short">
            <ChakraLink
              as={NextLink}
              href={`/commons/${item.slug}`}
              color="theme.text"
              textDecoration="underline"
              // Stretch the detail target over the card; the website stays above it.
              _before={{ content: '""', position: "absolute", inset: 0, borderRadius: "lg" }}
              _hover={{ color: "theme.text" }}
              _focusVisible={{
                outline: "none",
                _before: {
                  outline: "3px solid",
                  outlineColor: "ui.borderControl",
                  outlineOffset: "2px",
                },
              }}
            >
              {item.title}
            </ChakraLink>
          </Text>
          {item.item_type && (
            <Badge bg="ui.surfaceSubtle" color="theme.text" size="sm" borderRadius="full">
              {item.item_type}
            </Badge>
          )}
        </HStack>

        {/* Location */}
        {item.location_name && (
          <Text fontSize="xs" color="theme.textMuted">
            {item.location_name}
          </Text>
        )}

        {/* Summary */}
        {item.summary && (
          <Text fontSize="sm" color="theme.textMuted" lineClamp={2}>
            {item.summary}
          </Text>
        )}

        {/* Why recommended — the human signal, always shown if present */}
        {item.why_recommended && (
          <Text
            fontSize="sm"
            color="theme.textMuted"
            fontStyle="italic"
            lineClamp={3}
            borderLeft="2px solid"
            borderColor="ui.borderSubtle"
            pl={3}
          >
            "{item.why_recommended}"
          </Text>
        )}

        {/* Footer row */}
        <HStack className="cmic-footer" gap={3} mt={1} wrap="wrap">
          {item.recommended_by_name && (
            <Text fontSize="xs" color="theme.textMuted">
              Recommended by {item.recommended_by_name}
            </Text>
          )}
          {item.website && (
            <ChakraLink
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              fontSize="xs"
              position="relative"
              color="theme.text"
              textDecoration="underline"
              _hover={{ color: "theme.text" }}
              _focusVisible={{ outline: "3px solid", outlineColor: "ui.borderControl", outlineOffset: "2px" }}
              onClick={(e) => e.stopPropagation()}
            >
              Visit site →
            </ChakraLink>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}
