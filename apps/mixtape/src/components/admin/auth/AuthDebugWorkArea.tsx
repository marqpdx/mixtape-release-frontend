// apps/mixtape/src/components/admin/auth/AuthDebugWorkArea.tsx

"use client";

import { VStack, Text, Code } from "@chakra-ui/react";
import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";

export default function AuthDebugWorkArea() {
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={4}>
        <Text fontSize="xl" fontWeight="bold">🔐 Auth Debug</Text>
        <Text>Authentication diagnostics are under construction.</Text>
        <Code fontSize="sm" p={2} borderRadius="md">
          TODO: expose token status, session age, and permission summary.
        </Code>
      </VStack>
    </WorkAreaWrapper>
  );
}
