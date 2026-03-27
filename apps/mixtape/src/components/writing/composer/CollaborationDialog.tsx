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
  Input,
} from '@chakra-ui/react';
import { toaster } from '@mixtape/core/lib/toaster';
import type {
  DispatchContent,
  CollaboratorRole,
  DispatchCollaborator,
} from '@mixtape/core/types/dispatchTypes';
import type { EligibleCollaborator } from '@hooks/useCollaboration';

interface CollaborationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCollaborative: boolean;
  dispatchContent: DispatchContent | null;
  eligibleCollaborators: EligibleCollaborator[];
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
  eligibleCollaborators,
  onEnableCollaboration,
  onRescindCollaboration,
  onAddCollaborators,
  onRemoveCollaborators,
  loading = false,
  canBeRescinded = false,
}: CollaborationDialogProps) {
  const [rescinding, setRescinding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollaborators, setSelectedCollaborators] = useState<Set<number>>(new Set());
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>('editor');

  // Separate collaborators by role
  const editors = useMemo(
    () => dispatchContent?.collaborator_details.filter(c => c.role === 'editor') ?? [],
    [dispatchContent]
  );

  const commenters = useMemo(
    () => dispatchContent?.collaborator_details.filter(c => c.role === 'commenter') ?? [],
    [dispatchContent]
  );

  // Filter eligible collaborators by search query and exclude current collaborators
  const filteredEligibleCollaborators = useMemo(() => {
    const currentCollaboratorIds = new Set(
      dispatchContent?.collaborator_details.map(c => c.user.id) ?? []
    );

    let filtered = eligibleCollaborators.filter(
      collab => !currentCollaboratorIds.has(collab.member_id)
    );

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(collab => {
        const fullName = `${collab.first_name} ${collab.last_name}`.toLowerCase();
        const username = collab.username.toLowerCase();
        return fullName.includes(query) || username.includes(query);
      });
    }

    return filtered;
  }, [eligibleCollaborators, dispatchContent, searchQuery]);

  const handleEnableCollaboration = async () => {
    try {
      await onEnableCollaboration();
      toaster.create({
        title: 'Collaboration enabled',
        description: 'You can now invite others to collaborate',
        type: 'success',
      });
    } catch {
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
    } catch {
      // Error handled in hook
    } finally {
      setRescinding(false);
    }
  };

  const handleRemove = async (collaborator: DispatchCollaborator) => {
    try {
      await onRemoveCollaborators([collaborator.user.id]);
    } catch {
      // Error handled in hook
    }
  };

  const toggleCollaboratorSelection = (userId: number) => {
    setSelectedCollaborators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleAddSelectedCollaborators = async () => {
    if (selectedCollaborators.size === 0) {
      toaster.create({
        title: 'No collaborators selected',
        description: 'Please select at least one person to add',
        type: 'warning',
      });
      return;
    }

    try {
      await onAddCollaborators(Array.from(selectedCollaborators), selectedRole);
      setSelectedCollaborators(new Set());
      setSearchQuery('');
    } catch {
      // Error handled in hook
    }
  };

  if (!isCollaborative) {
    // Show enable collaboration screen
    return (
      <Dialog.Root open={open} onOpenChange={(e: { open: boolean } | boolean) => onOpenChange(typeof e === "boolean" ? e : e.open)}>
        <Dialog.Content maxW="600px">
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
    <Dialog.Root open={open} onOpenChange={(e: { open: boolean } | boolean) => onOpenChange(typeof e === "boolean" ? e : e.open)} size="lg">
      <Dialog.Content maxW="600px">
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

              {filteredEligibleCollaborators.length === 0 && !searchQuery ? (
                <Box p={4} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    No eligible collaborators available. Only group members with writing permissions can collaborate.
                  </Text>
                </Box>
              ) : (
                <VStack align="stretch" gap={3}>
                  {/* Search input */}
                  <Input
                    placeholder="Search by name or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="sm"
                  />

                  {/* Role selector */}
                  <HStack gap={2}>
                    <Text fontSize="sm" fontWeight="medium">Add as:</Text>
                    <Button
                      size="xs"
                      variant={selectedRole === 'editor' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      onClick={() => setSelectedRole('editor')}
                    >
                      Editor
                    </Button>
                    <Button
                      size="xs"
                      variant={selectedRole === 'commenter' ? 'solid' : 'outline'}
                      colorScheme="purple"
                      onClick={() => setSelectedRole('commenter')}
                    >
                      Reviewer
                    </Button>
                  </HStack>

                  {/* Eligible collaborators list */}
                  {filteredEligibleCollaborators.length === 0 && searchQuery ? (
                    <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
                      No members found matching "{searchQuery}"
                    </Text>
                  ) : (
                    <Box maxH="200px" overflowY="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
                      <VStack align="stretch" gap={0}>
                        {filteredEligibleCollaborators.map((collab) => (
                          <HStack
                            key={collab.member_id}
                            p={2}
                            cursor="pointer"
                            bg={selectedCollaborators.has(collab.member_id) ? 'blue.50' : 'white'}
                            _hover={{ bg: 'gray.50' }}
                            borderBottom="1px solid"
                            borderColor="gray.100"
                            onClick={() => toggleCollaboratorSelection(collab.member_id)}
                          >
                            <Box
                              w="4"
                              h="4"
                              borderRadius="sm"
                              border="2px solid"
                              borderColor={selectedCollaborators.has(collab.member_id) ? 'blue.500' : 'gray.300'}
                              bg={selectedCollaborators.has(collab.member_id) ? 'blue.500' : 'white'}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {selectedCollaborators.has(collab.member_id) && (
                                <Box w="2" h="2" bg="white" />
                              )}
                            </Box>
                            <VStack align="start" gap={0} flex={1}>
                              <Text fontSize="sm" fontWeight="medium">
                                {collab.first_name} {collab.last_name}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                @{collab.username}
                              </Text>
                            </VStack>
                            {collab.roles.includes('steward') && (
                              <Badge size="xs" colorScheme="green">Steward</Badge>
                            )}
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {/* Add button */}
                  {selectedCollaborators.size > 0 && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={handleAddSelectedCollaborators}
                      loading={loading}
                    >
                      Add {selectedCollaborators.size} {selectedRole}(s)
                    </Button>
                  )}
                </VStack>
              )}
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
