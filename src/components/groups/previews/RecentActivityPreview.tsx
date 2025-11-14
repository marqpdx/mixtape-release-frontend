// src/components/groups/previews/RecentActivityPreview.tsx

"use client";

import { VStack, Text } from "@chakra-ui/react";

export default function RecentActivityPreview() {
  return (
    <VStack align="start" gap={2}>
      <Text>- Alice posted a new announcement</Text>
      <Text>- Bob uploaded a document</Text>
      <Text>- Carol joined the group</Text>
    </VStack>
  );
}
