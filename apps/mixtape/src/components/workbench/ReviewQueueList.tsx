// src/components/workbench/ReviewQueueList.tsx
'use client';

import { useState } from 'react';
import { Box, Button, HStack, Spinner, Table, Text, VStack, Badge } from '@chakra-ui/react';
import { useReviewQueue, useMillDraftAction } from '@mixtape/api/hooks/workbench';
import type { MillDraftListItem, MillDraftDetail } from '@mixtape/api/clients/workbench';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { formatDateTime } from '@/lib/utils/dateFormatters';
import { toaster } from '@mixtape/core/lib/toaster';
import { ReviewQueueDrawer } from './ReviewQueueDrawer';

interface ReviewQueueListProps {
  groupId: string;
  onOpenDraft?: (draftId: string) => void;
}

export function ReviewQueueList({ groupId, onOpenDraft }: ReviewQueueListProps) {
  const [selectedDraft, setSelectedDraft] = useState<MillDraftListItem | null>(null);

  // Fetch Review Queue (candidates only)
  const { drafts, isLoading, error } = useReviewQueue('group', groupId);

  // Action mutation for open/discard
  const { mutate: performAction, isPending: isActionPending } = useMillDraftAction();

  const handleOpen = (draft: MillDraftListItem | MillDraftDetail) => {
    performAction(
      {
        draftId: draft.id,
        payload: { action: 'open' },
      },
      {
        onSuccess: (response) => {
          toaster.create({
            title: 'Draft Opened',
            description: response.message,
            type: 'success',
            duration: 3000,
          });

          if (onOpenDraft) {
            onOpenDraft(draft.id);
          }
        },
        onError: (error: Error) => {
          toaster.create({
            title: 'Failed to Open Draft',
            description: error.message,
            type: 'error',
            duration: 5000,
          });
        },
      }
    );
  };

  const handleDiscard = (draft: MillDraftListItem | MillDraftDetail) => {
    if (!confirm(`Discard "${draft.title}"? This action cannot be undone.`)) {
      return;
    }

    performAction(
      {
        draftId: draft.id,
        payload: { action: 'discard' },
      },
      {
        onSuccess: () => {
          toaster.create({
            title: 'Draft Discarded',
            description: 'The draft has been removed from the queue',
            type: 'success',
            duration: 3000,
          });
        },
        onError: (error: Error) => {
          toaster.create({
            title: 'Failed to Discard Draft',
            description: error.message,
            type: 'error',
            duration: 5000,
          });
        },
      }
    );
  };

  const handleApprove = (draft: MillDraftListItem | MillDraftDetail) => {
    performAction(
      {
        draftId: draft.id,
        payload: { action: 'approve' },
      },
      {
        onSuccess: () => {
          toaster.create({
            title: 'Draft Approved',
            description: 'Marked for consideration',
            type: 'success',
            duration: 3000,
          });
        },
        onError: (error: Error) => {
          toaster.create({
            title: 'Failed to Approve Draft',
            description: error.message,
            type: 'error',
            duration: 5000,
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.500">
          Loading Review Queue...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <MixtapeAlert
        status="error"
        title="Failed to Load Review Queue"
        description={error.message}
      />
    );
  }

  if (!drafts || drafts.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg" color="gray.600" mb={4}>
          No drafts in Review Queue
        </Text>
        <Text fontSize="sm" color="gray.500">
          Suggestions from Stackroom, Concord, and other sources will appear here for review.
        </Text>
      </Box>
    );
  }

  return (
    <>
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold">
            Review Queue
          </Text>
          <Badge colorScheme="blue">
            {drafts.length} candidate{drafts.length !== 1 ? 's' : ''}
          </Badge>
        </HStack>

        <Box overflowX="auto">
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Title</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Source</Table.ColumnHeader>
                <Table.ColumnHeader>Author</Table.ColumnHeader>
                <Table.ColumnHeader>Created</Table.ColumnHeader>
                <Table.ColumnHeader>Valid</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {drafts.map((draft) => (
                <Table.Row
                  key={draft.id}
                  onClick={() => setSelectedDraft(draft)}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                >
                  <Table.Cell fontWeight="medium">{draft.title || '(Untitled)'}</Table.Cell>
                  <Table.Cell>
                    <Badge size="sm" variant="subtle" colorScheme="purple">
                      {draft.content_profile}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="sm" variant="outline">
                      {draft.source_display_name}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell fontSize="sm" color="gray.600">
                    {draft.author_display_name}
                  </Table.Cell>
                  <Table.Cell fontSize="sm" color="gray.600">
                    {formatDateTime(draft.created_at)}
                  </Table.Cell>
                  <Table.Cell>
                    {draft.has_validation_errors ? (
                      <Badge size="sm" colorScheme="red">
                        Errors
                      </Badge>
                    ) : draft.is_valid ? (
                      <Badge size="sm" colorScheme="green">
                        Valid
                      </Badge>
                    ) : (
                      <Badge size="sm" colorScheme="gray">
                        Unvalidated
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack justify="flex-end" gap={2} onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleOpen(draft)}
                        loading={isActionPending}
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApprove(draft)}
                        loading={isActionPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDiscard(draft)}
                        loading={isActionPending}
                      >
                        Discard
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </VStack>

      {selectedDraft && (
        <ReviewQueueDrawer
          draftId={selectedDraft.id}
          onClose={() => setSelectedDraft(null)}
          onOpen={handleOpen}
          onDiscard={handleDiscard}
        />
      )}
    </>
  );
}
