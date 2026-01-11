// src/app/(authenticated)/groups/[slug]/workbench/queue/page.tsx
'use client';

import { Box, Heading, VStack } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { ReviewQueueList } from '@/components/workbench';
import { useGroup } from '@mixtape/api/hooks/groups/useGroups';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';

export default function WorkbenchQueuePage() {
  const { slug } = useParams();
  const router = useRouter();
  const slugStr = Array.isArray(slug) ? slug[0] : (slug as string);

  const { group, isLoading: isLoadingGroup } = useGroup(slugStr);

  const handleOpenDraft = (draftId: string) => {
    // Navigate to draft editor when opened
    router.push(`/groups/${slugStr}/workbench/drafts/${draftId}/edit`);
  };

  if (isLoadingGroup) {
    return (
      <Box p={6}>
        <Heading size="lg" mb={6}>
          Review Queue
        </Heading>
        <p>Loading...</p>
      </Box>
    );
  }

  if (!group) {
    return (
      <Box p={6}>
        <MixtapeAlert
          status="error"
          title="Group Not Found"
          description="The requested group could not be found."
        />
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <Heading size="lg">Review Queue — {group.title}</Heading>

        <ReviewQueueList groupId={group.id} onOpenDraft={handleOpenDraft} />
      </VStack>
    </Box>
  );
}
