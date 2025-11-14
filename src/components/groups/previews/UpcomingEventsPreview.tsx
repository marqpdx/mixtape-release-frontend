// src/components/groups/previews/UpcomingEventsPreview.tsx

"use client";

import { VStack, Text } from "@chakra-ui/react";

export default function UpcomingEventsPreview() {
  return (
    <VStack align="start" gap={2}>
      <Text>
        <strong>Community Sync</strong> — June 12, 10:00am
      </Text>
      <Text>
        <strong>Circle Planning</strong> — June 15, 3:00pm
      </Text>
    </VStack>
  );
}
