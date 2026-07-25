'use client';

import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  VStack,
  Spinner,
} from '@chakra-ui/react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGripVertical, IconTrash, IconEye, IconEyeOff } from '@tabler/icons-react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@/components/ui/dialog';
import { projectsApi } from '@mixtape/api/clients/projects/projectsApi';
import type { ProjectColumn } from '@mixtape/api/clients/projects/projectsApi';

interface KanbanColumnManagerProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  columns: ProjectColumn[];
  onColumnsChanged: () => void;
}

interface SortableColumnRowProps {
  column: ProjectColumn;
  onRename: (id: string, title: string) => void;
  onToggleHidden: (id: string) => void;
  onDelete: (id: string) => void;
  isBusy: boolean;
}

function SortableColumnRow({
  column,
  onRename,
  onToggleHidden,
  onDelete,
  isBusy,
}: SortableColumnRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(column.title);

  const commitRename = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== column.title) {
      onRename(column.id, draft.trim());
    } else {
      setDraft(column.title);
    }
  };

  return (
    <HStack
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="kcm-row"
      px={3}
      py={2}
      gap={2}
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      align="center"
    >
      <Box {...attributes} {...listeners} cursor="grab" color="gray.400" flexShrink={0}>
        <IconGripVertical size={14} />
      </Box>

      {editing ? (
        <Input
          size="sm"
          value={draft}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setDraft(column.title); setEditing(false); } }}
          autoFocus
          flex={1}
        />
      ) : (
        <Text
          flex={1}
          fontSize="sm"
          fontWeight="medium"
          color={column.is_hidden ? 'gray.400' : undefined}
          cursor="text"
          onClick={() => setEditing(true)}
          _hover={{ textDecor: 'underline' }}
        >
          {column.title}
          {column.semantic_type && (
            <Text as="span" fontSize="xs" color="gray.400" ml={2}>({column.semantic_type})</Text>
          )}
        </Text>
      )}

      {column.is_hidden && (
        <Text fontSize="xs" color="gray.400" flexShrink={0}>hidden</Text>
      )}

      <HStack gap={1} flexShrink={0}>
        <Button
          size="xs"
          variant="ghost"
          aria-label={column.is_hidden ? 'Show column' : 'Hide column'}
          onClick={() => onToggleHidden(column.id)}
          disabled={isBusy}
        >
          {column.is_hidden ? <IconEye size={13} /> : <IconEyeOff size={13} />}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          colorPalette="red"
          aria-label="Delete column"
          onClick={() => onDelete(column.id)}
          disabled={isBusy}
        >
          <IconTrash size={13} />
        </Button>
      </HStack>
    </HStack>
  );
}

export function KanbanColumnManager({
  open,
  onClose,
  projectId,
  columns: initialColumns,
  onColumnsChanged,
}: KanbanColumnManagerProps) {
  const [columns, setColumns] = useState<ProjectColumn[]>(initialColumns);
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setColumns(initialColumns);
  }, [open, initialColumns]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = columns.findIndex(c => c.id === active.id);
    const newIndex = columns.findIndex(c => c.id === over.id);
    const reordered = arrayMove(columns, oldIndex, newIndex).map((c, i) => ({ ...c, position: i }));
    setColumns(reordered);

    // Persist the moved column's new position
    const moved = reordered[newIndex];
    try {
      await projectsApi.updateColumn(projectId, moved.id, { position: moved.position });
      onColumnsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed');
      setColumns(initialColumns);
    }
  };

  const handleRename = async (columnId: string, title: string) => {
    setBusy(columnId);
    setError(null);
    try {
      const updated = await projectsApi.updateColumn(projectId, columnId, { title });
      setColumns(prev => prev.map(c => c.id === columnId ? updated : c));
      onColumnsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rename failed');
    } finally {
      setBusy(null);
    }
  };

  const handleToggleHidden = async (columnId: string) => {
    setBusy(columnId);
    setError(null);
    try {
      const updated = await projectsApi.toggleColumnHidden(projectId, columnId);
      setColumns(prev => prev.map(c => c.id === columnId ? updated : c));
      onColumnsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (columnId: string) => {
    setBusy(columnId);
    setError(null);
    try {
      await projectsApi.deleteColumn(projectId, columnId);
      setColumns(prev => prev.filter(c => c.id !== columnId));
      onColumnsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed — column may still have active tasks');
    } finally {
      setBusy(null);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const created = await projectsApi.createColumn(projectId, { title: newTitle.trim() });
      setColumns(prev => [...prev, created]);
      setNewTitle('');
      onColumnsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed');
    } finally {
      setAdding(false);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={({ open: o }) => { if (!o) onClose(); }}>
      <DialogContent className="kcm-content" maxW="480px">
        <DialogHeader className="kcm-header">
          <Text fontWeight="semibold">Manage columns</Text>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody className="kcm-body">
          <Text fontSize="sm" color="gray.500" mb={4}>
            Drag to reorder. Click a title to rename. Hidden columns stay in the model but don't show on the board.
          </Text>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <VStack gap={2} align="stretch" mb={4}>
                {columns.map(col => (
                  <SortableColumnRow
                    key={col.id}
                    column={col}
                    onRename={handleRename}
                    onToggleHidden={handleToggleHidden}
                    onDelete={handleDelete}
                    isBusy={busy === col.id}
                  />
                ))}
              </VStack>
            </SortableContext>
          </DndContext>

          <Box borderTopWidth="1px" borderColor="gray.200" _dark={{ borderColor: 'gray.700' }} pt={4}>
            <Text fontSize="sm" fontWeight="medium" mb={2}>Add column</Text>
            <HStack>
              <Input
                size="sm"
                placeholder="Column title"
                value={newTitle}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleAdd(); }}
                flex={1}
              />
              <Button size="sm" onClick={handleAdd} loading={adding} disabled={!newTitle.trim()}>
                Add
              </Button>
            </HStack>
          </Box>

          {error && <Text fontSize="sm" color="red.500" mt={3}>{error}</Text>}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
