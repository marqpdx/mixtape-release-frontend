'use client';

import { Box, HStack, Text, Badge } from '@chakra-ui/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical } from '@tabler/icons-react';
import type { Task, TaskSeverity, TaskTimeliness } from '@mixtape/api/clients/projects/projectsApi';

interface KanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const SEVERITY_COLOR: Record<TaskSeverity, string> = {
  low: 'gray',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
};

const SEVERITY_LABEL: Record<TaskSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'CRITICAL',
};

const TIMELINESS_COLOR: Record<TaskTimeliness, string> = {
  pressing: 'orange',
  normal: 'blue',
  eventually: 'gray',
};

const TIMELINESS_LABEL: Record<TaskTimeliness, string> = {
  pressing: 'Pressing',
  normal: 'Normal',
  eventually: 'Eventually',
};

export function KanbanCard({ task, onEdit }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isCritical = task.severity === 'critical';

  return (
    <Box
      ref={setNodeRef}
      style={style}
      className="kc-card"
      borderWidth="1px"
      borderRadius="md"
      p={3}
      bg={isCritical ? 'red.50' : 'white'}
      borderColor={isCritical ? 'red.300' : 'gray.200'}
      cursor="pointer"
      _hover={{ borderColor: isCritical ? 'red.400' : 'gray.300', shadow: 'sm' }}
      _dark={{
        bg: isCritical ? 'red.950' : 'gray.800',
        borderColor: isCritical ? 'red.500' : 'gray.600',
      }}
      onClick={() => onEdit(task)}
    >
      <HStack gap={2} align="flex-start">
        <Box
          {...attributes}
          {...listeners}
          cursor="grab"
          color="gray.400"
          pt="1px"
          flexShrink={0}
          onClick={e => e.stopPropagation()}
        >
          <IconGripVertical size={14} />
        </Box>
        <Box flex={1} minW={0}>
          <Text
            fontWeight="semibold"
            fontSize="sm"
            lineClamp={2}
            color={isCritical ? 'red.700' : undefined}
            _dark={{ color: isCritical ? 'red.300' : undefined }}
          >
            {task.title}
          </Text>

          {task.summary && (
            <Text fontSize="xs" color="gray.500" mt={1} lineClamp={2}>
              {task.summary}
            </Text>
          )}

          <HStack gap={1} mt={2} flexWrap="wrap">
            {task.task_type && (
              <Badge size="sm" variant="subtle" colorPalette="purple">
                {task.task_type.name}
              </Badge>
            )}
            <Badge
              size="sm"
              variant={isCritical ? 'solid' : 'subtle'}
              colorPalette={SEVERITY_COLOR[task.severity]}
            >
              {SEVERITY_LABEL[task.severity]}
            </Badge>
            <Badge size="sm" variant="outline" colorPalette={TIMELINESS_COLOR[task.timeliness]}>
              {TIMELINESS_LABEL[task.timeliness]}
            </Badge>
          </HStack>

          <HStack gap={3} mt={2} justify="space-between">
            {task.assignee_name && (
              <Text fontSize="xs" color="gray.500">
                {task.assignee_name}
              </Text>
            )}
            {task.due_date && (
              <Text
                fontSize="xs"
                color={task.is_overdue ? 'red.500' : 'gray.400'}
                fontWeight={task.is_overdue ? 'semibold' : 'normal'}
              >
                {task.is_overdue ? '⚠ ' : ''}{task.due_date}
              </Text>
            )}
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
}
