"use client";

import { Box, Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";

export function TechHelpAccessGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const isAdmin = !!user?.is_superuser || !!user?.is_staff;

  if (isLoading) {
    return <Text color="fg.muted">Loading technical reference…</Text>;
  }

  if (!isAdmin) {
    return (
      <Box borderWidth="1px" borderColor="border" borderRadius="xl" p={6} bg="bg">
        <Text fontWeight="medium" color="fg">
          Technical reference is limited to admins and superusers.
        </Text>
        <Text mt={1} fontSize="sm" color="fg.muted">
          The end-user help library is still available from the main Help page.
        </Text>
      </Box>
    );
  }

  return <>{children}</>;
}

