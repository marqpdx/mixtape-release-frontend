// components/bazaar/offerings/OfferingCard.tsx

"use client";

import {
  Box,
  Card,
  Text,
  HStack,
  VStack,
  Badge,
  LinkBox,
  LinkOverlay,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { IconTag, IconPackage } from "@tabler/icons-react";
import {
  Offering,
  formatPrice,
  getOfferingShapeLabel,
} from "@mixtape/core/types/bazaarTypes";

interface OfferingCardProps {
  offering: Offering;
  showSponsor?: boolean;
}

/**
 * Offering Card Component
 *
 * Displays an offering in a card format for catalog/grid views.
 */
export default function OfferingCard({
  offering,
  showSponsor = true,
}: OfferingCardProps) {
  const shapeLabel = getOfferingShapeLabel(offering.shape);

  return (
    <LinkBox>
      <Card.Root
        variant="outline"
        _hover={{ shadow: "md", borderColor: "gray.300" }}
        transition="all 0.2s"
        height="100%"
      >
        <Card.Body>
          <VStack align="stretch" gap={3} height="100%">
            {/* Badges */}
            <HStack gap={2} flexWrap="wrap">
              <Badge colorPalette="blue" size="sm">
                {shapeLabel}
              </Badge>
              {offering.asset_title && (
                <Badge variant="outline" size="sm">
                  <HStack gap={1}>
                    <IconPackage size={12} />
                    <Text>{offering.asset_title}</Text>
                  </HStack>
                </Badge>
              )}
            </HStack>

            {/* Title */}
            <LinkOverlay as={NextLink} href={`/bazaar/offering/${offering.id}`}>
              <Text fontWeight="semibold" fontSize="lg" lineClamp={2}>
                {offering.title}
              </Text>
            </LinkOverlay>

            {/* Summary */}
            {offering.summary && (
              <Text color="gray.600" fontSize="sm" lineClamp={2}>
                {offering.summary}
              </Text>
            )}

            {/* Spacer */}
            <Box flex="1" />

            {/* Price & Sponsor */}
            <VStack align="stretch" gap={2}>
              <HStack justify="space-between">
                <HStack>
                  <IconTag size={16} color="gray" />
                  <Text fontWeight="bold" fontSize="lg">
                    {offering.is_free || offering.effective_price === 0
                      ? "FREE"
                      : formatPrice(offering.effective_price, offering.currency)}
                  </Text>
                </HStack>
              </HStack>

              {showSponsor && offering.sponsor_display_name && (
                <Text fontSize="xs" color="gray.500">
                  by {offering.sponsor_display_name}
                </Text>
              )}
            </VStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  );
}
