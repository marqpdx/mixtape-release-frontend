// apps/mixtape/src/components/projects/ProjectsWorkArea.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Box,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  Select,
  Portal,
  Text,
  Textarea,
  VStack,
  Spinner,
  SimpleGrid,
  createListCollection,
} from '@chakra-ui/react';
import { useProjectBoard, useProjectCreate, useProjectsList } from '@mixtape/api/hooks';
import { Divider } from '../common/Divider';
import { HelpTip } from '@/components/help/HelpTip';
import { useHelpRegistration } from '@/components/help/useHelpRegistration';

interface ProjectsWorkAreaProps {
  groupId: string;
  groupSlug: string;
  groupTitle: string;
}

export default function ProjectsWorkArea({
  groupId,
  groupSlug,
  groupTitle,
}: ProjectsWorkAreaProps) {
  useHelpRegistration("ProjectsWorkArea");
  const [projectTitle, setProjectTitle] = useState('');
  const [projectSummary, setProjectSummary] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskSummary, setTaskSummary] = useState('');
  const [taskColumnId, setTaskColumnId] = useState('');
  const [moveTargets, setMoveTargets] = useState<Record<string, { columnId: string; position: number }>>({});
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  const {
    createProject,
    isCreating: isCreatingProject,
    error: createError,
    clearError: clearCreateError,
  } = useProjectCreate();

  const listParams = useMemo(
    () => ({
      sponsor_type: 'group',
      sponsor_object_id: groupId,
    }),
    [groupId]
  );

  const {
    projects,
    isLoading: isProjectsLoading,
    error: projectsError,
    addProject,
    loadProjects,
    clearError: clearProjectsError,
  } = useProjectsList(listParams);

  const {
    board,
    isLoading: isBoardLoading,
    error: boardError,
    createTask,
    moveTask,
    clearError: clearBoardError,
  } = useProjectBoard(activeProjectId);

  const visibleColumns = useMemo(
    () => board?.columns.filter(column => !column.is_hidden) ?? [],
    [board]
  );
  const projectCollection = useMemo(
    () => createListCollection({
      items: projects.map(project => ({ label: project.title, value: project.id })),
    }),
    [projects]
  );
  const columnCollection = useMemo(
    () => createListCollection({
      items: visibleColumns.map(column => ({ label: column.title, value: column.id })),
    }),
    [visibleColumns]
  );

  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      setActiveProjectId(projects[0].id);
    }
  }, [activeProjectId, projects]);

  useEffect(() => {
    if (!taskColumnId && visibleColumns.length > 0) {
      const backlog = visibleColumns.find(column => column.semantic_type === 'backlog');
      setTaskColumnId(backlog?.id || visibleColumns[0].id);
    }
  }, [taskColumnId, visibleColumns]);

  const handleCreateProject = async () => {
    if (!projectTitle.trim()) {
      return;
    }
    clearCreateError();

    const project = await createProject({
      title: projectTitle.trim(),
      summary: projectSummary.trim(),
      mode: 'list',
      sponsor_content_type: 'group',
      sponsor_object_id: groupId,
    });

    addProject(project);
    setActiveProjectId(project.id);
    setProjectTitle('');
    setProjectSummary('');
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !activeProjectId) {
      return;
    }
    clearBoardError();
    await createTask({
      title: taskTitle.trim(),
      summary: taskSummary.trim(),
      column_id: taskColumnId || undefined,
    });
    setTaskTitle('');
    setTaskSummary('');
  };

  const handleMoveTask = async (taskId: string) => {
    const target = moveTargets[taskId];
    if (!target) {
      return;
    }
    setMovingTaskId(taskId);
    try {
      await moveTask(taskId, {
        to_column_id: target.columnId,
        to_index: Math.max(0, target.position - 1),
      });
    } finally {
      setMovingTaskId(null);
    }
  };

  const updateMoveTarget = (taskId: string, columnId: string, position: number) => {
    setMoveTargets(prev => ({
      ...prev,
      [taskId]: { columnId, position },
    }));
  };

  return (
    <VStack align="stretch" gap={8}>
      <Box>
        <HStack justify="space-between" align="start" mb={2}>
          <Heading size="md">
            Projects
          </Heading>
          <HelpTip helpKey="projects-overview" />
        </HStack>
        <HStack gap={3} align="flex-end">
          <Box maxW="360px" w="full">
            <Field.Root>
              <Field.Label>Choose a project</Field.Label>
              <Select.Root
                collection={projectCollection}
                value={activeProjectId ? [activeProjectId] : []}
                onValueChange={({ value }) => setActiveProjectId(value[0] ?? null)}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText
                      placeholder={isProjectsLoading ? 'Loading projects...' : 'Select a project'}
                    />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {projectCollection.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
          </Box>
          <Button
            variant="outline"
            onClick={() => {
              clearProjectsError();
              void loadProjects();
            }}
            loading={isProjectsLoading}
          >
            Refresh
          </Button>
        </HStack>
        {projectsError && (
          <Text fontSize="sm" color="red.500" mt={2}>
            {projectsError}
          </Text>
        )}
      </Box>

      <Divider />

      <Box>
        <Heading size="md" mb={2}>
          Create a Project
        </Heading>
        <Text fontSize="sm" color="gray.600" mb={4}>
          Projects are scoped to {groupTitle} ({groupSlug}).
        </Text>
        <VStack align="stretch" gap={4}>
          <Field.Root>
            <Field.Label>Project title</Field.Label>
            <Input
              value={projectTitle}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setProjectTitle(event.target.value)}
              placeholder="Give this project a name"
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Summary</Field.Label>
            <Textarea
              value={projectSummary}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setProjectSummary(event.target.value)}
              placeholder="Optional short summary"
              rows={3}
            />
          </Field.Root>
          {createError && (
            <Text fontSize="sm" color="red.500">
              {createError}
            </Text>
          )}
          <HStack justify="flex-start">
            <Button
              colorScheme="green"
              onClick={handleCreateProject}
              loading={isCreatingProject}
              disabled={!projectTitle.trim()}
            >
              Create project
            </Button>
          </HStack>
        </VStack>
      </Box>

      <Divider />

      <Box>
        <Heading size="md" mb={2}>
          Tasks
        </Heading>
        {!activeProjectId && (
          <Text fontSize="sm" color="gray.600">
            Create a project to start adding tasks.
          </Text>
        )}

        {activeProjectId && (
          <VStack align="stretch" gap={6}>
            <Box>
              <Heading size="sm" mb={3}>
                Add a task
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root>
                  <Field.Label>Task title</Field.Label>
                  <Input
                    value={taskTitle}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setTaskTitle(event.target.value)}
                    placeholder="Task title"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Summary</Field.Label>
                  <Input
                    value={taskSummary}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setTaskSummary(event.target.value)}
                    placeholder="Optional summary"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Column</Field.Label>
                  <Select.Root
                    collection={columnCollection}
                    value={taskColumnId ? [taskColumnId] : []}
                    onValueChange={({ value }) => setTaskColumnId(value[0] ?? '')}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Choose column" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                        <Select.ClearTrigger />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {columnCollection.items.map((item) => (
                            <Select.Item item={item} key={item.value}>
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
              </SimpleGrid>
              <HStack mt={4}>
                <Button
                  colorScheme="blue"
                  onClick={handleCreateTask}
                  disabled={!taskTitle.trim()}
                >
                  Add task
                </Button>
              </HStack>
            </Box>

            <Box>
              <Heading size="sm" mb={3}>
                Board
              </Heading>
              {isBoardLoading && (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.600">
                    Loading tasks...
                  </Text>
                </HStack>
              )}
              {boardError && (
                <Text fontSize="sm" color="red.500" mt={2}>
                  {boardError}
                </Text>
              )}
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={4}>
                {visibleColumns.map(column => {
                  const tasks = board?.tasks_by_column[column.id] || [];
                  return (
                    <Box key={column.id} borderWidth="1px" borderRadius="md" p={4}>
                      <Heading size="xs" textTransform="uppercase" mb={3}>
                        {column.title}
                      </Heading>
                      <VStack align="stretch" gap={2}>
                        {tasks.length === 0 && (
                          <Text fontSize="sm" color="gray.500">
                            No tasks yet.
                          </Text>
                        )}
                        {tasks.map(task => {
                          const fallbackPosition = task.position + 1;
                          const target = moveTargets[task.id] || {
                            columnId: task.column,
                            position: fallbackPosition,
                          };
                          const columnCount = board?.tasks_by_column[target.columnId]?.length ?? 0;
                          const maxPosition = Math.max(1, columnCount);
                          return (
                            <Box key={task.id} borderWidth="1px" borderRadius="md" p={3}>
                              <Text fontWeight="semibold">{task.title}</Text>
                              {task.summary && (
                                <Text fontSize="sm" color="gray.600">
                                  {task.summary}
                                </Text>
                              )}
                              <HStack mt={3} gap={2} align="flex-end" flexWrap="wrap">
                                <Field.Root minW="140px">
                                  <Field.Label fontSize="xs">Move to</Field.Label>
                                  <Select.Root
                                    collection={columnCollection}
                                    value={[target.columnId]}
                                    onValueChange={({ value }) => {
                                      const nextColumnId = value[0];
                                      if (!nextColumnId) {
                                        return;
                                      }
                                      const nextLength = board?.tasks_by_column[nextColumnId]?.length ?? 0;
                                      updateMoveTarget(task.id, nextColumnId, Math.max(1, nextLength));
                                    }}
                                  >
                                    <Select.HiddenSelect />
                                    <Select.Control>
                                      <Select.Trigger>
                                        <Select.ValueText placeholder="Column" />
                                      </Select.Trigger>
                                      <Select.IndicatorGroup>
                                        <Select.Indicator />
                                        <Select.ClearTrigger />
                                      </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                      <Select.Positioner>
                                        <Select.Content>
                                          {columnCollection.items.map((item) => (
                                            <Select.Item item={item} key={item.value}>
                                              {item.label}
                                              <Select.ItemIndicator />
                                            </Select.Item>
                                          ))}
                                        </Select.Content>
                                      </Select.Positioner>
                                    </Portal>
                                  </Select.Root>
                                </Field.Root>
                                <Field.Root minW="110px">
                                  <Field.Label fontSize="xs">Position</Field.Label>
                                  <Input
                                    size="sm"
                                    type="number"
                                    min={1}
                                    max={maxPosition}
                                    value={target.position}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                      const nextValue = Number(event.target.value);
                                      updateMoveTarget(
                                        task.id,
                                        target.columnId,
                                        Math.max(1, Number.isNaN(nextValue) ? 1 : nextValue)
                                      );
                                    }}
                                  />
                                  <Text fontSize="xs" color="gray.500">
                                    1 = top
                                  </Text>
                                </Field.Root>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMoveTask(task.id)}
                                  loading={movingTaskId === task.id}
                                >
                                  Move
                                </Button>
                              </HStack>
                            </Box>
                          );
                        })}
                      </VStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          </VStack>
        )}
      </Box>
    </VStack>
  );
}
