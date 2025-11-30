// src/components/writing/WritingEditorWrapper.tsx
/**
 * Generic wrapper for writing/editing content
 * Works with both Group and Member sponsors
 * Replaces GroupWriteWrapper with sponsor-agnostic version
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, VStack, Text, Spinner } from '@chakra-ui/react';
import { toaster } from "@/components/ui/toaster";
import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import WriteComposer from '@components/writing/WriteComposer';
import { WritingKind, WritingPiece, WritingWorkingCopyLight } from '@/types/writingTypes';
// import type { WritingPiece, WritingKind } from '@content/writingTypes';

interface SponsorConfig {
  type: 'group' | 'member';
  id: string;
  slug: string;
  displayName: string;
}

interface WritingEditorWrapperProps {
  sponsor: SponsorConfig;
  writingKind?: WritingKind;
  pieceId?: string; // For editing existing pieces
  onPublished?: (piece: WritingPiece) => void;
  onSaved?: (piece: WritingPiece) => void;
}

/**
 * Generic wrapper that initializes a writing piece and renders the editor
 *
 * @example
 * // For a group
 * <WritingEditorWrapper
 *   sponsor={{ type: 'group', id: '123', slug: 'my-group', displayName: 'My Group' }}
 *   writingKind="post"
 *   onPublished={(piece) => router.push(`/groups/my-group/writing/${piece.slug}`)}
 * />
 *
 * // For a member
 * <WritingEditorWrapper
 *   sponsor={{ type: 'member', id: '456', slug: 'username', displayName: 'John Doe' }}
 *   writingKind="article"
 *   onPublished={(piece) => router.push(`/writing/${piece.slug}`)}
 * />
 */
export default function WritingEditorWrapper({
  sponsor,
  writingKind = 'post',
  pieceId,
  onPublished,
  onSaved,
}: WritingEditorWrapperProps) {
  const [piece, setPiece] = useState<WritingPiece | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const createdRef = useRef(false);

  console.log('🖋️ WritingEditorWrapper initialized with sponsor:', sponsor, 'pieceId:', pieceId);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;

    const initializePiece = async () => {
      try {
        if (pieceId) {
          // Editing existing piece - fetch working copy
          console.log('📝 Loading existing piece:', pieceId);

          const url = `/api/writing/pieces/${pieceId}/working-copy`;
          const res = await axiosInstance.get<WritingWorkingCopyLight>(url);
          const workingCopy = res.data;

          console.log('✅ Working copy loaded:', workingCopy);

          // Transform working copy into WritingPiece shape for WriteComposer
          const pieceData: WritingPiece = {
            id: workingCopy.piece.id,
            slug: workingCopy.piece.slug,
            title: workingCopy.title,
            excerpt: workingCopy.excerpt,
            body_json: workingCopy.body_json,
            writing_kind: 'post' as WritingKind, // TODO: Get this from backend
            status: workingCopy.piece.status,
            // is_empty: !workingCopy.title && !workingCopy.body_json?.content?.length,
            is_empty: workingCopy.piece.is_empty,
            reading_time: null,
            current_version_no: 1,
            allow_comments: true,
            view_count: 0,
            comment_count: 0,
            sponsor_content_type: sponsor.type,
            sponsor_object_id: sponsor.id,
            author: {
              id: '',
              first_name: '',
              last_name: '',
              email: ''
            },
            created_at: '',
            updated_at: workingCopy.last_saved_at,
          };

          setPiece(pieceData);
        } else {
          // Creating new piece - create immediately but mark as empty
          console.log(`🚀 Creating new empty piece for ${sponsor.type}:`, sponsor.slug);

          const res = await axiosInstance.post(`/api/writing/pieces`, {
            title: '',
            writing_kind: writingKind,
            body_json: { type: 'doc', content: [] },
            excerpt: '',
            sponsor_content_type: sponsor.type,
            sponsor_object_id: sponsor.id,
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
        toaster.create({
          title: 'Could not load editor',
          description: errorMessage,
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    initializePiece();
  }, [sponsor.type, sponsor.slug, sponsor.id, writingKind, pieceId]);

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <VStack gap={3}>
          <Spinner size="lg" />
          <Text color="gray.600">
            {pieceId ? 'Loading content...' : 'Preparing your editor...'}
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

  console.log('✍️ Rendering WriteComposer for piece:', piece);

  return (
    <WriteComposer
      pieceId={piece.id}
      initialPiece={piece}
      sponsor={sponsor}
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
