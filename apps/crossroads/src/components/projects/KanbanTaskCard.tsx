"use client";

import { useState } from "react";
import {
  Box,
  Badge,
  HStack,
  IconButton,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@mixtape/api/clients/projects/projectsApi";

interface KanbanTaskCardProps {
  task: Task;
  onUpdate: (taskId: string, payload: { title?: string; summary?: string }) => Promise<void>;
  onArchive: (taskId: string) => Promise<void>;
  isDragOverlay?: boolean;
}

export function KanbanTaskCard({ task, onUpdate, onArchive, isDragOverlay }: KanbanTaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editSummary, setEditSummary] = useState(task.summary);
  const [isSaving, setIsSaving] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const gripColor = useColorModeValue("gray.400", "gray.500");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isDragOverlay });

  const style = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      };

  async function handleSave() {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;

    const changes: { title?: string; summary?: string } = {};
    if (trimmedTitle !== task.title) changes.title = trimmedTitle;
    if (editSummary.trim() !== task.summary) changes.summary = editSummary.trim();

    if (Object.keys(changes).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(task.id, changes);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setEditTitle(task.title);
    setEditSummary(task.summary);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <Box
        ref={setNodeRef}
        style={style}
        p="3"
        bg={cardBg}
        border="1px solid"
        borderColor="blue.300"
        borderRadius="md"
      >
        <VStack gap="2" align="stretch">
          <Input
            size="sm"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
          />
          <Textarea
            size="sm"
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
            placeholder="Summary (optional)"
            rows={2}
          />
          <HStack gap="2" justify="flex-end">
            <Box
              as="button"
              fontSize="xs"
              color={mutedColor}
              onClick={handleCancel}
              cursor="pointer"
            >
              Cancel
            </Box>
            <Box
              as="button"
              fontSize="xs"
              fontWeight="600"
              color="blue.500"
              onClick={handleSave}
              cursor="pointer"
              opacity={isSaving ? 0.5 : 1}
            >
              {isSaving ? "Saving..." : "Save"}
            </Box>
          </HStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      p="3"
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      _hover={{ borderColor: "blue.300" }}
      transition="border-color 0.15s"
    >
      <HStack gap="2" align="start">
        <Box
          {...attributes}
          {...listeners}
          cursor="grab"
          color={gripColor}
          _hover={{ color: "gray.600" }}
          _active={{ cursor: "grabbing" }}
          pt="0.5"
          flexShrink={0}
        >
          <GripIcon />
        </Box>

        <VStack gap="1" align="start" flex="1" minW="0">
          <HStack gap="2" w="full" justify="space-between">
            <Text
              fontSize="sm"
              fontWeight="500"
              lineClamp={2}
              cursor="pointer"
              onClick={() => setIsEditing(true)}
              textDecoration={task.completed_at ? "line-through" : "none"}
              color={task.completed_at ? mutedColor : undefined}
            >
              {task.title}
            </Text>
            {task.completed_at && (
              <Badge colorPalette="green" size="sm" flexShrink={0}>
                Done
              </Badge>
            )}
          </HStack>
          {task.summary && (
            <Text fontSize="xs" color={mutedColor} lineClamp={2}>
              {task.summary}
            </Text>
          )}
        </VStack>

        <IconButton
          aria-label="Archive task"
          size="xs"
          variant="ghost"
          color={mutedColor}
          _hover={{ color: "red.500" }}
          onClick={() => onArchive(task.id)}
          flexShrink={0}
        >
          <ArchiveIcon />
        </IconButton>
      </HStack>
    </Box>
  );
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
