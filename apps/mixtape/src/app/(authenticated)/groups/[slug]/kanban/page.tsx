'use client';

import { useParams } from 'next/navigation';
import { Box, Spinner, HStack, Text } from '@chakra-ui/react';
import { useGroup } from '@mixtape/api/hooks';
import KanbanBoard from '@/components/projects/KanbanBoard';

export default function GroupKanbanPage() {
  const { slug } = useParams();
  const slugStr = Array.isArray(slug) ? slug[0] : (slug as string);

  const { group, isLoading } = useGroup(slugStr);

  if (isLoading) {
    return (
      <HStack justify="center" py={12}>
        <Spinner size="sm" />
        <Text color="gray.500">Loading…</Text>
      </HStack>
    );
  }

  if (!group) return null;

  return (
    <Box h="full" p={4}>
      <KanbanBoard
        groupId={group.id}
        groupSlug={slugStr}
        groupTitle={group.title}
      />
    </Box>
  );
}
