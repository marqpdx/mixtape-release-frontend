// apps/mixtape/src/app/(authenticated)/workbench/page.tsx
//
// Global Workbench — Phase 1: Unified Queue
//
// Aggregates all curation sources into one surface:
//   - Feedback tab: Lighthouse + Beacon submissions (FeedbackItems)
//   - MillDrafts tab: Stackroom / Gristmill candidates (MillDrafts)
//
// Non-destructive: /feedback/checklist and /groups/[slug]/workbench remain untouched.
// This page is the new nav target at /workbench.

"use client";

import { Box, Heading, HStack, Tabs, Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { FeedbackQueue } from "@/components/workbench/FeedbackQueue";
import { ReviewQueueList } from "@/components/workbench/ReviewQueueList";
import { useDefaultGroup } from "@mixtape/api/hooks/groups/useGroups";

export default function WorkbenchPage() {
  useAuth();
  const { group: defaultGroup } = useDefaultGroup();

  // ReviewQueueList requires a groupId — use the default platform group as the
  // system-level sponsor for the global queue. Individual group queues remain
  // accessible at /groups/[slug]/workbench.
  const systemGroupId = defaultGroup?.id ?? "";

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <HStack justify="space-between" align="flex-start" mb={6}>
        <Box>
          <Heading size="lg">Workbench</Heading>
          <Text fontSize="sm" color="fg.muted" mt={1}>
            Everything that needs attention — across all capture sources.
          </Text>
        </Box>
      </HStack>

      <Tabs.Root defaultValue="feedback" variant="line">
        <Tabs.List mb={4}>
          <Tabs.Trigger value="feedback">Feedback</Tabs.Trigger>
          <Tabs.Trigger value="milldrafts" disabled={!systemGroupId}>
            MillDrafts
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="feedback">
          <FeedbackQueue />
        </Tabs.Content>

        <Tabs.Content value="milldrafts">
          {systemGroupId ? (
            <ReviewQueueList groupId={systemGroupId} />
          ) : (
            <Text color="fg.muted" py={6} textAlign="center">
              No default group configured — MillDraft queue unavailable.
            </Text>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
