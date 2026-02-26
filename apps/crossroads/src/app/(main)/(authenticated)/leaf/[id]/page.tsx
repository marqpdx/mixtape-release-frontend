// apps/crossroads/src/app/(main)/(authenticated)/leaf/[id]/page.tsx

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Textarea,
  Spinner,
  Badge,
  Image,
} from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { IconArrowLeft, IconSend } from '@tabler/icons-react';
import { useLeafDetail, useLeafComments, useCreateComment } from '@mixtape/api/hooks/useLeaf';
import { useAuth } from '@/lib/auth/AuthContext';
import type { LeafComment } from '@mixtape/core/types/leaf';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function CommentItem({
  comment,
  leafId,
  canReply,
}: {
  comment: LeafComment;
  leafId: string;
  canReply: boolean;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const createReply = useCreateComment(leafId);
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const replyBorderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    await createReply.mutateAsync({ content: replyText.trim(), parent: comment.id });
    setReplyText('');
    setShowReply(false);
  };

  // Only top-level comments can receive replies (one-level threading)
  const isTopLevel = !comment.parent;

  return (
    <Box>
      <HStack gap={2} mb={1}>
        <Text fontSize="sm" fontWeight="semibold">
          {comment.author.display_name}
        </Text>
        <Text fontSize="xs" color={mutedColor}>
          {formatDate(comment.created_at)}
        </Text>
      </HStack>
      <Text fontSize="sm">{comment.content}</Text>

      {/* Reply button (top-level comments only) */}
      {canReply && isTopLevel && (
        <Button
          size="xs"
          variant="ghost"
          color={mutedColor}
          mt={1}
          onClick={() => setShowReply(!showReply)}
        >
          {showReply ? 'Cancel' : 'Reply'}
        </Button>
      )}

      {/* Inline reply input */}
      {showReply && (
        <HStack gap={2} mt={2} ml={6}>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${comment.author.display_name}...`}
            rows={1}
            resize="none"
            size="sm"
            flex={1}
          />
          <Button
            size="xs"
            colorPalette="blue"
            onClick={handleSubmitReply}
            disabled={!replyText.trim() || createReply.isPending}
            loading={createReply.isPending}
            alignSelf="end"
          >
            <IconSend size={14} />
          </Button>
        </HStack>
      )}

      {/* Replies (one level only) */}
      {comment.replies.length > 0 && (
        <VStack align="stretch" gap={3} mt={3} ml={6} pl={3} borderLeftWidth="2px" borderColor={replyBorderColor}>
          {comment.replies.map((reply) => (
            <Box key={reply.id}>
              <HStack gap={2} mb={1}>
                <Text fontSize="sm" fontWeight="semibold">
                  {reply.author.display_name}
                </Text>
                <Text fontSize="xs" color={mutedColor}>
                  {formatDate(reply.created_at)}
                </Text>
              </HStack>
              <Text fontSize="sm">{reply.content}</Text>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}

export default function LeafDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leafId = params.id as string;
  const { user } = useAuth();

  const { data: leaf, isLoading, error } = useLeafDetail(leafId);
  const { data: comments } = useLeafComments(leafId);
  const createComment = useCreateComment(leafId);

  const [commentText, setCommentText] = useState('');

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const avatarBg = useColorModeValue('gray.200', 'gray.600');
  const refBg = useColorModeValue('blue.50', 'blue.900');

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    await createComment.mutateAsync({ content: commentText.trim() });
    setCommentText('');
  };

  if (isLoading) {
    return (
      <Box maxW="700px" mx="auto" py={12} textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || !leaf) {
    return (
      <Box maxW="700px" mx="auto" py={12} textAlign="center">
        <Text color="red.500">Leaf not found.</Text>
      </Box>
    );
  }

  return (
    <Box maxW="700px" mx="auto" px={4} py={6}>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        mb={6}
        onClick={() => router.back()}
      >
        <IconArrowLeft size={16} />
        Back
      </Button>

      {/* Leaf content */}
      <VStack align="stretch" gap={4}>
        {/* Author */}
        <HStack gap={3}>
          <Box
            w="44px"
            h="44px"
            borderRadius="full"
            bg={avatarBg}
            overflow="hidden"
            flexShrink={0}
          >
            {leaf.author.avatar_url && (
              <Image src={leaf.author.avatar_url} alt="" w="full" h="full" objectFit="cover" />
            )}
          </Box>
          <Box>
            <Text fontWeight="semibold">{leaf.author.display_name}</Text>
            <Text fontSize="sm" color={mutedColor}>
              @{leaf.author.username} · {formatDate(leaf.published_at || leaf.created_at)}
            </Text>
          </Box>
          {leaf.is_reference && (
            <Badge colorPalette="blue" variant="subtle">curated</Badge>
          )}
        </HStack>

        {/* Caption */}
        {leaf.is_reference && leaf.caption && (
          <Text>{leaf.caption}</Text>
        )}

        {/* Body */}
        {leaf.body_text && (
          <Text whiteSpace="pre-wrap">{leaf.body_text}</Text>
        )}

        {/* Image */}
        {leaf.kind === 'image' && leaf.image_file && (
          <Image src={leaf.image_file} alt="" borderRadius="md" maxH="500px" objectFit="cover" />
        )}

        {/* Link preview */}
        {leaf.kind === 'link' && leaf.link_url && (
          <Box p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md">
            <Text fontWeight="medium">{leaf.link_preview?.title || leaf.link_url}</Text>
            {leaf.link_preview?.description && (
              <Text fontSize="sm" color={mutedColor} mt={1}>{leaf.link_preview.description}</Text>
            )}
          </Box>
        )}

        {/* Reference source */}
        {leaf.is_reference && leaf.source_title && (
          <Box p={4} borderWidth="1px" borderColor="blue.200" borderRadius="md" bg={refBg}>
            <Text fontSize="xs" color="blue.500" fontWeight="semibold" mb={1}>
              {leaf.source_type || 'Source'}
            </Text>
            <Text fontWeight="medium">{leaf.source_title}</Text>
          </Box>
        )}
      </VStack>

      {/* Comments section */}
      <Box mt={8} pt={6} borderTopWidth="1px" borderColor={borderColor}>
        <Text fontWeight="semibold" mb={4}>
          Comments {comments && comments.length > 0 ? `(${comments.length})` : ''}
        </Text>

        {/* Comment input */}
        {user && (
          <HStack gap={2} mb={6}>
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              resize="none"
              flex={1}
            />
            <Button
              size="sm"
              colorPalette="blue"
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || createComment.isPending}
              loading={createComment.isPending}
              alignSelf="end"
            >
              <IconSend size={16} />
            </Button>
          </HStack>
        )}

        {/* Comment list */}
        {comments && comments.length > 0 ? (
          <VStack align="stretch" gap={5}>
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} leafId={leafId} canReply={!!user} />
            ))}
          </VStack>
        ) : (
          <Text fontSize="sm" color={mutedColor} textAlign="center" py={4}>
            No comments yet. Be the first to reply.
          </Text>
        )}
      </Box>
    </Box>
  );
}
