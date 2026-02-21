// apps/mixtape/src/components/earthlab/CourseOutlineItem.tsx

'use client';

import { useState } from 'react';
import { Box, HStack, Text, Badge, IconButton, Group } from '@chakra-ui/react';
import { IconGripVertical, IconTrash } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CourseItemSummary } from '@mixtape/api/clients/earthlab/earthlabApi';

const TYPE_COLORS: Record<string, string> = {
  lesson: 'blue',
  library: 'purple',
};

interface CourseOutlineItemProps {
  item: CourseItemSummary;
  onRemove: (itemId: string) => void;
}

export function CourseOutlineItem({ item, onRemove }: CourseOutlineItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      border="1px"
      borderColor={isDragging ? 'blue.300' : 'gray.200'}
      borderRadius="md"
      p={3}
      bg="white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <HStack justify="space-between" gap={2}>
        <HStack gap={2} flex={1}>
          <Box
            {...attributes}
            {...listeners}
            cursor="grab"
            color="gray.400"
            _hover={{ color: 'gray.600' }}
            _active={{ cursor: 'grabbing' }}
          >
            <IconGripVertical size={18} />
          </Box>

          <Text fontSize="sm" color="gray.400" w="24px" textAlign="right">
            {item.position}.
          </Text>

          <Badge colorScheme={TYPE_COLORS[item.content_type] || 'gray'} size="sm">
            {item.content_type === 'library' ? 'Module' : 'Lesson'}
          </Badge>

          <Text fontSize="sm" fontWeight="medium">{item.content_title}</Text>

          {item.estimated_duration && (
            <Text fontSize="xs" color="gray.500">{item.estimated_duration} min</Text>
          )}
        </HStack>

        <Group gap={1} opacity={isHovered ? 1 : 0} transition="opacity 0.2s">
          <IconButton
            aria-label="Remove from course"
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={() => onRemove(item.id)}
          >
            <IconTrash size={16} />
          </IconButton>
        </Group>
      </HStack>

      {item.section_title && (
        <Text fontSize="xs" color="gray.500" ml="66px" mt={1}>
          Section: {item.section_title}
        </Text>
      )}
    </Box>
  );
}
