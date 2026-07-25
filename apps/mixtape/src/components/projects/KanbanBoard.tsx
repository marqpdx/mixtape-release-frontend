'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Heading,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { IconPlus } from '@tabler/icons-react';
import { useProjectBoard, useProjectsList, useTaskTypes } from '@mixtape/api/hooks';
import { KanbanCard } from './KanbanCard';
import { TaskModal } from './TaskModal';
import type { Task, TaskCreatePayload, TaskUpdatePayload } from '@mixtape/api/clients/projects/projectsApi';

interface KanbanBoardProps {
  groupId: string;
  groupSlug: string;
  groupTitle: string;
}

interface ColumnDropZoneProps {
  columnId: string;
  children: React.ReactNode;
}

function ColumnDropZone({ columnId, children }: ColumnDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  return (
    <Box
      ref={setNodeRef}
      flex={1}
      minH="60px"
      borderRadius="md"
      bg={isOver ? 'blue.50' : 'transparent'}
      _dark={{ bg: isOver ? 'blue.950' : 'transparent' }}
      transition="background 0.15s"
    >
      {children}
    </Box>
  );
}

export default function KanbanBoard({ groupId, groupSlug, groupTitle }: KanbanBoardProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultColumnId, setDefaultColumnId] = useState<string | undefined>();
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  const listParams = useMemo(
    () => ({ sponsor_type: 'group', sponsor_object_id: groupId }),
    [groupId]
  );

  const { projects, isLoading: projectsLoading } = useProjectsList(listParams);
  const { taskTypes } = useTaskTypes();

  const resolvedProjectId = activeProjectId ?? projects[0]?.id ?? null;

  const {
    board,
    isLoading: boardLoading,
    error: boardError,
    createTask,
    moveTask,
    updateTask,
    archiveTask,
  } = useProjectBoard(resolvedProjectId);

  const visibleColumns = useMemo(
    () => (board?.columns ?? []).filter(c => !c.is_hidden),
    [board]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = Object.values(board?.tasks_by_column ?? {}).flat().find(t => t.id === event.active.id);
    setActiveDragTask(task ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over || !board) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // over.id is either a column id or a task id — resolve target column
    const targetColumnId = visibleColumns.find(c => c.id === overId)?.id
      ?? Object.entries(board.tasks_by_column).find(([, tasks]) =>
        tasks.some(t => t.id === overId)
      )?.[0];

    if (!targetColumnId) return;

    const sourceTask = Object.values(board.tasks_by_column).flat().find(t => t.id === taskId);
    if (!sourceTask || sourceTask.column === targetColumnId) return;

    const targetTasks = board.tasks_by_column[targetColumnId] ?? [];
    await moveTask(taskId, { to_column_id: targetColumnId, to_index: targetTasks.length });
  };

  const openCreate = (colId?: string) => {
    setEditingTask(null);
    setDefaultColumnId(colId ?? visibleColumns.find(c => c.semantic_type === 'backlog')?.id);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setDefaultColumnId(undefined);
    setModalOpen(true);
  };

  const handleSave = async (payload: TaskCreatePayload | TaskUpdatePayload) => {
    if (editingTask) {
      await updateTask(editingTask.id, payload as TaskUpdatePayload);
    } else {
      await createTask(payload as TaskCreatePayload);
    }
  };

  const handleArchive = async () => {
    if (editingTask) await archiveTask(editingTask.id);
  };

  if (projectsLoading) {
    return (
      <HStack className="kb-loading" justify="center" py={12}>
        <Spinner size="sm" />
        <Text color="gray.500">Loading board…</Text>
      </HStack>
    );
  }

  if (!resolvedProjectId) {
    return (
      <Box className="kb-empty" py={12} textAlign="center">
        <Text color="gray.500" mb={4}>No project board found for {groupTitle}.</Text>
        <Text fontSize="sm" color="gray.400">
          A board is created automatically when a group is set up as a project space.
        </Text>
      </Box>
    );
  }

  return (
    <Box className="kb-root" h="full">
      <HStack className="kb-header" justify="space-between" mb={4} flexShrink={0}>
        <HStack gap={3}>
          <Heading size="md">{board?.project.title ?? groupTitle}</Heading>
          {boardLoading && <Spinner size="sm" />}
        </HStack>
        <Button size="sm" onClick={() => openCreate()} colorPalette="blue">
          <IconPlus size={14} />
          New task
        </Button>
      </HStack>

      {boardError && (
        <Text fontSize="sm" color="red.500" mb={3}>{boardError}</Text>
      )}

      <Box
        className="kb-board"
        overflowX="auto"
        pb={4}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <HStack className="kb-columns" align="flex-start" gap={4} minW="max-content">
            {visibleColumns.map(column => {
              const tasks = board?.tasks_by_column[column.id] ?? [];
              const taskIds = tasks.map(t => t.id);

              return (
                <Box
                  key={column.id}
                  className="kb-column"
                  w="280px"
                  flexShrink={0}
                  bg="gray.50"
                  _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="gray.200"
                  display="flex"
                  flexDir="column"
                  maxH="calc(100vh - 220px)"
                >
                  <HStack
                    className="kb-col-header"
                    px={3}
                    py={2}
                    justify="space-between"
                    flexShrink={0}
                    borderBottomWidth="1px"
                    borderColor="gray.200"
                    _dark={{ borderColor: 'gray.700' }}
                  >
                    <HStack gap={2}>
                      <Text fontWeight="semibold" fontSize="sm" textTransform="uppercase" letterSpacing="wide" color="gray.600" _dark={{ color: 'gray.400' }}>
                        {column.title}
                      </Text>
                      <Text fontSize="xs" color="gray.400" bg="gray.200" _dark={{ bg: 'gray.700', color: 'gray.400' }} px={1.5} py={0.5} borderRadius="sm">
                        {tasks.length}
                      </Text>
                    </HStack>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => openCreate(column.id)}
                      aria-label={`Add task to ${column.title}`}
                    >
                      <IconPlus size={12} />
                    </Button>
                  </HStack>

                  <Box className="kb-col-tasks" overflowY="auto" flex={1} p={2}>
                    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                      <ColumnDropZone columnId={column.id}>
                        <VStack gap={2} align="stretch">
                          {tasks.map(task => (
                            <KanbanCard key={task.id} task={task} onEdit={openEdit} />
                          ))}
                          {tasks.length === 0 && (
                            <Text
                              fontSize="xs"
                              color="gray.400"
                              textAlign="center"
                              py={4}
                            >
                              Drop tasks here
                            </Text>
                          )}
                        </VStack>
                      </ColumnDropZone>
                    </SortableContext>
                  </Box>
                </Box>
              );
            })}
          </HStack>

          <DragOverlay>
            {activeDragTask && (
              <Box opacity={0.9} shadow="lg">
                <KanbanCard task={activeDragTask} onEdit={() => {}} />
              </Box>
            )}
          </DragOverlay>
        </DndContext>
      </Box>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onArchive={editingTask ? handleArchive : undefined}
        task={editingTask}
        taskTypes={taskTypes}
        defaultColumnId={defaultColumnId}
        columns={visibleColumns}
      />
    </Box>
  );
}
