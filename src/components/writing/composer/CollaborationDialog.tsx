// components/writing/composer/CollaborationDialog.tsx
/**
 * Dialog for managing collaboration on a working document
 * - Enable/rescind collaboration
 * - Add/remove collaborators with roles (editor/commenter)
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Separator,
  Dialog,
  Badge,
  Button,
} from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import type {
  DispatchContent,
  CollaboratorRole,
  DispatchCollaborator,
} from '@/types/dispatchTypes';

interface CollaborationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCollaborative: boolean;
  dispatchContent: DispatchContent | null;
  onEnableCollaboration: () => Promise<void>;
  onRescindCollaboration: () => Promise<void>;
  onAddCollaborators: (userIds: number[], role: CollaboratorRole) => Promise<void>;
  onRemoveCollaborators: (userIds: number[]) => Promise<void>;
  loading?: boolean;
  canBeRescinded?: boolean;
}

export function CollaborationDialog({
  open,
  onOpenChange,
  isCollaborative,
  dispatchContent,
  onEnableCollaboration,
  onRescindCollaboration,
  onAddCollaborators,
  onRemoveCollaborators,
  loading = false,
  canBeRescinded = false,
}: CollaborationDialogProps) {
  const [rescinding, setRescinding] = useState(false);

  // Separate collaborators by role
  const editors = useMemo(
    () => dispatchContent?.collaborator_details.filter(c => c.role === 'editor') ?? [],
    [dispatchContent]
  );

  const commenters = useMemo(
    () => dispatchContent?.collaborator_details.filter(c => c.role === 'commenter') ?? [],
    [dispatchContent]
  );

  const handleEnableCollaboration = async () => {
    try {
      await onEnableCollaboration();
      toaster.create({
        title: 'Collaboration enabled',
        description: 'You can now invite others to collaborate',
        type: 'success',
      });
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleRescind = async () => {
    if (!canBeRescinded) {
      toaster.create({
        title: 'Cannot rescind',
        description: 'Collaborators have made edits. You cannot rescind collaboration.',
        type: 'error',
      });
      return;
    }

    setRescinding(true);
    try {
      await onRescindCollaboration();
      onOpenChange(false);
    } catch (err) {
      // Error handled in hook
    } finally {
      setRescinding(false);
    }
  };

  const handleRemove = async (collaborator: DispatchCollaborator) => {
    try {
      await onRemoveCollaborators([collaborator.user.id]);
    } catch (err) {
      // Error handled in hook
    }
  };

  if (!isCollaborative) {
    // Show enable collaboration screen
    return (
      <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Enable Collaboration</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} align="stretch">
              <Text>
                Enable collaboration to work with others on this document. You can add
                editors who can make changes, or reviewers who can only comment.
              </Text>

              <Box
                p={4}
                bg="blue.50"
                borderRadius="md"
                borderLeft="4px solid"
                borderColor="blue.500"
              >
                <VStack align="stretch" gap={2}>
                  <Text fontWeight="medium" fontSize="sm">
                    What happens when you enable collaboration?
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    • You'll switch to real-time collaborative editing (Yjs)
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    • You can invite editors and reviewers
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    • Changes sync automatically between collaborators
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    • You can rescind collaboration if no one else has edited
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleEnableCollaboration}
              loading={loading}
            >
              Enable Collaboration
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  // Show collaboration management screen
  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} size="lg">
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Manage Collaboration</Dialog.Title>
          <Dialog.CloseTrigger />
        </Dialog.Header>

        <Dialog.Body>
          <VStack gap={6} align="stretch">
            {/* Editors Section */}
            <Box>
              <HStack mb={3}>
                <Text fontWeight="semibold" fontSize="md">
                  Editors
                </Text>
                <Badge colorScheme="blue" size="sm">
                  {editors.length}
                </Badge>
              </HStack>

              {editors.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No editors yet
                </Text>
              ) : (
                <VStack align="stretch" gap={2}>
                  {editors.map((collab) => (
                    <HStack key={collab.id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                      <VStack align="start" gap={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {collab.user.first_name} {collab.user.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          @{collab.user.username}
                        </Text>
                      </VStack>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleRemove(collab)}
                        loading={loading}
                      >
                        Remove
                      </Button>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Box>

            <Separator />

            {/* Reviewers/Commenters Section */}
            <Box>
              <HStack mb={3}>
                <Text fontWeight="semibold" fontSize="md">
                  Reviewers
                </Text>
                <Badge colorScheme="purple" size="sm">
                  {commenters.length}
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  (can comment only)
                </Text>
              </HStack>

              {commenters.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No reviewers yet
                </Text>
              ) : (
                <VStack align="stretch" gap={2}>
                  {commenters.map((collab) => (
                    <HStack key={collab.id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                      <VStack align="start" gap={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {collab.user.first_name} {collab.user.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          @{collab.user.username}
                        </Text>
                      </VStack>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleRemove(collab)}
                        loading={loading}
                      >
                        Remove
                      </Button>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Box>

            <Separator />

            {/* Add Collaborators Section */}
            <Box>
              <Text fontWeight="semibold" fontSize="md" mb={3}>
                Add Collaborators
              </Text>
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Search and invite functionality coming soon
                </Text>
              </Box>
            </Box>

            <Separator />

            {/* Rescind Collaboration Section */}
            {canBeRescinded && (
              <Box
                p={4}
                bg="orange.50"
                borderRadius="md"
                borderLeft="4px solid"
                borderColor="orange.500"
              >
                <VStack align="stretch" gap={3}>
                  <Text fontWeight="semibold" fontSize="sm" color="orange.900">
                    ⚠️ Rescind Collaboration
                  </Text>
                  <Text fontSize="sm" color="orange.800">
                    Stop all collaboration and return to solo editing mode. This will
                    delete the collaboration session and remove all collaborators.
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="orange"
                    variant="outline"
                    onClick={handleRescind}
                    loading={rescinding}
                  >
                    Rescind Collaboration
                  </Button>
                </VStack>
              </Box>
            )}

            {!canBeRescinded && dispatchContent?.has_collaborative_edits && (
              <Box p={3} bg="blue.50" borderRadius="md">
                <Text fontSize="sm" color="blue.800">
                  💡 Collaborators have made edits. You can no longer rescind collaboration.
                </Text>
              </Box>
            )}
          </VStack>
        </Dialog.Body>

        <Dialog.Footer>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
