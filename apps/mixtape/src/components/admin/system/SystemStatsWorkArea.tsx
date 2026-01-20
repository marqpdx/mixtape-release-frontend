// apps/mixtape/src/components/admin/system/SystemStatsWorkArea.tsx

"use client";

import { VStack, Text } from "@chakra-ui/react";
import WorkAreaWrapper from "@components/dashboard/shared/WorkAreaWrapper";

export default function SystemStatsWorkArea() {
  return (
    <WorkAreaWrapper>
      <VStack align="stretch" gap={4}>
        <Text fontSize="xl" fontWeight="bold">⚡ System Stats</Text>
        <Text>System stats visualization coming soon.</Text>
      </VStack>
    </WorkAreaWrapper>
  );
}
