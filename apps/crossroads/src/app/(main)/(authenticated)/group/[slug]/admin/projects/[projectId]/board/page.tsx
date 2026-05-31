"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Select,
  Portal,
  Spinner,
  Text,
  VStack,
  Link as ChakraLink,
  createListCollection,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { useProjectBoard } from "@mixtape/api/hooks/projects";
import { KanbanBoard } from "@/components/projects/KanbanBoard";

export default function ProjectBoardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const projectId = params.projectId as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [taskTitle, setTaskTitle] = useState("");
  const [taskColumnId, setTaskColumnId] = useState("");

  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const {
    board,
    isLoading,
    error,
    createTask,
    moveTask,
    updateTask,
    archiveTask,
    toggleColumnHidden,
    setBoard,
  } = useProjectBoard(projectId);

  const visibleColumns = useMemo(
    () => board?.columns.filter((c) => !c.is_hidden) ?? [],
    [board]
  );

  const columnCollection = useMemo(
    () =>
      createListCollection({
        items: visibleColumns.map((c) => ({ label: c.title, value: c.id })),
      }),
    [visibleColumns]
  );

  useEffect(() => {
    if (!taskColumnId && visibleColumns.length > 0) {
      const backlog = visibleColumns.find((c) => c.semantic_type === "backlog");
      setTaskColumnId(backlog?.id || visibleColumns[0].id);
    }
  }, [taskColumnId, visibleColumns]);

  async function handleCreateTask() {
    if (!taskTitle.trim()) return;
    await createTask({
      title: taskTitle.trim(),
      column_id: taskColumnId || undefined,
    });
    setTaskTitle("");
  }

  async function handleUpdateTask(
    taskId: string,
    payload: { title?: string; summary?: string }
  ) {
    await updateTask(taskId, payload);
  }

  async function handleArchiveTask(taskId: string) {
    await archiveTask(taskId);
  }

  async function handleToggleColumnHidden(columnId: string) {
    try {
      await toggleColumnHidden(columnId);
    } catch {
      // Validation error from backend if column has tasks
    }
  }

  if (authLoading || isLoading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Text color={mutedColor}>You must be logged in to view this page.</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box maxW="5xl" mx="auto" px="6" py="10">
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  if (!board) return null;

  return (
    <Box maxW="100%" mx="auto" px="4" py="6">
      <HStack mb="4" justify="space-between" align="center" flexWrap="wrap" gap="2">
        <VStack align="start" gap="0">
          <Heading size="lg">{board.project.title}</Heading>
          {board.project.summary && (
            <Text fontSize="sm" color={mutedColor}>
              {board.project.summary}
            </Text>
          )}
        </VStack>
        <ChakraLink
          href={`/group/${slug}/admin/projects`}
          fontSize="sm"
          color="blue.500"
        >
          Back to projects
        </ChakraLink>
      </HStack>

      <HStack gap="2" mb="4" flexWrap="wrap">
        <Input
          size="sm"
          maxW="260px"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="New task title"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateTask();
          }}
        />
        <Box maxW="180px">
          <Select.Root
            collection={columnCollection}
            value={taskColumnId ? [taskColumnId] : []}
            onValueChange={({ value }) => setTaskColumnId(value[0] ?? "")}
            size="sm"
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Column" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
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
        </Box>
        <Button
          size="sm"
          colorPalette="blue"
          onClick={handleCreateTask}
          disabled={!taskTitle.trim()}
        >
          Add task
        </Button>
      </HStack>

      <KanbanBoard
        board={board}
        onMoveTask={moveTask}
        onUpdateTask={handleUpdateTask}
        onArchiveTask={handleArchiveTask}
        onToggleColumnHidden={handleToggleColumnHidden}
        setBoard={setBoard}
      />
    </Box>
  );
}
