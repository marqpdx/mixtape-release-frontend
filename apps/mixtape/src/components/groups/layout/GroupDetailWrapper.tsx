// apps/mixtape/src/components/groups/GroupDetailWrapper.tsx

"use client";

import { Box, Spinner, Center, Text, Alert, HStack, Badge, Button } from "@chakra-ui/react";
import { IconAlertCircle } from "@tabler/icons-react";
import { useGroup, useGroupMutations, useGroupDraft } from "@mixtape/api/hooks/groups/useGroups";
import GroupEditForm from "@/components/groups/forms/GroupEditForm";
import { Group } from "@mixtape/core/types/groupTypes";

interface GroupDetailWrapperProps {
  slug: string;
  onSuccess?: (group: Group) => void;
  renderComponent?: (group: Group) => React.ReactNode;
  enableDraftMode?: boolean;
}

export default function GroupDetailWrapper({
  slug,
  onSuccess,
  renderComponent,
  enableDraftMode = false,
}: GroupDetailWrapperProps) {
  // Fetch group with React Query
  const { group, isLoading: loading, error: queryError, refetch } = useGroup(slug);

  // Mutations for immediate saves
  const { updateGroup, publishGroup, isUpdating, isPublishing } = useGroupMutations(slug);

  // Draft mode (optional)
  const draft = useGroupDraft(slug);

  const error = queryError?.message || null;

  if (loading) {
    return (
      <Center minH="400px">
        <Box textAlign="center">
          <Spinner size="xl" color="green.500" />
          <Text mt={4} color="gray.600">Loading group details...</Text>
        </Box>
      </Center>
    );
  }

  if (error || !group) {
    return (
      <Center minH="400px">
        <Alert.Root status="error" maxW="400px">
          <IconAlertCircle />
          <Alert.Title>Unable to Load Group</Alert.Title>
          <Alert.Description>
            {error || 'Group not found'}
          </Alert.Description>
        </Alert.Root>
      </Center>
    );
  }

  // Custom render function takes precedence
  if (renderComponent) {
    return <>{renderComponent(group)}</>;
  }

  // Handle save (works for both draft and immediate modes)
  const handleSave = async (updates: Partial<Group>) => {
    try {
      if (draft.isDraftMode) {
        draft.updateDraft(updates);
      } else {
        await updateGroup(updates);
        await refetch();
        onSuccess?.(group);
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handlePublish = async () => {
    try {
      await publishGroup();
      await refetch();
      onSuccess?.(group);
    } catch (error) {
      console.error('Publish failed:', error);
    }
  };

  // Edit mode only
  return (
    <Box>
      {/* Status badges */}
      <HStack mb={4} justify="flex-end" gap={2} flexWrap="wrap">
        {enableDraftMode && draft.isDraftMode && (
          <Badge colorScheme="orange">
            Draft Mode {draft.isAutoSaving && '(Saving...)'}
          </Badge>
        )}

        {draft.lastSaved && (
          <Text fontSize="xs" color="gray.500">
            Saved {draft.lastSaved.toLocaleTimeString()}
          </Text>
        )}

        {group.status === 'draft' && (
          <Badge colorScheme="yellow">Draft</Badge>
        )}
        {!group.is_active && (
          <Badge colorScheme="red">Inactive</Badge>
        )}
      </HStack>

      {/* Draft mode controls (optional feature) */}
      {enableDraftMode && (
        <Box mb={4} p={3} bg="blue.50" borderRadius="md">
          {!draft.isDraftMode ? (
            <HStack gap={2}>
              <Button
                size="sm"
                onClick={draft.enterDraftMode}
                colorScheme="blue"
              >
                Enter Draft Mode (Auto-save)
              </Button>
              <Text fontSize="sm" color="gray.600">
                Changes will save automatically every 3 seconds
              </Text>
            </HStack>
          ) : (
            <HStack gap={2} flexWrap="wrap">
              <Button
                size="sm"
                onClick={draft.saveDraft}
                loading={draft.isAutoSaving}
                colorScheme="green"
                disabled={!draft.hasPendingChanges}
              >
                Save Now
              </Button>
              <Button
                size="sm"
                onClick={draft.discardDraft}
                colorScheme="red"
                variant="outline"
                disabled={!draft.hasPendingChanges}
              >
                Discard Changes
              </Button>
              <Button
                size="sm"
                onClick={draft.exitDraftMode}
                variant="outline"
              >
                Exit Draft Mode
              </Button>
              {group.status === 'draft' && (
                <Button
                  size="sm"
                  onClick={handlePublish}
                  loading={isPublishing}
                  colorScheme="purple"
                >
                  Publish Group
                </Button>
              )}
            </HStack>
          )}
        </Box>
      )}

      {/* Edit form */}
      <GroupEditForm
        group={group}
        onSuccess={() => {
          refetch();
          onSuccess?.(group);
        }}
        isSaving={draft.isDraftMode ? draft.isAutoSaving : isUpdating}
        isDraftMode={enableDraftMode && draft.isDraftMode}
        onFieldChange={enableDraftMode && draft.isDraftMode ? handleSave : undefined}
      />
    </Box>
  );
}