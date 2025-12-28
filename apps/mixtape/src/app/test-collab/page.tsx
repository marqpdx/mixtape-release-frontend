// app/test-collab/page.tsx
// Isolated test page for minimal collaboration component

"use client";

import MinimalCollabTest from "@/components/editor/MinimalCollabTest";
import { Box, Heading, Text } from "@chakra-ui/react";

export default function TestCollabPage() {
  return (
    <Box maxW="4xl" mx="auto" py={10} px={4}>
      <Heading size="lg" mb={4}>Yjs Collaboration - Minimal Test</Heading>

      <Text mb={6} color="gray.600">
        This is a stripped-down test to verify TipTap's Collaboration extension
        writes to Y.Doc. If the update count increases when you type, Yjs is working.
      </Text>

      <MinimalCollabTest />

      <Box mt={6} p={4} bg="yellow.50" borderWidth="1px" borderColor="yellow.400">
        <Heading size="sm" mb={2}>What to look for:</Heading>
        <Text fontSize="sm">
          • Open browser console<br />
          • Type in the editor<br />
          • You should see: <strong>"🔄 ✅ Y.Doc UPDATE EVENT FIRED!"</strong><br />
          • The update count above should increase<br />
          <br />
          If you see those messages → Yjs works, problem is elsewhere<br />
          If you don't see them → Core TipTap/Yjs integration is broken
        </Text>
      </Box>
    </Box>
  );
}
