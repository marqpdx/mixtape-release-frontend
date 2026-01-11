// src/components/workbench/ReviewQueueDrawer.tsx
'use client';

import React from 'react';
import {
  Drawer,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Button,
  Skeleton,
  Code,
} from '@chakra-ui/react';
import { useMillDraft } from '@mixtape/api/hooks/workbench';
import type { MillDraftListItem, MillDraftDetail } from '@mixtape/api/clients/workbench';
import { useColorModeValue } from '@components/ui/color-mode';
import { Divider } from '@components/common/Divider';
import { formatDateTime } from '@/lib/utils/dateFormatters';

interface ValidationMessage {
  field?: string;
  message?: string;
  [key: string]: unknown;
}

interface ReviewQueueDrawerProps {
  draftId: string;
  onClose: () => void;
  onOpen?: (draft: MillDraftListItem | MillDraftDetail) => void;
  onDiscard?: (draft: MillDraftListItem | MillDraftDetail) => void;
}

export const ReviewQueueDrawer: React.FC<ReviewQueueDrawerProps> = ({
  draftId,
  onClose,
  onOpen,
  onDiscard,
}) => {
  const { draft, isLoading, error } = useMillDraft({ draftId });

  // Color mode values
  const drawerBg = useColorModeValue('white', 'gray.800');
  const sectionBg = useColorModeValue('gray.50', 'gray.900');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      candidate: { color: 'blue', label: 'Candidate' },
      active: { color: 'yellow', label: 'In Progress' },
      ready_to_promote: { color: 'green', label: 'Ready' },
      promoted: { color: 'green', label: 'Published' },
      archived: { color: 'gray', label: 'Archived' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: 'gray',
      label: status,
    };

    return (
      <Badge colorScheme={config.color} size="sm">
        {config.label}
      </Badge>
    );
  };

  const renderValidationState = () => {
    if (!draft) return null;

    // Check if there are validation errors
    const hasErrors = draft.validation_errors && draft.validation_errors.length > 0;

    if (hasErrors) {
      return (
        <Box bg="red.50" p={3} borderRadius="md">
          <Text fontWeight="semibold" color="red.700" mb={2}>
            Validation Errors
          </Text>
          <VStack align="stretch" gap={1}>
            {draft.validation_errors.map((error: ValidationMessage, idx: number) => (
              <Text key={idx} fontSize="sm" color="red.600">
                • {error.field || 'General'}: {error.message || JSON.stringify(error)}
              </Text>
            ))}
          </VStack>
        </Box>
      );
    }

    if (draft.validation_warnings && draft.validation_warnings.length > 0) {
      return (
        <Box bg="yellow.50" p={3} borderRadius="md">
          <Text fontWeight="semibold" color="yellow.700" mb={2}>
            Validation Warnings
          </Text>
          <VStack align="stretch" gap={1}>
            {draft.validation_warnings.map((warning: ValidationMessage, idx: number) => (
              <Text key={idx} fontSize="sm" color="yellow.600">
                • {warning.field || 'General'}: {warning.message || JSON.stringify(warning)}
              </Text>
            ))}
          </VStack>
        </Box>
      );
    }

    if (draft.is_valid) {
      return (
        <Box bg="green.50" p={3} borderRadius="md">
          <Text fontWeight="semibold" color="green.700">
            ✓ Valid
          </Text>
        </Box>
      );
    }

    return (
      <Box bg={sectionBg} p={3} borderRadius="md">
        <Text fontSize="sm" color="gray.600">
          Not yet validated
        </Text>
      </Box>
    );
  };

  return (
    <Drawer.Root open={!!draftId} onOpenChange={(e) => !e.open && onClose()} size="lg">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content bg={drawerBg}>
          <Drawer.Header>
            <Drawer.Title>
              {isLoading ? (
                <Skeleton height="24px" width="200px" />
              ) : draft ? (
                draft.title || '(Untitled Draft)'
              ) : (
                'Draft Details'
              )}
            </Drawer.Title>
            <Drawer.CloseTrigger />
          </Drawer.Header>

          <Drawer.Body>
            {isLoading ? (
              <VStack align="stretch" gap={4}>
                <Skeleton height="20px" />
                <Skeleton height="100px" />
                <Skeleton height="60px" />
              </VStack>
            ) : error ? (
              <Box textAlign="center" py={10}>
                <Text color="red.500" mb={4}>
                  Failed to load draft
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {error.message}
                </Text>
              </Box>
            ) : draft ? (
              <VStack align="stretch" gap={4}>
                {/* Status & Metadata */}
                <Box>
                  <HStack mb={2}>
                    {getStatusBadge(draft.status)}
                    <Badge colorScheme="purple" size="sm">
                      {draft.content_profile}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Created {formatDateTime(draft.created_at)}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    By {draft.author_name || 'Unknown'}
                  </Text>
                </Box>

                <Divider />

                {/* Summary */}
                {draft.summary && (
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      Summary
                    </Text>
                    <Text fontSize="sm" color="gray.700">
                      {draft.summary}
                    </Text>
                  </Box>
                )}

                {/* Content */}
                {draft.grist_body && (
                  <Box>
                    <Text fontWeight="semibold" mb={2}>
                      Content
                    </Text>
                    <Box
                      bg={sectionBg}
                      p={3}
                      borderRadius="md"
                      maxH="300px"
                      overflowY="auto"
                    >
                      <Text fontSize="sm" whiteSpace="pre-wrap">
                        {draft.grist_body}
                      </Text>
                    </Box>
                  </Box>
                )}

                <Divider />

                {/* Provenance */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Source
                  </Text>
                  <VStack align="stretch" gap={1}>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium" w="100px">
                        Type:
                      </Text>
                      <Badge variant="outline">{draft.source_type}</Badge>
                    </HStack>
                    {draft.source_id && (
                      <HStack>
                        <Text fontSize="sm" fontWeight="medium" w="100px">
                          ID:
                        </Text>
                        <Code fontSize="xs">{draft.source_id}</Code>
                      </HStack>
                    )}
                  </VStack>
                </Box>

                {/* Validation State */}
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Validation
                  </Text>
                  {renderValidationState()}
                </Box>

                {/* Provenance Bundle (if present) */}
                {draft.provenance_bundle &&
                  Object.keys(draft.provenance_bundle).length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>
                        Provenance Data
                      </Text>
                      <Box bg={sectionBg} p={3} borderRadius="md" overflow="auto">
                        <Code fontSize="xs" display="block" whiteSpace="pre">
                          {JSON.stringify(draft.provenance_bundle, null, 2)}
                        </Code>
                      </Box>
                    </Box>
                  )}
              </VStack>
            ) : null}
          </Drawer.Body>

          <Drawer.Footer>
            <HStack gap={2} w="full">
              {draft && onOpen && draft.status === 'candidate' && (
                <Button
                  colorScheme="blue"
                  flex={1}
                  onClick={() => {
                    onOpen(draft);
                    onClose();
                  }}
                >
                  Open for Editing
                </Button>
              )}
              {draft && onDiscard && draft.status === 'candidate' && (
                <Button
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => {
                    onDiscard(draft);
                    onClose();
                  }}
                >
                  Discard
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </HStack>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};
