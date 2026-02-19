"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Box, HStack } from "@chakra-ui/react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type {
  ProjectBoard,
  ProjectColumn,
  Task,
  TaskMovePayload,
} from "@mixtape/api/clients/projects/projectsApi";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTaskCard } from "./KanbanTaskCard";

interface KanbanBoardProps {
  board: ProjectBoard;
  onMoveTask: (taskId: string, payload: TaskMovePayload) => Promise<void>;
  onUpdateTask: (taskId: string, payload: { title?: string; summary?: string }) => Promise<void>;
  onArchiveTask: (taskId: string) => Promise<void>;
  onToggleColumnHidden: (columnId: string) => Promise<void>;
  setBoard: React.Dispatch<React.SetStateAction<ProjectBoard | null>>;
}

export function KanbanBoard({
  board,
  onMoveTask,
  onUpdateTask,
  onArchiveTask,
  onToggleColumnHidden,
  setBoard,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const snapshotRef = useRef<ProjectBoard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const visibleColumns = useMemo(
    () => board.columns.filter((c) => !c.is_hidden),
    [board.columns]
  );

  const findColumnForTask = useCallback(
    (taskId: string): string | null => {
      for (const [colId, tasks] of Object.entries(board.tasks_by_column)) {
        if (tasks.some((t) => t.id === taskId)) return colId;
      }
      return null;
    },
    [board.tasks_by_column]
  );

  function handleDragStart(event: DragStartEvent) {
    const taskId = String(event.active.id);
    snapshotRef.current = structuredClone(board);

    for (const tasks of Object.values(board.tasks_by_column)) {
      const found = tasks.find((t) => t.id === taskId);
      if (found) {
        setActiveTask(found);
        break;
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const sourceCol = findColumnForTask(activeId);
    // Over could be a column ID or a task ID
    let destCol = visibleColumns.find((c) => c.id === overId)
      ? overId
      : findColumnForTask(overId);

    if (!sourceCol || !destCol || sourceCol === destCol) return;

    // Move task across columns optimistically
    setBoard((prev) => {
      if (!prev) return prev;
      const sourceTasks = (prev.tasks_by_column[sourceCol] || []).filter(
        (t) => t.id !== activeId
      );
      const destTasks = [...(prev.tasks_by_column[destCol!] || [])];

      const task = (prev.tasks_by_column[sourceCol] || []).find(
        (t) => t.id === activeId
      );
      if (!task) return prev;

      // Insert at the position of the over item, or end
      const overIndex = destTasks.findIndex((t) => t.id === overId);
      const insertIndex = overIndex >= 0 ? overIndex : destTasks.length;
      destTasks.splice(insertIndex, 0, { ...task, column: destCol! });

      return {
        ...prev,
        tasks_by_column: {
          ...prev.tasks_by_column,
          [sourceCol]: sourceTasks,
          [destCol!]: destTasks,
        },
      };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      // Revert
      if (snapshotRef.current) setBoard(snapshotRef.current);
      snapshotRef.current = null;
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    // Determine destination column and index
    let destColId = visibleColumns.find((c) => c.id === overId)?.id;
    if (!destColId) {
      destColId = findColumnForTask(overId) ?? findColumnForTask(activeId) ?? undefined;
    }
    if (!destColId) {
      if (snapshotRef.current) setBoard(snapshotRef.current);
      snapshotRef.current = null;
      return;
    }

    const destTasks = board.tasks_by_column[destColId] || [];
    let toIndex = destTasks.findIndex((t) => t.id === activeId);
    if (toIndex < 0) toIndex = destTasks.length;

    try {
      await onMoveTask(activeId, { to_column_id: destColId, to_index: toIndex });
    } catch {
      // Revert on failure
      if (snapshotRef.current) setBoard(snapshotRef.current);
    }

    snapshotRef.current = null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box overflowX="auto" pb="4">
        <HStack gap="3" align="stretch" minH="400px" px="1">
          {visibleColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={board.tasks_by_column[column.id] || []}
              onUpdateTask={onUpdateTask}
              onArchiveTask={onArchiveTask}
              onToggleHidden={onToggleColumnHidden}
            />
          ))}
        </HStack>
      </Box>

      <DragOverlay>
        {activeTask ? (
          <KanbanTaskCard
            task={activeTask}
            onUpdate={async () => {}}
            onArchive={async () => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
