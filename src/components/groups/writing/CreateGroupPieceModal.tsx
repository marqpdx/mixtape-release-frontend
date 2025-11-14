// src/components/groups/writing/CreateGroupPieceModal.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  VStack, HStack, Input, Button, Select, Portal, createListCollection, Text,
} from '@chakra-ui/react';
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

export default function CreateGroupPieceModal({
  groupSlug,
  onCreated,
  defaultKind = 'post',
}: {
  groupSlug: string;
  onCreated: (pieceId: string) => void;
  defaultKind?: 'post' | 'announcement' | 'article';
}) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState(defaultKind);
  const kindValue = useMemo(() => [kind], [kind]);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', status: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      // 1) Resolve group id from slug
      const groupRes = await axiosInstance.get(`/api/groups/${groupSlug}`);
      const groupId = groupRes.data?.id;

      // 2) Create WritingPiece (draft) with group sponsor
      const res = await axiosInstance.post(`/api/writing/pieces`, {
        title,
        writing_kind: kind,
        status: 'draft',
        sponsor_content_type: 'group', // backend can accept this symbolic value
        sponsor_object_id: groupId,    // or accept slug server-side, your call
        body_json: { type: 'doc', content: [] },
        excerpt: '',
      });

      const pieceId = res.data?.id || res.data?.piece?.id;
      toast({ title: 'Draft created', status: 'success' });
      onCreated(pieceId);
    } catch (e: any) {
      toast({ title: 'Failed to create draft', description: e?.message, status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VStack align="stretch" gap={3}>
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

      <HStack justify="flex-end" mt={2}>
        <Button onClick={handleCreate} disabled={submitting}>
          Create
        </Button>
      </HStack>
    </VStack>
  );
}
