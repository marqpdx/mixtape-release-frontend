// src/app/(authenticated)/dashboard/page.tsx
"use client";

import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissions } from "@/lib/auth/usePermissions";

export default function DashboardPage() {
  const { user } = useAuth();
  const { isAdmin, isSteward, isMember } = usePermissions();

  return (
    <Box p={8}>
      <VStack align="start" gap={6}>
        <Heading size="2xl">Dashboard</Heading>

        <Text fontSize="lg">
          Welcome back, {user?.username || user?.first_name || 'User'}!
        </Text>

        <Box
          p={6}
          bg="gray.50"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <VStack align="start" gap={3}>
            <Text fontWeight="bold">Your Role:</Text>
            {isAdmin && <Text> Administrator</Text>}
            {isSteward && <Text> Steward</Text>}
            {isMember && <Text> Member</Text>}
          </VStack>
        </Box>

        <Text color="gray.600">
          This dashboard is protected and only accessible to authenticated users.
        </Text>
      </VStack>
    </Box>
  );
}
