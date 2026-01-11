// apps/mixtape/src/app/(authenticated)/groups/[slug]/workbench/page.tsx

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Heading, VStack, Tabs, Text } from '@chakra-ui/react';
import { useGroup } from '@mixtape/api/hooks/groups';
import { ReviewQueueList } from '@/components/workbench/ReviewQueueList';
import { ComposeTab } from '@/components/workbench/ComposeTab';
import { MyDraftsTab } from '@/components/workbench/MyDraftsTab';

export default function WorkbenchPage() {
  const { slug } = useParams();
  const slugStr = Array.isArray(slug) ? slug[0] : (slug as string);

  const { group, isLoading: isLoadingGroup } = useGroup(slugStr);

  const [activeTab, setActiveTab] = useState('queue');
  const [editingDraftId, setEditingDraftId] = useState<string | undefined>(undefined);

  const handleDraftCreated = (draftId: string) => {
    // When a draft is created, switch to My Drafts tab and open editor
    setEditingDraftId(draftId);
    setActiveTab('my-drafts');
  };

  const handleOpenDraft = (draftId: string) => {
    // When opening from queue, switch to My Drafts tab
    setEditingDraftId(draftId);
    setActiveTab('my-drafts');
  };

  if (isLoadingGroup) {
    return (
      <Box p={6}>
        <Text color="gray.500">Loading group...</Text>
      </Box>
    );
  }

  if (!group) {
    return (
      <Box p={6}>
        <Text color="red.500">Group not found</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <Heading size="lg">Workbench</Heading>

        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => {
            setActiveTab(e.value);
            // Clear editing draft when switching tabs
            if (e.value !== 'my-drafts') {
              setEditingDraftId(undefined);
            }
          }}
        >
          <Tabs.List mb={4}>
            <Tabs.Trigger value="queue">📥 Review Queue</Tabs.Trigger>
            <Tabs.Trigger value="compose">✍️ Compose</Tabs.Trigger>
            <Tabs.Trigger value="my-drafts">📝 My Drafts</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="queue">
            <ReviewQueueList groupId={group.id} onOpenDraft={handleOpenDraft} />
          </Tabs.Content>

          <Tabs.Content value="compose">
            <ComposeTab groupId={group.id} onDraftCreated={handleDraftCreated} />
          </Tabs.Content>

          <Tabs.Content value="my-drafts">
            <MyDraftsTab groupId={group.id} editingDraftId={editingDraftId} />
          </Tabs.Content>
        </Tabs.Root>
      </VStack>
    </Box>
  );
}
