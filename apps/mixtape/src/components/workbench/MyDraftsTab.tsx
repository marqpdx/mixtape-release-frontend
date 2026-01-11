// src/components/workbench/MyDraftsTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Grid, GridItem, VStack, HStack, Text, Input, Textarea, Button, Badge } from '@chakra-ui/react';
import { useActiveDrafts, useMillDraft, useUpdateMillDraft, useValidateMillDraft, useMillDraftAction } from '@mixtape/api/hooks/workbench';
import type { MillDraftListItem } from '@mixtape/api/clients/workbench';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { toaster } from '@mixtape/core/lib/toaster';

interface MyDraftsTabProps {
  groupId: string;
  editingDraftId?: string; // Auto-select this draft if provided
}

export function MyDraftsTab({ groupId, editingDraftId }: MyDraftsTabProps) {
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(editingDraftId || null);

  const { drafts, isLoading, error } = useActiveDrafts('group', groupId);
  const { draft: selectedDraft, isLoading: isDraftLoading } = useMillDraft({
    draftId: selectedDraftId || '',
    enabled: !!selectedDraftId,
  });

  const { mutate: updateDraft, isPending: isUpdating } = useUpdateMillDraft();
  const { mutate: validateDraft, isPending: isValidating } = useValidateMillDraft();
  const { mutate: performAction, isPending: isPerformingAction } = useMillDraftAction();

  // Auto-select draft when editingDraftId changes
  useEffect(() => {
    if (editingDraftId) {
      setSelectedDraftId(editingDraftId);
    }
  }, [editingDraftId]);

  // Local form state for editing
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');

  // Sync form state when draft loads
  useEffect(() => {
    if (selectedDraft) {
      setTitle(selectedDraft.title);
      setSummary(selectedDraft.summary || '');
      setContent(selectedDraft.grist_body || '');
    }
  }, [selectedDraft]);

  const handleSave = () => {
    if (!selectedDraftId) return;

    updateDraft(
      {
        draftId: selectedDraftId,
        payload: {
          title: title.trim(),
          summary: summary.trim(),
          grist_body: content.trim(),
        },
      },
      {
        onSuccess: () => {
          toaster.create({
            title: 'Draft Saved',
            description: 'Changes saved successfully',
            type: 'success',
            duration: 2000,
          });
        },
        onError: (error: Error) => {
          toaster.create({
            title: 'Save Failed',
            description: error.message,
            type: 'error',
            duration: 5000,
          });
        },
      }
    );
  };

  const handleValidate = () => {
    if (!selectedDraftId) return;

    validateDraft(
      {
        draftId: selectedDraftId,
        payload: { hard: true },
      },
      {
        onSuccess: (response) => {
          if (response.is_valid) {
            toaster.create({
              title: 'Validation Passed',
              description: 'Draft is ready to promote',
              type: 'success',
              duration: 3000,
            });
          } else {
            toaster.create({
              title: 'Validation Issues',
              description: `Found ${response.errors.length} error(s)`,
              type: 'warning',
              duration: 4000,
            });
          }
        },
        onError: (error: Error) => {
          toaster.create({
            title: 'Validation Failed',
            description: error.message,
            type: 'error',
            duration: 5000,
          });
        },
      }
    );
  };

  const handlePromote = () => {
    if (!selectedDraftId) return;

    performAction(
      {
        draftId: selectedDraftId,
        payload: { action: 'promote' },
      },
      {
        onSuccess: (response) => {
          toaster.create({
            title: 'Draft Promoted',
            description: response.message,
            type: 'success',
            duration: 3000,
          });
          setSelectedDraftId(null); // Clear selection
        },
        onError: (error: Error) => {
          toaster.create({
            title: 'Promotion Failed',
            description: error.message,
            type: 'error',
            duration: 5000,
          });
        },
      }
    );
  };

  const handleArchive = () => {
    if (!selectedDraftId) return;

    performAction(
      {
        draftId: selectedDraftId,
        payload: { action: 'archive' },
      },
      {
        onSuccess: (response) => {
          toaster.create({
            title: 'Draft Archived',
            description: response.message,
            type: 'info',
            duration: 2000,
          });
          setSelectedDraftId(null);
        },
        onError: (error: Error) => {
          toaster.create({
            title: 'Archive Failed',
            description: error.message,
            type: 'error',
            duration: 5000,
          });
        },
      }
    );
  };

  if (error) {
    return (
      <MixtapeAlert
        status="error"
        title="Failed to Load Drafts"
        description={error.message}
      />
    );
  }

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Text color="gray.500">Loading drafts...</Text>
      </Box>
    );
  }

  if (drafts.length === 0) {
    return (
      <Box p={8} textAlign="center">
        <Text fontSize="lg" color="gray.500" mb={2}>
          No Active Drafts
        </Text>
        <Text fontSize="sm" color="gray.400">
          Create a new draft from the Compose tab to get started
        </Text>
      </Box>
    );
  }

  return (
    <Grid templateColumns="300px 1fr" gap={6} h="calc(100vh - 250px)">
      {/* Left: Draft List */}
      <GridItem>
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={2}>
            Active Drafts ({drafts.length})
          </Text>

          {drafts.map((draft: MillDraftListItem) => (
            <Box
              key={draft.id}
              p={3}
              border="1px"
              borderColor={selectedDraftId === draft.id ? 'blue.500' : 'gray.200'}
              borderRadius="md"
              bg={selectedDraftId === draft.id ? 'blue.50' : 'white'}
              cursor="pointer"
              _hover={{ borderColor: 'blue.300', bg: 'blue.50' }}
              onClick={() => setSelectedDraftId(draft.id)}
            >
              <Text fontSize="sm" fontWeight="semibold" lineClamp={2}>
                {draft.title}
              </Text>
              <HStack mt={1} gap={2}>
                <Badge size="sm" colorScheme={draft.is_valid ? 'green' : 'yellow'}>
                  {draft.is_valid ? 'Valid' : 'Unvalidated'}
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  {draft.content_profile}
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.400" mt={1}>
                Updated {new Date(draft.updated_at).toLocaleDateString()}
              </Text>
            </Box>
          ))}
        </VStack>
      </GridItem>

      {/* Right: Editor */}
      <GridItem>
        {selectedDraftId && selectedDraft ? (
          <VStack align="stretch" gap={4} h="full">
            {/* Header */}
            <HStack justify="space-between">
              <VStack align="start" gap={0}>
                <Text fontSize="lg" fontWeight="semibold">
                  Edit Draft
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {selectedDraft.content_profile} • {selectedDraft.source_type}
                </Text>
              </VStack>

              <Badge
                size="sm"
                colorScheme={selectedDraft.is_valid ? 'green' : 'yellow'}
              >
                {selectedDraft.validation_state}
              </Badge>
            </HStack>

            {/* Validation Errors */}
            {selectedDraft.validation_errors && selectedDraft.validation_errors.length > 0 && (
              <MixtapeAlert
                status="error"
                title={`${selectedDraft.validation_errors.length} Validation Error(s)`}
                description={selectedDraft.validation_errors
                  .map((err: { message?: string }) => `• ${err.message || 'Unknown error'}`)
                  .join('\n')}
              />
            )}

            {/* Validation Warnings */}
            {selectedDraft.validation_warnings && selectedDraft.validation_warnings.length > 0 && (
              <MixtapeAlert
                status="warning"
                title={`${selectedDraft.validation_warnings.length} Warning(s)`}
                description={selectedDraft.validation_warnings
                  .map((warn: { message?: string }) => `• ${warn.message || 'Unknown warning'}`)
                  .join('\n')}
              />
            )}

            {/* Form */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Title <Text as="span" color="red.500">*</Text>
              </Text>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Draft title"
                size="md"
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Summary
              </Text>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary"
                rows={3}
                size="sm"
              />
            </Box>

            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Content
              </Text>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Main content"
                rows={12}
                size="sm"
                h="calc(100% - 30px)"
              />
            </Box>

            {/* Actions */}
            <HStack gap={2} pt={4} borderTop="1px" borderColor="gray.200">
              <Button
                onClick={handleSave}
                loading={isUpdating}
                colorScheme="blue"
                disabled={!title.trim()}
              >
                Save Changes
              </Button>

              <Button
                onClick={handleValidate}
                loading={isValidating}
                variant="outline"
              >
                Validate
              </Button>

              <Button
                onClick={handlePromote}
                loading={isPerformingAction}
                colorScheme="green"
                disabled={!selectedDraft.is_valid}
              >
                Promote →
              </Button>

              <Box flex="1" />

              <Button
                onClick={handleArchive}
                loading={isPerformingAction}
                variant="ghost"
                colorScheme="gray"
              >
                Archive
              </Button>
            </HStack>
          </VStack>
        ) : (
          <Box p={8} textAlign="center" color="gray.400">
            {isDraftLoading ? (
              <Text>Loading draft...</Text>
            ) : (
              <Text>Select a draft from the list to edit</Text>
            )}
          </Box>
        )}
      </GridItem>
    </Grid>
  );
}
