// src/components/groups/writing/GroupWriteWrapper.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, VStack, Text, Spinner } from '@chakra-ui/react';
import { createStandaloneToast } from '@chakra-ui/toast';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import WriteComposer from '@components/write/WriteComposer';
import type { WritingPiece } from './interfaces';

const { toast } = createStandaloneToast();

interface GroupWriteWrapperProps {
  groupSlug: string;
  groupId: string;
  groupName?: string;
  writingKind?: 'post' | 'announcement' | 'article';
  pieceSlug?: string; // For editing existing pieces
  onPublished?: (piece: WritingPiece) => void;
  onSaved?: (piece: WritingPiece) => void;
}

export default function GroupWriteWrapper({
  groupSlug,
  groupId,
  groupName,
  writingKind = 'post',
  pieceSlug,
  onPublished,
  onSaved,
}: GroupWriteWrapperProps) {
  const [piece, setPiece] = useState<WritingPiece | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const createdRef = useRef(false);

  // console.log('GroupWriteWrapper props:', { groupSlug, groupId, writingKind, pieceSlug });

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;

    const initializePiece = async () => {
      try {
        if (pieceSlug) {
          // Editing existing piece
          console.log('📝 Loading existing piece:', pieceSlug);
          const res = await axiosInstance.get(`/api/groups/${groupSlug}/writing/${pieceSlug}`);
          setPiece(res.data);
        } else {
          // Creating new piece - create immediately but mark as empty
          console.log('🚀 Creating new empty piece for group:', groupSlug);
          const res = await axiosInstance.post(`/api/writing/pieces`, {
            title: '',
            writing_kind: writingKind,
            body_json: { type: 'doc', content: [] },
            excerpt: '',
            sponsor_content_type: 'group',
            sponsor_object_id: groupId,
            is_empty: true, // Mark as empty for cleanup
            create_working_copy: true,
          });

          const { working_copy, ...pieceData } = res.data;
          setPiece(pieceData);
          console.log('✅ Empty piece created:', pieceData.id);
        }
        setError(null);
      } catch (e: any) {
        console.error('❌ Failed to initialize piece:', e);
        const errorMessage = e?.response?.data?.message || e?.message || 'Failed to load content';
        setError(errorMessage);
        toast({
          title: 'Could not load editor',
          description: errorMessage,
          status: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    initializePiece();
  }, [groupSlug, groupId, writingKind, pieceSlug]);

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <VStack gap={3}>
          <Spinner size="lg" />
          <Text color="gray.600">
            {pieceSlug ? 'Loading content...' : 'Preparing your editor...'}
          </Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} textAlign="center">
        <VStack gap={3}>
          <Text color="red.500" fontSize="lg">Failed to load content</Text>
          <Text color="gray.600" fontSize="sm">{error}</Text>
        </VStack>
      </Box>
    );
  }

  if (!piece) {
    return (
      <Box p={6} textAlign="center">
        <VStack gap={3}>
          <Text color="red.500">Something went wrong</Text>
          <Text color="gray.600" fontSize="sm">Content not found</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <WriteComposer
      pieceId={piece.id}
      initialPiece={piece}
      sponsor={{
        type: 'group',
        id: groupId,
        slug: groupSlug,
        displayName: groupName || groupSlug,
      }}
      writingKind={writingKind}
      defaultWorkspaceOpen={false}
      autosaveDebounceMs={2500}
      autoFocus={true}
      showPublishingControls={true}
      onPublished={onPublished}
      onSaved={onSaved}
    />
  );
}