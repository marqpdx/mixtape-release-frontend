// src/components/groups/writing/GroupCreatePieceWorkArea.tsx

'use client';

import { useMemo, useState } from 'react';
import { VStack, HStack, Input, Button, Text, Select, Portal, createListCollection } from '@chakra-ui/react';
import { createStandaloneToast } from '@chakra-ui/toast';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';

const { toast } = createStandaloneToast();

const kindCollection = createListCollection({
  items: [
    { label: 'Post', value: 'post' },
    { label: 'Announcement', value: 'announcement' },
    { label: 'Article', value: 'article' },
  ],
});

export default function GroupCreatePieceWorkArea({
  groupSlug,
  defaultKind = 'post',
  onCreated, // (pieceId: string) => void
}: {
  groupSlug: string;
  defaultKind?: 'post' | 'announcement' | 'article';
  onCreated: (pieceId: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState(defaultKind);
  const [submitting, setSubmitting] = useState(false);
  const kindValue = useMemo(() => [kind], [kind]);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', status: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      // resolve group id (if your POST accepts slug directly, skip this GET)
      const g = await axiosInstance.get(`/api/groups/${groupSlug}`);
      const groupId = g.data?.id;

      const res = await axiosInstance.post(`/api/writing/pieces`, {
        title,
        writing_kind: kind,
        status: 'draft',
        sponsor_content_type: 'group',
        sponsor_object_id: groupId,
        body_json: { type: 'doc', content: [] },
        excerpt: '',
      });

      const pieceId = res.data?.id || res.data?.piece?.id;
      if (!pieceId) throw new Error('No piece id returned');
      toast({ title: 'Draft created', status: 'success' });
      onCreated(pieceId);
    } catch (e: any) {
      toast({ title: 'Failed to create draft', description: e?.message, status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VStack align="stretch" gap={4}>
      <Text fontSize="lg" fontWeight="semibold">Start a new post</Text>
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        size="md"
      />
      <HStack gap={3}>
        <Text minW="80px" fontSize="sm" opacity={0.8}>Type</Text>
        <Select.Root
          collection={kindCollection}
          value={kindValue}
          onValueChange={({ value }) => setKind(value[0] as any)}
          size="sm"
        >
          <Select.Trigger />
          <Portal>
            <Select.Content>
              {kindCollection.items.map((item) => (
                <Select.Item key={item.value} item={item} />
              ))}
            </Select.Content>
          </Portal>
        </Select.Root>
      </HStack>
      <HStack justify="flex-end">
        <Button onClick={handleCreate} disabled={submitting}>
          Create draft
        </Button>
      </HStack>
    </VStack>
  );
}
