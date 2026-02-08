// apps/mixtape/src/components/workbench/PromoteItemDialog.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Badge,
  Input,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
  DialogBackdrop,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProjectsList, useProjectCreate } from '@mixtape/api/hooks/projects';
import { usePromoteListItem } from '@mixtape/api/hooks/lists';
import { toaster } from '@mixtape/core/lib/toaster';
import type { Project } from '@mixtape/api/clients/projects/projectsApi';

interface PromoteItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  itemText: string;
  itemIndex: number;
}

export function PromoteItemDialog({
  isOpen,
  onClose,
  listId,
  itemText,
}: PromoteItemDialogProps) {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  // Fetch user's projects
  const { projects, isLoading: isLoadingProjects, addProject } = useProjectsList(
    user ? { sponsor_type: 'user', sponsor_object_id: user.id } : null
  );

  // Create project
  const { createProject, isCreating } = useProjectCreate();

  // Promote mutation
  const promoteMutation = usePromoteListItem();

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProjectId(null);
      setShowCreateForm(false);
      setNewProjectTitle('');
    }
  }, [isOpen]);

  const handleCreateProject = useCallback(async () => {
    if (!newProjectTitle.trim() || !user) return;

    try {
      const newProject = await createProject({
        title: newProjectTitle.trim(),
        sponsor_content_type: 'user',
        sponsor_object_id: user.id,
        mode: 'project',
      });

      // Add to local list and select it
      addProject(newProject);
      setSelectedProjectId(newProject.id);
      setShowCreateForm(false);
      setNewProjectTitle('');

      toaster.create({
        title: 'Project created',
        type: 'success',
        duration: 2000,
      });
    } catch (err) {
      toaster.create({
        title: 'Failed to create project',
        description: err instanceof Error ? err.message : 'Unknown error',
        type: 'error',
        duration: 3000,
      });
    }
  }, [newProjectTitle, user, createProject, addProject]);

  const handlePromote = useCallback(async () => {
    if (!selectedProjectId) {
      toaster.create({ title: 'Select a project', type: 'warning', duration: 2000 });
      return;
    }

    try {
      await promoteMutation.mutateAsync({
        listId,
        payload: {
          project_id: selectedProjectId,
          item_text: itemText,
        },
      });

      toaster.create({
        title: 'Item promoted to project',
        type: 'success',
        duration: 2000,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to promote item';
      // Handle already promoted case
      if (message.includes('already been promoted')) {
        toaster.create({
          title: 'Already promoted',
          description: 'This item has already been promoted to a task',
          type: 'info',
          duration: 3000,
        });
      } else {
        toaster.create({
          title: 'Promote failed',
          description: message,
          type: 'error',
          duration: 4000,
        });
      }
    }
  }, [selectedProjectId, listId, itemText, promoteMutation, onClose]);

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <DialogBackdrop />
      <DialogContent maxW="md">
        <DialogHeader>
          <DialogTitle>Promote to Project</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={4}>
            {/* Item preview */}
            <Box p={3} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.200">
              <Text fontSize="xs" color="gray.500" mb={1}>Item to promote:</Text>
              <Text fontSize="sm" fontWeight="medium">{itemText}</Text>
            </Box>

            {/* Project selection */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Select destination project:</Text>

              {isLoadingProjects ? (
                <Text fontSize="sm" color="gray.500">Loading projects...</Text>
              ) : (
                <VStack align="stretch" gap={2}>
                  {/* Existing projects */}
                  {projects.length > 0 && (
                    <VStack align="stretch" gap={2} maxH="200px" overflowY="auto">
                      {projects.map((project: Project) => (
                        <Box
                          key={project.id}
                          p={2}
                          border="1px"
                          borderColor={selectedProjectId === project.id ? 'blue.500' : 'gray.200'}
                          borderRadius="md"
                          bg={selectedProjectId === project.id ? 'blue.50' : 'white'}
                          cursor="pointer"
                          _hover={{ borderColor: 'blue.300' }}
                          onClick={() => setSelectedProjectId(project.id)}
                        >
                          <HStack justify="space-between">
                            <Text fontSize="sm" fontWeight="medium">{project.title}</Text>
                            <Badge size="xs" colorScheme={project.mode === 'project' ? 'blue' : 'gray'}>
                              {project.mode}
                            </Badge>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  )}

                  {/* Create new project */}
                  {showCreateForm ? (
                    <Box p={3} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                      <Text fontSize="xs" color="blue.600" mb={2}>New project:</Text>
                      <HStack gap={2}>
                        <Input
                          size="sm"
                          placeholder="Project title"
                          value={newProjectTitle}
                          onChange={(e) => setNewProjectTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={handleCreateProject}
                          loading={isCreating}
                          disabled={!newProjectTitle.trim()}
                        >
                          Create
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewProjectTitle('');
                          }}
                        >
                          Cancel
                        </Button>
                      </HStack>
                    </Box>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      onClick={() => setShowCreateForm(true)}
                    >
                      + Create New Project
                    </Button>
                  )}

                  {/* No projects message */}
                  {projects.length === 0 && !showCreateForm && (
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      No projects yet. Create one above.
                    </Text>
                  )}
                </VStack>
              )}
            </Box>

            <Text fontSize="xs" color="gray.500">
              The item will be added to the Backlog column of the selected project.
            </Text>
          </VStack>
        </DialogBody>

        <DialogFooter>
          <HStack gap={2}>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              size="sm"
              onClick={handlePromote}
              loading={promoteMutation.isPending}
              disabled={!selectedProjectId}
            >
              Promote
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
