// src/components/groups/previews/RecentMessagesPreview.tsx

"use client";

import { VStack, Text } from "@chakra-ui/react";

export default function RecentMessagesPreview() {
  return (
    <VStack align="start" gap={2}>
      <Text>
        <strong>Alice:</strong> “Hey folks, don’t forget our meeting!”
      </Text>
      <Text>
        <strong>Bob:</strong> “I added some notes to the doc.”
      </Text>
    </VStack>
  );
}
