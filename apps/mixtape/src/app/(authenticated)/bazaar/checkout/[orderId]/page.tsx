// apps/mixtape/src/app/(authenticated)/bazaar/checkout/[orderId]/page.tsx

"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Skeleton,
  Spinner,
} from "@chakra-ui/react";
import { IconCheck } from "@tabler/icons-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useOrder, usePaymentMutations } from "@mixtape/api/hooks/useBazaar";
import { formatPrice } from "@mixtape/core/types/bazaarTypes";
import { MixtapeAlert } from "@/components/ui/alerts";
import { Divider } from "@/components/common/Divider";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface CheckoutPageProps {
  params: Promise<{ orderId: string }>;
}

/**
 * CHECKOUT PAGE
 *
 * Handles payment for an order using Stripe.
 * Flow:
 * 1. Load order details
 * 2. Create PaymentIntent
 * 3. Display Stripe PaymentElement
 * 4. Process payment
 * 5. Redirect to order confirmation
 */
export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { orderId } = use(params);
  const router = useRouter();

  // Fetch order
  const { order, isLoading: orderLoading, error: orderError } = useOrder(orderId);

  // Payment mutations
  const { createIntent, isCreatingIntent } = usePaymentMutations();

  // State
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Create payment intent when order loads
  useEffect(() => {
    if (order && order.status === "pending" && !clientSecret) {
      createIntent(orderId)
        .then((response) => {
          if (response.free) {
            // Free order - redirect to order page
            router.push(`/bazaar/orders/${orderId}?success=true`);
          } else if (response.client_secret) {
            setClientSecret(response.client_secret);
          }
        })
        .catch((err) => {
          setPaymentError(err.message || "Failed to initialize payment");
        });
    }
  }, [order, orderId, clientSecret, createIntent, router]);

  // Already paid or processed
  if (order && order.status !== "pending") {
    return (
      <Container maxW="container.md" py={8}>
        <Card.Root>
          <Card.Body>
            <VStack gap={4}>
              <IconCheck size={48} color="green" />
              <Heading size="md">Order Already Processed</Heading>
              <Text>This order has already been {order.status}.</Text>
              <Button
                colorScheme="blue"
                onClick={() => router.push(`/bazaar/orders/${orderId}`)}
              >
                View Order
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Container>
    );
  }

  // Loading
  if (orderLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <Skeleton height="400px" />
      </Container>
    );
  }

  // Error
  if (orderError) {
    return (
      <Container maxW="container.md" py={8}>
        <MixtapeAlert description="Error loading order" status="error" />
      </Container>
    );
  }

  // Not found
  if (!order) {
    return (
      <Container maxW="container.md" py={8}>
        <MixtapeAlert description="Order not found." status="warning" />
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <Heading size="lg" mb={6}>
        Checkout
      </Heading>

      <Box display={{ md: "flex" }} gap={6}>
        {/* Order summary */}
        <Card.Root flex="1" mb={{ base: 6, md: 0 }}>
          <Card.Header>
            <Heading size="md">Order Summary</Heading>
          </Card.Header>
          <Card.Body>
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontWeight="medium">{order.offering.title}</Text>
                <Text color="gray.500" fontSize="sm">
                  {order.offering.summary}
                </Text>
              </Box>

              <Divider />

              <HStack justify="space-between">
                <Text>Subtotal</Text>
                <Text>{formatPrice(order.amount, order.currency)}</Text>
              </HStack>

              <Divider />

              <HStack justify="space-between" fontWeight="bold">
                <Text>Total</Text>
                <Text fontSize="xl">
                  {formatPrice(order.amount, order.currency)}
                </Text>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Payment form */}
        <Card.Root flex="1">
          <Card.Header>
            <Heading size="md">Payment</Heading>
          </Card.Header>
          <Card.Body>
            {paymentError && (
              <Box mb={4}>
                <MixtapeAlert description={paymentError} status="error"  />
              </Box>
            )}

            {isCreatingIntent && (
              <VStack py={8}>
                <Spinner size="lg" />
                <Text>Initializing payment...</Text>
              </VStack>
            )}

            {clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                  },
                }}
              >
                <PaymentForm orderId={orderId} />
              </Elements>
            )}
          </Card.Body>
        </Card.Root>
      </Box>
    </Container>
  );
}

/**
 * Payment Form Component (inside Stripe Elements)
 */
function PaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/bazaar/orders/${orderId}?success=true`,
      },
    });

    if (submitError) {
      setError(submitError.message || "Payment failed. Please try again.");
      setIsProcessing(false);
    }
    // If no error, Stripe redirects automatically
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack gap={4} align="stretch">
        <PaymentElement />

        {error && (
          <MixtapeAlert description={error} status="error" />
        )}

        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          loading={isProcessing}
          disabled={!stripe || !elements}
          loadingText="Processing..."
        >
          Pay Now
        </Button>

        <Text fontSize="xs" color="gray.500" textAlign="center">
          Your payment is secured by Stripe
        </Text>
      </VStack>
    </form>
  );
}
