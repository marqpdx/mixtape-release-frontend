// apps/mixtape/src/app/(authenticated)/bazaar/orders/[id]/page.tsx

"use client";

import { use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Breadcrumb,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { IconChevronRight, IconCheck, IconX } from "@tabler/icons-react";
import { useOrder, useOrderMutations } from "@mixtape/api/hooks/useBazaar";
import {
  formatPrice,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOfferingShapeLabel,
  isOrderCancellable,
} from "@mixtape/core/types/bazaarTypes";
import { toaster } from "@mixtape/core/lib/toaster";
import { MixtapeAlert } from "@/components/ui/alerts/MixtapeAlert";
import { Divider } from "@/components/common/Divider";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * ORDER DETAIL PAGE
 *
 * Shows full order details, status timeline, and available actions.
 */
export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for success redirect
  const isSuccess = searchParams.get("success") === "true";

  // Fetch order
  const { order, isLoading, error, refetch } = useOrder(id);

  // Mutations
  const { action: orderAction, isActioning } = useOrderMutations();

  // Show success toast
  useEffect(() => {
    if (isSuccess && order) {
      toaster.create({
        title: "Payment successful!",
        description: "Your order has been confirmed.",
        type: "success",
      });
      // Clear the query param
      router.replace(`/bazaar/orders/${id}`);
    }
  }, [isSuccess, order, router, id]);

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

  // Handle cancel order
  const handleCancel = async () => {
    if (!order) return;

    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      await orderAction({
        id: order.id,
        data: { action: "cancel", reason: "Cancelled by buyer" },
      });
      toaster.create({
        title: "Order cancelled",
        type: "info",
      });
      refetch();
    } catch {
      toaster.create({
        title: "Failed to cancel order",
        type: "error",
      });
    }
  };

  // Handle complete order
  const handleComplete = async () => {
    if (!order) return;

    try {
      await orderAction({
        id: order.id,
        data: { action: "complete" },
      });
      toaster.create({
        title: "Order marked as complete",
        type: "success",
      });
      refetch();
    } catch {
      toaster.create({
        title: "Failed to complete order",
        type: "error",
      });
    }
  };

  // Loading
  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Skeleton height="24px" width="200px" mb={8} />
        <Skeleton height="300px" />
      </Container>
    );
  }

  // Error
  if (error) {
    return (
      <Container maxW="container.lg" py={8}>
        <MixtapeAlert status="error" description={`Error loading order: ${error.message}`} />
      </Container>
    );
  }

  // Not found
  if (!order) {
    return (
      <Container maxW="container.lg" py={8}>
        <MixtapeAlert status="warning" description="Order not found." />
      </Container>
    );
  }

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
            <Breadcrumb.Link as={NextLink} href="/bazaar/orders">
              My Orders
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

      {/* Success banner */}
      {order.status === "confirmed" && (
        <Box mb={6} borderRadius="md">
          <MixtapeAlert status="success" description={'Payment Confirmed. Your order is being processed. You\'ll be notified when it\'s ready.'} />
        </Box>
      )}

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
                    colorScheme={getOrderStatusColor(order.status)}
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
                    {order.id.slice(0, 8)}...
                  </Text>
                </VStack>
              </HStack>
            </Card.Body>
          </Card.Root>

          {/* Offering details */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">What you ordered</Heading>
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
                {order.offering.sponsor_display_name && (
                  <Text color="gray.500" fontSize="sm">
                    From: {order.offering.sponsor_display_name}
                  </Text>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>

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
                    <IconCheck size={18} color="green" />
                    <Text>Fulfillment started</Text>
                  </HStack>
                )}
                {["delivered", "completed"].includes(order.status) && (
                  <HStack>
                    <IconCheck size={18} color="green" />
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

          {/* Notes */}
          {order.buyer_note && (
            <Card.Root>
              <Card.Header>
                <Heading size="md">Your Note</Heading>
              </Card.Header>
              <Card.Body>
                <Text>{order.buyer_note}</Text>
              </Card.Body>
            </Card.Root>
          )}
        </VStack>

        {/* Right - Summary & actions */}
        <Box width={{ base: "100%", md: "300px" }} mt={{ base: 6, md: 0 }}>
          <Card.Root position="sticky" top="100px">
            <Card.Header>
              <Heading size="md">Order Summary</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between">
                  <Text>Total</Text>
                  <Text fontWeight="bold" fontSize="xl">
                    {order.amount === 0
                      ? "FREE"
                      : formatPrice(order.amount, order.currency)}
                  </Text>
                </HStack>

                <Divider />

                {/* Actions */}
                {order.status === "pending" && (
                  <Button
                    colorScheme="blue"
                    onClick={() => router.push(`/bazaar/checkout/${order.id}`)}
                  >
                    Complete Payment
                  </Button>
                )}

                {order.status === "delivered" && (
                  <Button
                    colorScheme="green"
                    onClick={handleComplete}
                    loading={isActioning}
                  >
                    Mark as Complete
                  </Button>
                )}

                {isOrderCancellable(order) && (
                  <Button
                    variant="outline"
                    colorScheme="red"
                    onClick={handleCancel}
                    loading={isActioning}
                  >
                    Cancel Order
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={() => router.push(`/bazaar/offering/${order.offering.id}`)}
                >
                  View Offering
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Box>
      </Box>
    </Container>
  );
}
