// apps/mixtape/src/app/(authenticated)/bazaar/vendor/orders/[id]/page.tsx

"use client";

import { use } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Badge,
  Button,
  Skeleton,
  Alert,
  Breadcrumb,
  Textarea,
  Link,
} from "@chakra-ui/react";
import { useState } from "react";
import NextLink from "next/link";
import {
  IconChevronRight,
  IconCheck,
  IconX,
  IconTruck,
  IconPackage,
} from "@tabler/icons-react";
import { useOrder, useOrderMutations } from "@mixtape/api/hooks/useBazaar";
import {
  formatPrice,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOfferingShapeLabel,
  OrderAction,
} from "@mixtape/core/types/bazaarTypes";
import { Divider } from "@/components/common/Divider";

interface VendorOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * VENDOR ORDER DETAIL PAGE
 *
 * Allows vendors to view full order details and manage order status.
 */
export default function VendorOrderDetailPage({ params }: VendorOrderDetailPageProps) {
  const { id } = use(params);

  // State
  const [vendorNote, setVendorNote] = useState("");

  // Fetch order
  const { order, isLoading, error, refetch } = useOrder(id);

  // Mutations
  const { action: orderAction, isActioning } = useOrderMutations();

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle action
  const handleAction = async (action: OrderAction) => {
    if (!order) return;

    try {
      await orderAction({
        id: order.id,
        data: {
          action,
          vendor_note: vendorNote || undefined,
        },
      });
      refetch();
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Skeleton height="24px" width="200px" mb={8} />
        <Skeleton height="400px" />
      </Container>
    );
  }

  // Error
  if (error) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>Error loading order: {error.message}</Alert.Title>
        </Alert.Root>
      </Container>
    );
  }

  // Not found
  if (!order) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert.Root status="warning">
          <Alert.Indicator />
          <Alert.Title>Order not found.</Alert.Title>
        </Alert.Root>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      {/* Breadcrumb */}
      <Breadcrumb.Root mb={6}>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link as={NextLink} href="/bazaar/vendor">
              Vendor Dashboard
            </Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator>
            <IconChevronRight size={14} />
          </Breadcrumb.Separator>
          <Breadcrumb.Item>
            <Breadcrumb.CurrentLink>Order #{order.id.slice(0, 8)}</Breadcrumb.CurrentLink>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>

      <Box display={{ md: "flex" }} gap={6}>
        {/* Left - Order details */}
        <VStack align="stretch" flex="1" gap={6}>
          {/* Status card */}
          <Card.Root>
            <Card.Body>
              <HStack justify="space-between">
                <VStack align="start" gap={1}>
                  <Text color="gray.500" fontSize="sm">
                    Order Status
                  </Text>
                  <Badge
                    colorPalette={getOrderStatusColor(order.status)}
                    fontSize="md"
                    px={3}
                    py={1}
                  >
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                </VStack>
                <VStack align="end" gap={1}>
                  <Text color="gray.500" fontSize="sm">
                    Order ID
                  </Text>
                  <Text fontFamily="mono" fontSize="sm">
                    {order.id}
                  </Text>
                </VStack>
              </HStack>
            </Card.Body>
          </Card.Root>

          {/* Offering details */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">Order Details</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="start" gap={3}>
                <HStack>
                  <Badge>{getOfferingShapeLabel(order.offering.shape)}</Badge>
                </HStack>
                <Text fontWeight="medium" fontSize="lg">
                  {order.offering.title}
                </Text>
                <Text color="gray.600">{order.offering.summary}</Text>

                <Divider />

                <HStack justify="space-between" width="100%">
                  <Text>Amount</Text>
                  <Text fontWeight="bold" fontSize="xl">
                    {order.amount === 0
                      ? "FREE"
                      : formatPrice(order.amount, order.currency)}
                  </Text>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Buyer note */}
          {order.buyer_note && (
            <Card.Root>
              <Card.Header>
                <Heading size="md">Buyer's Note</Heading>
              </Card.Header>
              <Card.Body>
                <Text>{order.buyer_note}</Text>
              </Card.Body>
            </Card.Root>
          )}

          {/* Timeline */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">Order Timeline</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={3}>
                <HStack>
                  <IconCheck size={18} color="green" />
                  <Text>Order placed</Text>
                  <Text color="gray.500" fontSize="sm" ml="auto">
                    {formatDate(order.created_at)}
                  </Text>
                </HStack>
                {order.status !== "pending" && order.status !== "cancelled" && (
                  <HStack>
                    <IconCheck size={18} color="green" />
                    <Text>Payment confirmed</Text>
                  </HStack>
                )}
                {["fulfilling", "delivered", "completed"].includes(order.status) && (
                  <HStack>
                    <IconTruck size={18} color="green" />
                    <Text>Fulfillment started</Text>
                  </HStack>
                )}
                {["delivered", "completed"].includes(order.status) && (
                  <HStack>
                    <IconPackage size={18} color="green" />
                    <Text>Delivered</Text>
                  </HStack>
                )}
                {order.status === "completed" && (
                  <HStack>
                    <IconCheck size={18} color="green" />
                    <Text>Completed</Text>
                  </HStack>
                )}
                {order.status === "cancelled" && (
                  <HStack>
                    <IconX size={18} color="red" />
                    <Text color="red.500">Cancelled</Text>
                  </HStack>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>

        {/* Right - Actions */}
        <Box width={{ base: "100%", md: "350px" }} mt={{ base: 6, md: 0 }}>
          <Card.Root position="sticky" top="100px">
            <Card.Header>
              <Heading size="md">Actions</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={4}>
                {/* Add vendor note */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Add a note (optional)
                  </Text>
                  <Textarea
                    value={vendorNote}
                    onChange={(e) => setVendorNote(e.target.value)}
                    placeholder="Internal note or message to buyer..."
                    rows={3}
                  />
                </Box>

                <Divider />

                {/* Status-specific actions */}
                {order.status === "confirmed" && (
                  <Button
                    colorPalette="blue"
                    onClick={() => handleAction("start_fulfillment")}
                    loading={isActioning}
                  >
                    <IconTruck size={18} />
                    Start Fulfillment
                  </Button>
                )}

                {order.status === "fulfilling" && (
                  <Button
                    colorPalette="green"
                    onClick={() => handleAction("mark_delivered")}
                    loading={isActioning}
                  >
                    <IconPackage size={18} />
                    Mark as Delivered
                  </Button>
                )}

                {order.status === "delivered" && (
                  <Button
                    colorPalette="green"
                    onClick={() => handleAction("complete")}
                    loading={isActioning}
                  >
                    <IconCheck size={18} />
                    Complete Order
                  </Button>
                )}

                {/* Cancel action - available for most statuses */}
                {["pending", "confirmed", "fulfilling"].includes(order.status) && (
                  <Button
                    variant="outline"
                    colorPalette="red"
                    onClick={() => {
                      if (confirm("Are you sure you want to cancel this order?")) {
                        handleAction("cancel");
                      }
                    }}
                    loading={isActioning}
                  >
                    <IconX size={18} />
                    Cancel Order
                  </Button>
                )}

                {/* Completed or cancelled - no actions */}
                {["completed", "cancelled", "refunded"].includes(order.status) && (
                  <Text color="gray.500" textAlign="center" fontSize="sm">
                    This order has been {order.status}. No further actions available.
                  </Text>
                )}

                <Divider />

                <Button
                  variant="ghost"
                  as={NextLink}
                >
                  <Link href="/bazaar/vendor">Back to Dashboard</Link>
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Box>
      </Box>
    </Container>
  );
}
