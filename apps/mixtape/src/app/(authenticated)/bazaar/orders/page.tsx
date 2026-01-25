// apps/mixtape/src/app/(authenticated)/bazaar/orders/page.tsx

"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  Skeleton,
  LinkBox,
  LinkOverlay,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useOrders } from "@mixtape/api/hooks/useBazaar";
import {
  OrderStatus,
  formatPrice,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOfferingShapeLabel,
} from "@mixtape/core/types/bazaarTypes";
import { MixtapeAlert } from "@/components/ui/alerts";

/**
 * MY ORDERS PAGE
 *
 * Displays the buyer's orders with filtering by status.
 */
export default function MyOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const statusCollection = createListCollection({
    items: [
      { label: "All orders", value: "all" },
      { label: "Pending", value: "pending" },
      { label: "Confirmed", value: "confirmed" },
      { label: "In Progress", value: "fulfilling" },
      { label: "Delivered", value: "delivered" },
      { label: "Completed", value: "completed" },
      { label: "Cancelled", value: "cancelled" },
    ],
  });

  // Fetch orders
  const { orders, isLoading, error } = useOrders({
    view: "buyer",
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Container maxW="container.lg" py={8}>
      {/* Header */}
      <VStack align="start" gap={2} mb={8}>
        <Heading size="xl">My Orders</Heading>
        <Text color="gray.600">Track and manage your purchases</Text>
      </VStack>

      {/* Filter */}
      <HStack mb={6}>
        <Text color="gray.500">Filter by status:</Text>
        <Select.Root
          collection={statusCollection}
          value={[statusFilter]}
          onValueChange={({ value }) => setStatusFilter((value[0] as OrderStatus | "all") || "all")}
        >
          <Select.HiddenSelect />
          <Select.Control maxW="200px">
            <Select.Trigger>
              <Select.ValueText />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Select.Positioner>
            <Select.Content>
              {statusCollection.items.map((item) => (
                <Select.Item item={item} key={item.value}>
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </HStack>

      {/* Error state */}
      {error && (
        <Box>
          <MixtapeAlert description={`Error loading orders: ${error.message}`} status="error" />
        </Box>
      )}

      {/* Loading state */}
      {isLoading && (
        <VStack gap={4}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height="120px" width="100%" />
          ))}
        </VStack>
      )}

      {/* Empty state */}
      {!isLoading && orders.length === 0 && (
        <Box textAlign="center" py={12}>
          <Text color="gray.500" fontSize="lg">
            {statusFilter === "all"
              ? "You haven't made any purchases yet."
              : `No orders with status "${getOrderStatusLabel(statusFilter as OrderStatus)}".`}
          </Text>
          <Text color="gray.400" mt={2}>
            <NextLink href="/bazaar">
              <Text as="span" color="blue.500" _hover={{ textDecoration: "underline" }}>
                Browse the Bazaar
              </Text>
            </NextLink>{" "}
            to find something you like.
          </Text>
        </Box>
      )}

      {/* Orders list */}
      {!isLoading && orders.length > 0 && (
        <VStack gap={4} align="stretch">
          {orders.map((order) => (
            <LinkBox key={order.id}>
              <Card.Root
                variant="outline"
                _hover={{ shadow: "sm", borderColor: "gray.300" }}
                transition="all 0.2s"
              >
                <Card.Body>
                  <HStack justify="space-between" align="start">
                    {/* Left side - Order info */}
                    <VStack align="start" gap={2}>
                      <HStack>
                        <Badge colorScheme={getOrderStatusColor(order.status)}>
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                        <Badge variant="outline">
                          {getOfferingShapeLabel(order.offering.shape)}
                        </Badge>
                      </HStack>

                      <LinkOverlay as={NextLink} href={`/bazaar/orders/${order.id}`}>
                        <Text fontWeight="medium" fontSize="lg">
                          {order.offering.title}
                        </Text>
                      </LinkOverlay>

                      <Text color="gray.500" fontSize="sm">
                        Ordered on {formatDate(order.created_at)}
                      </Text>

                      {order.offering.sponsor_display_name && (
                        <Text color="gray.500" fontSize="sm">
                          From: {order.offering.sponsor_display_name}
                        </Text>
                      )}
                    </VStack>

                    {/* Right side - Amount */}
                    <VStack align="end" gap={1}>
                      <Text fontWeight="bold" fontSize="lg">
                        {order.amount === 0
                          ? "FREE"
                          : formatPrice(order.amount, order.currency)}
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        Order #{order.id.slice(0, 8)}
                      </Text>
                    </VStack>
                  </HStack>
                </Card.Body>
              </Card.Root>
            </LinkBox>
          ))}
        </VStack>
      )}
    </Container>
  );
}
