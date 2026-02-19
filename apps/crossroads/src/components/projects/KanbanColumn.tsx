"use client";

import { Box, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ProjectColumn, Task } from "@mixtape/api/clients/projects/projectsApi";
import { KanbanTaskCard } from "./KanbanTaskCard";

interface KanbanColumnProps {
  column: ProjectColumn;
  tasks: Task[];
  onUpdateTask: (taskId: string, payload: { title?: string; summary?: string }) => Promise<void>;
  onArchiveTask: (taskId: string) => Promise<void>;
  onToggleHidden: (columnId: string) => Promise<void>;
}

export function KanbanColumn({
  column,
  tasks,
  onUpdateTask,
  onArchiveTask,
  onToggleHidden,
}: KanbanColumnProps) {
  const columnBg = useColorModeValue("gray.50", "gray.900");
  const headerBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <Box
      minW="280px"
      maxW="320px"
      w="280px"
      bg={columnBg}
      border="1px solid"
      borderColor={isOver ? "blue.300" : borderColor}
      borderRadius="lg"
      flexShrink={0}
      display="flex"
      flexDirection="column"
      maxH="full"
      transition="border-color 0.15s"
    >
      <HStack
        px="3"
        py="2"
        bg={headerBg}
        borderTopRadius="lg"
        justify="space-between"
      >
        <HStack gap="2">
          <Text fontSize="sm" fontWeight="600" textTransform="uppercase">
            {column.title}
          </Text>
          <Text fontSize="xs" color={mutedColor}>
            {tasks.length}
          </Text>
        </HStack>
        <IconButton
          aria-label={column.is_hidden ? "Show column" : "Hide column"}
          size="xs"
          variant="ghost"
          color={mutedColor}
          onClick={() => onToggleHidden(column.id)}
        >
          {column.is_hidden ? <EyeOffIcon /> : <EyeIcon />}
        </IconButton>
      </HStack>

      <Box ref={setNodeRef} flex="1" overflowY="auto" p="2" minH="80px">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <VStack gap="2" align="stretch">
            {tasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                onUpdate={onUpdateTask}
                onArchive={onArchiveTask}
              />
            ))}
          </VStack>
        </SortableContext>
        {tasks.length === 0 && (
          <Text fontSize="xs" color={mutedColor} textAlign="center" py="4">
            No tasks
          </Text>
        )}
      </Box>
    </Box>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
