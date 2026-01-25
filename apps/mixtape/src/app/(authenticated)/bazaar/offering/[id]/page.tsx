// apps/mixtape/src/app/(authenticated)/bazaar/offering/[id]/page.tsx

"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Skeleton,
  SkeletonText,
  Card,
  Breadcrumb,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { IconChevronRight, IconShoppingCart } from "@tabler/icons-react";
import { useOffering, useOrderMutations } from "@mixtape/api/hooks/useBazaar";
import {
  formatPrice,
  getOfferingShapeLabel,
  isOfferingPurchasable,
} from "@mixtape/core/types/bazaarTypes";
import { MixtapeAlert } from "@/components/ui/alerts/MixtapeAlert";
import { Divider } from "@/components/common/Divider";

interface OfferingDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * OFFERING DETAIL PAGE
 *
 * Displays full details of an offering and allows purchase.
 */
export default function OfferingDetailPage({ params }: OfferingDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch offering data
  const { offering, isLoading, error } = useOffering(id);

  // Order mutations
  const { create: createOrder, isCreating } = useOrderMutations();

  // Handle purchase click
  const handlePurchase = async () => {
    if (!offering) return;

    try {
      const order = await createOrder({ offering_id: offering.id });
      // Redirect to checkout
      router.push(`/bazaar/checkout/${order.id}`);
    } catch (err) {
      console.error("Failed to create order:", err);
    }
  };

  // Shape colors for badges
  const shapeColors: Record<string, string> = {
    service: "purple",
    event: "blue",
    program: "teal",
    product: "orange",
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Skeleton height="24px" width="200px" mb={8} />
        <Skeleton height="48px" width="70%" mb={4} />
        <SkeletonText noOfLines={4} gap={4} mb={8} />
        <Skeleton height="100px" />
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxW="container.lg" py={8}>
        <MixtapeAlert description={`Error loading offering: ${error.message}`} status="error" />
      </Container>
    );
  }

  // Not found state
  if (!offering) {
    return (
      <Container maxW="container.lg" py={8}>
        <MixtapeAlert description="Offering not found." status="warning" />
      </Container>
    );
  }

  const canPurchase = isOfferingPurchasable(offering);

  return (
    <Container maxW="container.lg" py={8}>
      {/* Breadcrumb */}
      <Breadcrumb.Root mb={6} fontSize="sm" color="gray.500">
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link as={NextLink} href="/bazaar">
              Bazaar
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>
            <IconChevronRight size={14} />
          </Breadcrumb.Separator>
          <Breadcrumb.Item>
            <Breadcrumb.CurrentLink>{offering.title}</Breadcrumb.CurrentLink>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>

      {/* Main content */}
      <Box display={{ md: "flex" }} gap={8}>
        {/* Left column - Details */}
        <VStack align="start" gap={4} flex="1">
          {/* Shape badge */}
          <Badge
            colorScheme={shapeColors[offering.shape] || "gray"}
            fontSize="sm"
            px={3}
            py={1}
          >
            {getOfferingShapeLabel(offering.shape)}
          </Badge>

          {/* Title */}
          <Heading size="xl">{offering.title}</Heading>

          {/* Vendor */}
          {offering.sponsor_display_name && (
            <Text color="gray.600">
              Offered by{" "}
              <Text as="span" fontWeight="medium">
                {offering.sponsor_display_name}
              </Text>
            </Text>
          )}

          {/* Summary */}
          <Text fontSize="lg" color="gray.700">
            {offering.summary}
          </Text>

          <Divider my={4} />

          {/* Description */}
          {offering.description && (
            <Box>
              <Heading size="md" mb={3}>
                About this {offering.shape}
              </Heading>
              <Text color="gray.600" whiteSpace="pre-wrap">
                {offering.description}
              </Text>
            </Box>
          )}

          {/* Fulfillment info */}
          <Box mt={4}>
            <Text color="gray.500" fontSize="sm">
              Fulfillment:{" "}
              {offering.fulfillment_type === "auto"
                ? "Instant delivery"
                : offering.fulfillment_type === "manual"
                ? "Vendor will fulfill manually"
                : "External fulfillment"}
            </Text>
          </Box>
        </VStack>

        {/* Right column - Purchase card */}
        <Box width={{ base: "100%", md: "320px" }} mt={{ base: 8, md: 0 }}>
          <Card.Root variant="outline" position="sticky" top="100px">
            <Card.Body>
              <VStack gap={4} align="stretch">
                {/* Price */}
                <Box textAlign="center" py={4}>
                  {offering.is_free || offering.effective_price === 0 ? (
                    <Badge colorScheme="green" fontSize="2xl" px={4} py={2}>
                      FREE
                    </Badge>
                  ) : (
                    <Text fontSize="3xl" fontWeight="bold">
                      {formatPrice(offering.effective_price, offering.currency)}
                    </Text>
                  )}
                </Box>

                {/* Purchase button */}
                {canPurchase ? (
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={handlePurchase}
                    loading={isCreating}
                    loadingText="Creating order..."
                  >
                    <IconShoppingCart size={20} />
                    {offering.is_free ? "Get for Free" : "Buy Now"}
                  </Button>
                ) : (
                  <Button size="lg" disabled>
                    Not Available
                  </Button>
                )}

                {/* Status notice */}
                {!canPurchase && (
                  <MixtapeAlert description="This offering is currently not available for purchase." status="info" size="sm" />
                )}

                {/* Additional info */}
                <Divider />
                <VStack align="start" gap={2} fontSize="sm" color="gray.500">
                  <HStack justify="space-between" width="100%">
                    <Text>Type</Text>
                    <Text fontWeight="medium">
                      {getOfferingShapeLabel(offering.shape)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between" width="100%">
                    <Text>Visibility</Text>
                    <Text fontWeight="medium" textTransform="capitalize">
                      {offering.visibility.replace("_", " ")}
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Box>
      </Box>
    </Container>
  );
}
