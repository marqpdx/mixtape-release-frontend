// apps/mixtape/src/components/bazaar/vendor/VendorOrdersList.tsx

"use client";

import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  Skeleton,
  Button,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import {
  Order,
  formatPrice,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOfferingShapeLabel,
  OrderAction,
} from "@mixtape/core/types/bazaarTypes";
import { useOrderMutations } from "@mixtape/api/hooks/useBazaar";

interface VendorOrdersListProps {
  orders: Order[];
  isLoading?: boolean;
  compact?: boolean;
  onStatusChange?: () => void;
}

/**
 * Vendor Orders List
 *
 * Displays orders for a vendor with action buttons.
 */
export default function VendorOrdersList({
  orders,
  isLoading = false,
  compact = false,
  onStatusChange,
}: VendorOrdersListProps) {
  const router = useRouter();
  const { action: orderAction, isActioning } = useOrderMutations();

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: compact ? undefined : "2-digit",
      minute: compact ? undefined : "2-digit",
    });
  };

  // Handle status update
  const handleStatusUpdate = async (orderId: string, action: OrderAction) => {
    try {
      await orderAction({
        id: orderId,
        data: { action },
      });
      onStatusChange?.();
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };

  if (isLoading) {
    return (
      <VStack gap={3} align="stretch">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={compact ? "60px" : "100px"} />
        ))}
      </VStack>
    );
  }

  if (orders.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">No orders to display.</Text>
      </Box>
    );
  }

  return (
    <VStack gap={3} align="stretch">
      {orders.map((order) => (
        <Card.Root key={order.id} variant="outline">
          <Card.Body>
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
              {/* Order Info */}
              <VStack align="start" gap={1}>
                <HStack gap={2}>
                  <Badge colorPalette={getOrderStatusColor(order.status)}>
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {getOfferingShapeLabel(order.offering.shape)}
                  </Badge>
                </HStack>

                <Text fontWeight="medium">{order.offering.title}</Text>

                <HStack gap={4} fontSize="sm" color="gray.500">
                  <Text>Order #{order.id.slice(0, 8)}</Text>
                  <Text>{formatDate(order.created_at)}</Text>
                </HStack>

                {!compact && order.buyer_note && (
                  <Box mt={2} p={2} bg="gray.50" borderRadius="md">
                    <Text fontSize="sm" color="gray.600">
                      <Text as="span" fontWeight="medium">Note: </Text>
                      {order.buyer_note}
                    </Text>
                  </Box>
                )}
              </VStack>

              {/* Price & Actions */}
              <VStack align="end" gap={2}>
                <Text fontWeight="bold" fontSize="lg">
                  {order.amount === 0
                    ? "FREE"
                    : formatPrice(order.amount, order.currency)}
                </Text>

                {!compact && (
                  <HStack gap={2}>
                    {/* Status-specific actions */}
                    {order.status === "confirmed" && (
                      <Button
                        size="sm"
                        colorPalette="blue"
                        onClick={() => handleStatusUpdate(order.id, "start_fulfillment")}
                        loading={isActioning}
                      >
                        Start Fulfillment
                      </Button>
                    )}
                    {order.status === "fulfilling" && (
                      <Button
                        size="sm"
                        colorPalette="green"
                        onClick={() => handleStatusUpdate(order.id, "mark_delivered")}
                        loading={isActioning}
                      >
                        Mark Delivered
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/bazaar/vendor/orders/${order.id}`)}
                    >
                      View Details
                    </Button>
                  </HStack>
                )}

                {compact && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => router.push(`/bazaar/vendor/orders/${order.id}`)}
                  >
                    View
                  </Button>
                )}
              </VStack>
            </HStack>
          </Card.Body>
        </Card.Root>
      ))}
    </VStack>
  );
}
