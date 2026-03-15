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
import { useColorModeValue } from "@components/ui/color-mode";
import type { PublicCommonsItem } from "@mixtape/api/clients/public/publicApi";

const TYPE_COLORS: Record<string, string> = {
  person: "purple",
  organization: "blue",
  group: "teal",
  project: "orange",
  place: "green",
  event: "red",
};

interface CommonsItemCardProps {
  item: PublicCommonsItem;
}

export default function CommonsItemCard({ item }: CommonsItemCardProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const quoteColor = useColorModeValue("gray.600", "gray.300");
  const hoverBorderColor = useColorModeValue("gray.300", "gray.600");

  const typeColor = TYPE_COLORS[item.item_type] ?? "gray";

  return (
    <ChakraLink
      as={NextLink}
      href={`/commons/${item.slug}`}
      display="block"
      _hover={{ textDecoration: "none" }}
    >
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={5}
      _hover={{ borderColor: hoverBorderColor }}
      transition="border-color 0.15s"
    >
      <VStack align="start" gap={2}>
        {/* Title + type badge */}
        <HStack gap={2} wrap="wrap">
          <Text fontWeight="semibold" fontSize="md" lineHeight="short">
            {item.title}
          </Text>
          {item.item_type && (
            <Badge colorPalette={typeColor} size="sm" borderRadius="full">
              {item.item_type}
            </Badge>
          )}
        </HStack>

        {/* Location */}
        {item.location_name && (
          <Text fontSize="xs" color={mutedColor}>
            {item.location_name}
          </Text>
        )}

        {/* Summary */}
        {item.summary && (
          <Text fontSize="sm" color={mutedColor} lineClamp={2}>
            {item.summary}
          </Text>
        )}

        {/* Why recommended — the human signal, always shown if present */}
        {item.why_recommended && (
          <Text
            fontSize="sm"
            color={quoteColor}
            fontStyle="italic"
            lineClamp={3}
            borderLeft="2px solid"
            borderColor={hoverBorderColor}
            pl={3}
          >
            "{item.why_recommended}"
          </Text>
        )}

        {/* Footer row */}
        <HStack gap={3} mt={1} wrap="wrap">
          {item.recommended_by_name && (
            <Text fontSize="xs" color={mutedColor}>
              Recommended by {item.recommended_by_name}
            </Text>
          )}
          {item.website && (
            <ChakraLink
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              fontSize="xs"
              color="blue.500"
              onClick={(e) => e.stopPropagation()}
            >
              Visit site →
            </ChakraLink>
          )}
        </HStack>
      </VStack>
    </Box>
    </ChakraLink>
  );
}
