// apps/mixtape/src/app/(authenticated)/bazaar/vendor/page.tsx

"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Tabs,
  Card,
  Badge,
  SimpleGrid,
  Skeleton,
  Alert,
} from "@chakra-ui/react";
import {
  IconShoppingCart,
  IconPackage,
  IconTag,
  IconChartBar,
} from "@tabler/icons-react";
import { useVendorStats, useVendorOrders } from "@mixtape/api/hooks/useBazaar";
import VendorOrdersList from "@/components/bazaar/vendor/VendorOrdersList";

/**
 * VENDOR DASHBOARD
 *
 * Central hub for vendors to manage their bazaar operations.
 * Shows stats, orders, and links to manage products/offerings.
 */
export default function VendorDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch vendor stats
  const { stats, isLoading: statsLoading } = useVendorStats();

  // Fetch recent orders
  const { orders, isLoading: ordersLoading, error: ordersError } = useVendorOrders();

  const totalOrders =
    (stats?.orders?.pending || 0) +
    (stats?.orders?.confirmed || 0) +
    (stats?.orders?.fulfilling || 0) +
    (stats?.orders?.completed || 0);

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header */}
      <VStack align="start" gap={2} mb={8}>
        <Heading size="xl">Vendor Dashboard</Heading>
        <Text color="gray.600">
          Manage your products, offerings, and orders
        </Text>
      </VStack>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mb={8}>
        <StatCard
          icon={<IconShoppingCart size={24} />}
          label="Total Orders"
          value={statsLoading ? "-" : totalOrders.toString()}
          isLoading={statsLoading}
        />
        <StatCard
          icon={<IconPackage size={24} />}
          label="Active Offerings"
          value={statsLoading ? "-" : stats?.active_offerings_count?.toString() || "0"}
          isLoading={statsLoading}
        />
        <StatCard
          icon={<IconTag size={24} />}
          label="Total Offerings"
          value={statsLoading ? "-" : stats?.offerings_count?.toString() || "0"}
          isLoading={statsLoading}
        />
        <StatCard
          icon={<IconChartBar size={24} />}
          label="Needs Attention"
          value={statsLoading ? "-" : stats?.orders?.needs_attention?.toString() || "0"}
          isLoading={statsLoading}
        />
      </SimpleGrid>

      {/* Tabs */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value)}
        variant="line"
      >
        <Tabs.List>
          <Tabs.Trigger value="overview">
            <HStack gap={2}>
              <IconChartBar size={16} />
              <Text>Overview</Text>
            </HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="orders">
            <HStack gap={2}>
              <IconShoppingCart size={16} />
              <Text>Orders</Text>
            </HStack>
          </Tabs.Trigger>
        </Tabs.List>

        <Box mt={6}>
          <Tabs.Content value="overview">
            <VStack align="stretch" gap={6}>
              {/* Recent Orders */}
              <Card.Root>
                <Card.Header>
                  <HStack justify="space-between">
                    <Heading size="md">Recent Orders</Heading>
                    <Badge>{orders.length} new</Badge>
                  </HStack>
                </Card.Header>
                <Card.Body>
                  {ordersError && (
                    <Alert.Root status="error">
                      <Alert.Indicator />
                      <Alert.Title>Error loading orders</Alert.Title>
                    </Alert.Root>
                  )}
                  {ordersLoading ? (
                    <VStack gap={2}>
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} height="60px" width="100%" />
                      ))}
                    </VStack>
                  ) : orders.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={8}>
                      No orders yet. Your orders will appear here when customers purchase your offerings.
                    </Text>
                  ) : (
                    <VendorOrdersList orders={orders} compact />
                  )}
                </Card.Body>
              </Card.Root>

              {/* Quick Actions */}
              <Card.Root>
                <Card.Header>
                  <Heading size="md">Quick Actions</Heading>
                </Card.Header>
                <Card.Body>
                  <Text color="gray.600" fontSize="sm">
                    To manage products and offerings, visit your group or profile page and use the Products and Offerings work areas.
                  </Text>
                </Card.Body>
              </Card.Root>
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="orders">
            <VendorOrdersList orders={orders} isLoading={ordersLoading} />
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Container>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  icon,
  label,
  value,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLoading?: boolean;
}) {
  return (
    <Card.Root>
      <Card.Body>
        <HStack gap={4}>
          <Box color="blue.500">{icon}</Box>
          <VStack align="start" gap={0}>
            <Text fontSize="sm" color="gray.500">
              {label}
            </Text>
            {isLoading ? (
              <Skeleton height="28px" width="60px" />
            ) : (
              <Text fontSize="2xl" fontWeight="bold">
                {value}
              </Text>
            )}
          </VStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}
