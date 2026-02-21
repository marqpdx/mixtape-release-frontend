// apps/mixtape/src/components/earthlab/CourseOutlineEditor.tsx

'use client';

import { useMemo, useState } from 'react';
import { Box, VStack, HStack, Text, Button } from '@chakra-ui/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addCourseItem,
  removeCourseItem,
  reorderCourseItems,
} from '@mixtape/api/clients/earthlab/earthlabApi';
import type { CourseItemSummary } from '@mixtape/api/clients/earthlab/earthlabApi';
import { CourseOutlineItem } from './CourseOutlineItem';
import { ContentPickerDialog } from './ContentPickerDialog';
import { toaster } from '@/components/ui/toaster';

interface CourseOutlineEditorProps {
  groupSlug: string;
  courseSlug: string;
  items: CourseItemSummary[];
}

export function CourseOutlineEditor({ groupSlug, courseSlug, items }: CourseOutlineEditorProps) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const existingContentIds = useMemo(
    () => new Set(items.map((item) => item.content_id)),
    [items]
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['earthlab', 'course', groupSlug, courseSlug] });
  };

  const reorderMutation = useMutation({
    mutationFn: (reordered: { id: string; position: number }[]) =>
      reorderCourseItems(groupSlug, courseSlug, reordered),
    onSuccess: invalidate,
    onError: () => {
      toaster.create({ title: 'Failed to reorder', type: 'error' });
      invalidate();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeCourseItem(groupSlug, courseSlug, itemId),
    onSuccess: invalidate,
    onError: () => {
      toaster.create({ title: 'Failed to remove item', type: 'error' });
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: { content_type: string; content_id: string }) =>
      addCourseItem(groupSlug, courseSlug, data),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['earthlab', 'available-content', groupSlug] });
      toaster.create({ title: 'Item added', type: 'success' });
    },
    onError: () => {
      toaster.create({ title: 'Failed to add item', type: 'error' });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const updates = reordered.map((item, index) => ({
      id: item.id,
      position: index + 1,
    }));

    reorderMutation.mutate(updates);
  };

  const handleRemove = (itemId: string) => {
    removeMutation.mutate(itemId);
  };

  const handleAdd = (contentType: string, contentId: string) => {
    addMutation.mutate({ content_type: contentType, content_id: contentId });
  };

  return (
    <VStack align="stretch" gap={4}>
      <HStack justify="space-between">
        <Text fontSize="sm" color="gray.600">
          {items.length} {items.length === 1 ? 'item' : 'items'} in outline
        </Text>
        <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
          Add Content
        </Button>
      </HStack>

      {items.length === 0 ? (
        <Box textAlign="center" py={8} color="gray.500">
          <Text fontSize="md" mb={2}>No items in course outline</Text>
          <Text fontSize="sm">Add lessons and modules to build your course structure</Text>
        </Box>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <VStack align="stretch" gap={2}>
              {items.map((item) => (
                <CourseOutlineItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                />
              ))}
            </VStack>
          </SortableContext>
        </DndContext>
      )}

      <ContentPickerDialog
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        groupSlug={groupSlug}
        existingContentIds={existingContentIds}
        onAdd={handleAdd}
      />
    </VStack>
  );
}
